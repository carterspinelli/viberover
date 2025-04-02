import { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '../hooks/use-is-mobile';
import { useRover } from '../lib/stores/useRover';
import { Controls } from '../App';

// Component doesn't use props since it talks directly to the rover store
interface TouchControlsProps {
  setControlState?: (control: Controls, pressed: boolean) => void;
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
    
    console.log(`Mobile control: ${control} ${active ? 'activated' : 'deactivated'}`);
  };

  // Directional button component with mouse and touch events
  const DirectionalButton = ({ 
    control, 
    label, 
    className = ""
  }: { 
    control: keyof typeof activeControls, 
    label: string, 
    className?: string
  }) => {
    // Reference to track if touch is active
    const touchActiveRef = useRef(false);
    
    // Mouse events - fallback for testing and some devices
    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      setControl(control, true);
    };
    
    const handleMouseUp = (e: React.MouseEvent) => {
      e.preventDefault();
      if (!touchActiveRef.current) { // Only handle if not from touch
        setControl(control, false);
      }
    };
    
    // Touch events 
    const handleTouchStart = (e: React.TouchEvent) => {
      e.preventDefault();
      touchActiveRef.current = true;
      setControl(control, true);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      e.preventDefault();
      touchActiveRef.current = false;
      setControl(control, false);
    };

    const isBoost = control === 'boost';
    
    return (
      <button
        className={`touch-none select-none rounded-full w-20 h-20 flex items-center justify-center text-3xl font-bold
          touch-btn ${isBoost ? 'boost-btn' : 'direction-btn'} text-white ${className}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="fixed bottom-6 inset-x-0 z-50 pointer-events-none">
      {/* Debug display to show active controls */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-16 text-xs text-center bg-black/50 px-2 py-1 rounded">
        {Object.entries(activeControls)
          .filter(([_, value]) => value)
          .map(([key]) => key)
          .join(', ') || 'no controls active'}
      </div>
      
      <div className="flex justify-between px-6 mx-auto max-w-xl pointer-events-auto">
        {/* Left side controls - turn left/right */}
        <div className="flex flex-col gap-4 items-center">
          <DirectionalButton 
            control="leftward" 
            label="⟲" 
          />
          <DirectionalButton 
            control="rightward" 
            label="⟳" 
          />
        </div>
        
        {/* Boost button - in center */}
        <div className="flex items-end mb-2 pointer-events-auto">
          <DirectionalButton 
            control="boost" 
            label="🔥" 
            className="w-24 h-24 text-4xl"
          />
        </div>
        
        {/* Right side controls - forward/backward */}
        <div className="flex flex-col gap-4 items-center">
          <DirectionalButton 
            control="forward" 
            label="⬆️"
          />
          <DirectionalButton 
            control="backward" 
            label="⬇️"
          />
        </div>
      </div>
    </div>
  );
}