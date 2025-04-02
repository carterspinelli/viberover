import { useRef, useEffect, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useKeyboardControls } from "@react-three/drei";
import { useRover } from "../lib/stores/useRover";
import { Html } from "@react-three/drei";
import { useAudio } from "../lib/stores/useAudio";
import { Controls } from "../App";

// A visual key component to show which keys are pressed
const KeyDisplay = ({ 
  isPressed, 
  label 
}: { 
  isPressed: boolean, 
  label: string 
}) => (
  <div 
    className={`inline-flex justify-center items-center w-8 h-8 mx-1 border rounded ${
      isPressed 
        ? "bg-orange-700 border-orange-500 text-white" 
        : "bg-gray-800 border-gray-700 text-gray-400"
    }`}
  >
    {label}
  </div>
);

interface GameHUDProps {
  username: string;
}

const GameHUD = ({ username }: GameHUDProps) => {
  const { health, energy, velocity } = useRover();
  const { isMuted, toggleMute } = useAudio();
  const { camera } = useThree();

  // Get keyboard inputs for visual feedback with selective state reading
  const forward = useKeyboardControls<Controls>(state => state[Controls.forward]);
  const backward = useKeyboardControls<Controls>(state => state[Controls.backward]);
  const leftward = useKeyboardControls<Controls>(state => state[Controls.leftward]);
  const rightward = useKeyboardControls<Controls>(state => state[Controls.rightward]);

  // Direction indicator using an arrow
  const getDirectionIndicator = () => {
    if (velocity > 0.1) return "↑";
    if (velocity < -0.1) return "↓";
    return "•";
  };

  return (
    <div className="fixed left-4 top-4 w-64 z-50" style={{ pointerEvents: 'auto' }}> {/* Fixed position with padding */}
        <div className="bg-black bg-opacity-60 p-3 rounded-lg text-white"> {/* Removed max-w-md and mx-auto */}
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">Mars Rover Status</h2>
            <button 
              className="bg-gray-700 hover:bg-gray-600 rounded px-2 py-1 text-xs pointer-events-auto"
              onClick={toggleMute}
            >
              {isMuted ? "🔇 Unmute" : "🔊 Mute"}
            </button>
          </div>

          {/* Health bar */}
          <div className="mb-2">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Health</span>
              <span className="text-sm">{Math.floor(health)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-red-600 h-2.5 rounded-full" 
                style={{ width: `${health}%` }}
              ></div>
            </div>
          </div>

          {/* Energy bar */}
          <div className="mb-2">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Energy</span>
              <span className="text-sm">{Math.floor(energy)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${energy}%` }}
              ></div>
            </div>
          </div>

          {/* Speed indicator with direction */}
          <div className="mb-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Speed</span>
              <div className="flex items-center">
                <span className="text-sm mr-2">{Math.abs(velocity).toFixed(2)} m/s</span>
                <span className={`w-6 h-6 flex items-center justify-center rounded-full 
                  ${Math.abs(velocity) > 0.1 ? 'bg-blue-700' : 'bg-gray-700'}`}>
                  {getDirectionIndicator()}
                </span>
              </div>
            </div>
          </div>

          {/* Visual controls display */}
          <div className="mt-3 mb-1 text-center">
            <div className="flex justify-center mb-2">
              <KeyDisplay isPressed={forward} label="W" />
            </div>
            <div className="flex justify-center">
              <KeyDisplay isPressed={leftward} label="A" />
              <KeyDisplay isPressed={backward} label="S" />
              <KeyDisplay isPressed={rightward} label="D" />
            </div>
          </div>

          {/* Controls reminder */}
          <div className="mt-3 grid grid-cols-2 gap-1 text-xs text-gray-300">
            <div>W: Move Forward</div>
            <div>S: Move Backward</div>
            <div>A: Turn Left</div>
            <div>D: Turn Right</div>
            <div>M: Toggle Sound</div>
          </div>
        </div>
      </div>
    </Html>
  );
};

export default GameHUD;