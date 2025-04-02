import { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '../hooks/use-is-mobile';
import { useRover } from '../lib/stores/useRover';
import { Controls } from '../App';
import { useFrame } from '@react-three/fiber';

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
  
  // Frame-based movement handling to make touch controls responsive
  useEffect(() => {
    const handleMovement = () => {
      const delta = 1 / 60; // Approximate 60fps
      
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
      
      // Continue animation frame if any control is active
      if (Object.values(activeControls).some(control => control)) {
        frameRef.current = requestAnimationFrame(handleMovement);
      } else {
        frameRef.current = null;
      }
    };
    
    // Start animation frame if any control is active
    if (Object.values(activeControls).some(control => control) && !frameRef.current) {
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

  // Directional button component
  const DirectionalButton = ({ 
    control, 
    label, 
    className = ""
  }: { 
    control: keyof typeof activeControls, 
    label: string, 
    className?: string
  }) => {
    const handleTouchStart = (e: React.TouchEvent) => {
      e.preventDefault();
      setControl(control, true);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      e.preventDefault();
      setControl(control, false);
    };

    return (
      <button
        className={`touch-none select-none rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold
          bg-black/60 active:bg-orange-700/80 border-2 border-orange-500/50 text-white ${className}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="fixed bottom-8 inset-x-0 z-50 pointer-events-none">
      <div className="flex justify-between px-6 mx-auto max-w-lg pointer-events-auto">
        {/* Left side controls - turn left/right */}
        <div className="flex flex-col gap-4 items-center">
          <DirectionalButton 
            control="leftward" 
            label="←" 
          />
          <DirectionalButton 
            control="rightward" 
            label="→" 
          />
        </div>
        
        {/* Right side controls - forward/backward */}
        <div className="flex flex-col gap-4 items-center">
          <DirectionalButton 
            control="forward" 
            label="↑"
          />
          <DirectionalButton 
            control="backward" 
            label="↓"
          />
        </div>
      </div>
      
      {/* Boost button */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
        <DirectionalButton 
          control="boost" 
          label="B" 
          className="bg-red-900/60 active:bg-red-700/80 border-red-500/50 w-12 h-12"
        />
      </div>
    </div>
  );
}