import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useKeyboardControls } from "@react-three/drei";
import { useRover } from "../lib/stores/useRover";
import { Html } from "@react-three/drei";
import { useAudio } from "../lib/stores/useAudio";

const GameHUD = () => {
  const { health, energy, velocity } = useRover();
  const { isMuted, toggleMute } = useAudio();
  
  return (
    <Html fullscreen>
      <div className="fixed left-0 bottom-0 w-full p-4 pointer-events-none">
        <div className="bg-black bg-opacity-60 p-3 rounded-lg max-w-md mx-auto text-white">
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
          
          {/* Speed indicator */}
          <div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Speed</span>
              <span className="text-sm">{Math.abs(velocity).toFixed(2)} m/s</span>
            </div>
          </div>
          
          {/* Controls reminder */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div>W/↑: Move Forward</div>
            <div>S/↓: Move Backward</div>
            <div>A/←: Turn Left</div>
            <div>D/→: Turn Right</div>
            <div>M: Toggle Sound</div>
          </div>
        </div>
      </div>
    </Html>
  );
};

export default GameHUD;
