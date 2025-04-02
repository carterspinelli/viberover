import { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '../hooks/use-is-mobile';
import { useRover } from '../lib/stores/useRover';
import { Controls } from '../App';

// Component doesn't use props since it talks directly to the rover store
interface TouchControlsProps {
  setControlState?: (control: Controls, pressed: boolean) => void;
}

// Joystick positions
interface JoystickState {
  x: number;
  y: number;
  active: boolean;
}

export default function MobileTouchControls({ setControlState }: TouchControlsProps) {
  const isMobile = useIsMobile();
  
  // Get rover control functions from the store
  const { 
    accelerate,
    decelerate,
    turnLeft,
    turnRight,
    stopTurning
  } = useRover();
  
  // Track active touch controls
  const [activeControls, setActiveControls] = useState<{
    forward: boolean;
    backward: boolean;
    leftward: boolean;
    rightward: boolean;
    boost: boolean;
  }>({
    forward: false,
    backward: false,
    leftward: false,
    rightward: false,
    boost: false
  });
  
  // Joystick states
  const [leftJoystick, setLeftJoystick] = useState<JoystickState>({ x: 0, y: 0, active: false });
  const [rightJoystick, setRightJoystick] = useState<JoystickState>({ x: 0, y: 0, active: false });
  
  // References to joystick base elements
  const leftJoystickRef = useRef<HTMLDivElement>(null);
  const rightJoystickRef = useRef<HTMLDivElement>(null);
  
  // Active touch identifiers
  const leftTouchIdRef = useRef<number | null>(null);
  const rightTouchIdRef = useRef<number | null>(null);
  
  // Use a ref to track the animation frame for movement
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  
  // Frame-based movement handling with requestAnimationFrame
  useEffect(() => {
    const handleMovement = (timestamp: number) => {
      // Calculate delta time (in seconds)
      const delta = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 1/60;
      lastTimeRef.current = timestamp;
      
      // Apply forward/backward movement
      if (activeControls.forward) {
        accelerate(delta);
      } else if (activeControls.backward) {
        decelerate(delta);
      }
      
      // Apply turning
      if (activeControls.leftward) {
        turnLeft(delta);
      } else if (activeControls.rightward) {
        turnRight(delta);
      } else {
        stopTurning();
      }
      
      // Apply boost if active
      if (activeControls.boost) {
        // Apply temporary speed boost - implementation depends on useRover store 
        // For now, just accelerate faster
        if (activeControls.forward) {
          accelerate(delta * 2);
        }
      }
      
      // Continue animation frame if any control is active
      if (Object.values(activeControls).some(control => control)) {
        frameRef.current = requestAnimationFrame(handleMovement);
      } else {
        frameRef.current = null;
        lastTimeRef.current = 0;
      }
    };
    
    // Start animation frame if any control is active
    if (Object.values(activeControls).some(control => control) && !frameRef.current) {
      lastTimeRef.current = 0; // Reset time on new animation start
      frameRef.current = requestAnimationFrame(handleMovement);
    }
    
    // Clean up animation frame on unmount
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [activeControls, accelerate, decelerate, turnLeft, turnRight, stopTurning]);
  
  // Add event listeners to document for touch event handling
  useEffect(() => {
    // Function to clean up all control states when focus is lost
    const handleBlur = () => {
      setActiveControls({
        forward: false,
        backward: false,
        leftward: false,
        rightward: false,
        boost: false
      });
      setLeftJoystick({ x: 0, y: 0, active: false });
      setRightJoystick({ x: 0, y: 0, active: false });
      leftTouchIdRef.current = null;
      rightTouchIdRef.current = null;
    };
    
    // Add global event listeners
    window.addEventListener('blur', handleBlur);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') {
        handleBlur();
      }
    });
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('visibilitychange', handleBlur);
    };
  }, []);
  
  // Don't show on desktop
  if (!isMobile) return null;

  // Handle control activation
  const setControl = (control: keyof typeof activeControls, active: boolean) => {
    setActiveControls(prev => ({
      ...prev,
      [control]: active
    }));
    
    // Also call the provided callback if available (for debugging)
    if (setControlState) {
      setControlState(control as Controls, active);
    }
    
    if (active) {
      console.log(`Mobile control: ${control} activated`);
    }
  };
  
  // Update joystick controls based on joystick position
  const updateControls = (joystickSide: 'left' | 'right', x: number, y: number) => {
    // Normalize values between -1 and 1
    const clampedX = Math.max(-1, Math.min(1, x));
    const clampedY = Math.max(-1, Math.min(1, y));
    
    // Define dead zone
    const deadZone = 0.25;
    
    if (joystickSide === 'left') {
      // Left joystick controls turning (x-axis)
      const isTurningLeft = clampedX < -deadZone;
      const isTurningRight = clampedX > deadZone;
      
      setControl('leftward', isTurningLeft);
      setControl('rightward', isTurningRight);
    } else {
      // Right joystick controls forward/backward (y-axis)
      const isMovingForward = clampedY < -deadZone;
      const isMovingBackward = clampedY > deadZone;
      
      setControl('forward', isMovingForward);
      setControl('backward', isMovingBackward);
      
      // Right joystick horizontal controls boost (x-axis)
      const isBoost = Math.abs(clampedX) > 0.7;
      setControl('boost', isBoost);
    }
  };
  
  // Calculate joystick position from touch
  const calculateJoystickPosition = (
    touchX: number, 
    touchY: number, 
    joystickRef: React.RefObject<HTMLDivElement>
  ): [number, number] => {
    if (!joystickRef.current) return [0, 0];
    
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Distance from center
    const deltaX = touchX - centerX;
    const deltaY = touchY - centerY;
    
    // Normalize based on joystick radius
    const radius = rect.width / 2;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance <= radius) {
      // Inside joystick area, return normalized values
      return [deltaX / radius, deltaY / radius];
    } else {
      // Outside joystick area, clamp to edge
      const angle = Math.atan2(deltaY, deltaX);
      return [
        Math.cos(angle),
        Math.sin(angle)
      ];
    }
  };
  
  // Handle touch events for joysticks
  const handleJoystickTouchStart = (e: React.TouchEvent, side: 'left' | 'right') => {
    e.preventDefault();
    
    // Get touch info
    const touch = e.touches[0];
    
    // References for the current joystick
    const joystickRef = side === 'left' ? leftJoystickRef : rightJoystickRef;
    const touchIdRef = side === 'left' ? leftTouchIdRef : rightTouchIdRef;
    
    // Store touch identifier
    touchIdRef.current = touch.identifier;
    
    // Calculate position
    const [x, y] = calculateJoystickPosition(touch.clientX, touch.clientY, joystickRef);
    
    // Update joystick state
    if (side === 'left') {
      setLeftJoystick({ x, y, active: true });
    } else {
      setRightJoystick({ x, y, active: true });
    }
    
    // Update controls based on position
    updateControls(side, x, y);
  };
  
  const handleJoystickTouchMove = (e: React.TouchEvent, side: 'left' | 'right') => {
    e.preventDefault();
    
    // Get references
    const touchIdRef = side === 'left' ? leftTouchIdRef : rightTouchIdRef;
    const joystickRef = side === 'left' ? leftJoystickRef : rightJoystickRef;
    
    // Find the touch that matches our stored identifier
    const touch = Array.from(e.touches).find(t => t.identifier === touchIdRef.current);
    
    if (touch) {
      // Calculate position
      const [x, y] = calculateJoystickPosition(touch.clientX, touch.clientY, joystickRef);
      
      // Update joystick state
      if (side === 'left') {
        setLeftJoystick({ x, y, active: true });
      } else {
        setRightJoystick({ x, y, active: true });
      }
      
      // Update controls based on position
      updateControls(side, x, y);
    }
  };
  
  const handleJoystickTouchEnd = (e: React.TouchEvent, side: 'left' | 'right') => {
    e.preventDefault();
    
    // Reset joystick state
    if (side === 'left') {
      setLeftJoystick({ x: 0, y: 0, active: false });
      leftTouchIdRef.current = null;
      setControl('leftward', false);
      setControl('rightward', false);
    } else {
      setRightJoystick({ x: 0, y: 0, active: false });
      rightTouchIdRef.current = null;
      setControl('forward', false);
      setControl('backward', false);
      setControl('boost', false);
    }
  };
  
  return (
    <div className="fixed bottom-6 inset-x-0 z-50 pointer-events-none">
      {/* Debug display to show active controls and joystick values */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-16 text-xs text-center bg-black/70 px-2 py-1 rounded">
        <div>
          {Object.entries(activeControls)
            .filter(([_, value]) => value)
            .map(([key]) => key)
            .join(', ') || 'no controls active'}
        </div>
        <div className="flex justify-between mt-1 text-white/60">
          <span>L: {leftJoystick.x.toFixed(1)},{leftJoystick.y.toFixed(1)}</span>
          <span className="mx-2">|</span>
          <span>R: {rightJoystick.x.toFixed(1)},{rightJoystick.y.toFixed(1)}</span>
        </div>
      </div>
      
      <div className="flex justify-between px-6 mx-auto max-w-xl pointer-events-auto">
        {/* Left joystick - controls turning */}
        <div 
          ref={leftJoystickRef}
          className="joystick-base relative w-36 h-36 rounded-full border-2 border-orange-500/50 pointer-events-auto"
          onTouchStart={(e) => handleJoystickTouchStart(e, 'left')}
          onTouchMove={(e) => handleJoystickTouchMove(e, 'left')}
          onTouchEnd={(e) => handleJoystickTouchEnd(e, 'left')}
          onTouchCancel={(e) => handleJoystickTouchEnd(e, 'left')}
        >
          {/* Joystick handle */}
          <div 
            className="joystick-handle w-20 h-20 rounded-full flex items-center justify-center text-white"
            style={{
              transform: `translate(${leftJoystick.x * 50}%, ${leftJoystick.y * 50}%)`,
              top: '50%',
              left: '50%',
              marginLeft: '-2.5rem',
              marginTop: '-2.5rem',
              transition: leftJoystick.active ? 'none' : 'transform 0.2s ease-out'
            }}
          >
            <span className="text-2xl">⟲⟳</span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white/70">
            TURN
          </div>
        </div>
        
        {/* Right joystick - controls forward/backward */}
        <div 
          ref={rightJoystickRef}
          className="joystick-base relative w-36 h-36 rounded-full border-2 border-orange-500/50 pointer-events-auto"
          onTouchStart={(e) => handleJoystickTouchStart(e, 'right')}
          onTouchMove={(e) => handleJoystickTouchMove(e, 'right')}
          onTouchEnd={(e) => handleJoystickTouchEnd(e, 'right')}
          onTouchCancel={(e) => handleJoystickTouchEnd(e, 'right')}
        >
          {/* Joystick handle */}
          <div 
            className="joystick-handle w-20 h-20 rounded-full flex items-center justify-center text-white"
            style={{
              transform: `translate(${rightJoystick.x * 50}%, ${rightJoystick.y * 50}%)`,
              top: '50%',
              left: '50%',
              marginLeft: '-2.5rem',
              marginTop: '-2.5rem',
              transition: rightJoystick.active ? 'none' : 'transform 0.2s ease-out'
            }}
          >
            <span className="text-2xl">⬆️⬇️</span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white/70">
            DRIVE
          </div>
          <div className="absolute bottom-2 text-center w-full text-xs font-bold text-white/70">
            ⟵ BOOST ⟶
          </div>
        </div>
      </div>
    </div>
  );
}