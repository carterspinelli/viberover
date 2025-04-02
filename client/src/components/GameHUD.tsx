
import { useRef, useEffect, useState } from "react";
import { useKeyboardControls } from "@react-three/drei";
import { useRover } from "../lib/stores/useRover";
import { useAudio } from "../lib/stores/useAudio";
import { useIsMobile } from "../hooks/use-is-mobile";
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
  const { energy, velocity } = useRover();
  const { isMuted, toggleMute } = useAudio();
  const isMobile = useIsMobile();
  
  // Option to collapse the HUD on mobile for more screen space
  const [collapsed, setCollapsed] = useState(false);

  // Get keyboard inputs for visual feedback with selective state reading
  const forward = useKeyboardControls<Controls>(state => state[Controls.forward]);
  const backward = useKeyboardControls<Controls>(state => state[Controls.backward]);
  const leftward = useKeyboardControls<Controls>(state => state[Controls.leftward]);
  const rightward = useKeyboardControls<Controls>(state => state[Controls.rightward]);

  // Direction indicator using an arrow
  const getDirectionIndicator = () => {
    if (velocity > 0.1) return "↑";
    if (velocity < -0.1) return "↓";
    if (Math.abs(velocity) < 0.1 && Math.abs(velocity) > 0) return "⊗"; // Braking indicator
    return "•";
  };
  
  // Mobile-specific compact HUD
  if (isMobile && collapsed) {
    return (
      <div className="fixed left-2 top-2 z-50" style={{ pointerEvents: 'auto' }}>
        <div className="bg-black bg-opacity-60 p-2 rounded-lg text-white">
          <div className="flex justify-between items-center">
            <span className="text-sm mr-2">{Math.abs(velocity).toFixed(1)} m/s</span>
            <span className={`w-6 h-6 flex items-center justify-center rounded-full 
              ${Math.abs(velocity) > 5 ? 'bg-green-600' : 
                Math.abs(velocity) > 0.1 ? 'bg-blue-700' : 'bg-gray-700'}`}>
              {getDirectionIndicator()}
            </span>
            <button 
              onClick={() => setCollapsed(false)}
              className="ml-2 bg-gray-800 rounded p-1"
            >
              ↘️
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`fixed z-50 ${isMobile ? 'left-2 top-2 w-[calc(100%-1rem)] max-w-[18rem]' : 'left-4 top-4 w-64'}`} 
      style={{ pointerEvents: 'auto' }}
    >
      <div className="bg-black bg-opacity-60 p-3 rounded-lg text-white">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">VIBEROVER</h2>
          <div className="flex">
            {isMobile && (
              <button 
                onClick={() => setCollapsed(true)}
                className="mr-2 bg-gray-700 hover:bg-gray-600 rounded px-2 py-1 text-xs"
              >
                ↖️
              </button>
            )}
            <button 
              className="bg-gray-700 hover:bg-gray-600 rounded px-2 py-1 text-xs pointer-events-auto"
              onClick={toggleMute}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>
          </div>
        </div>
        
        {/* Pilot name */}
        <div className="mb-3 text-center">
          <div className="text-sm text-gray-300">Pilot: <span className="font-bold text-orange-400">{username}</span></div>
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
                ${Math.abs(velocity) > 5 ? 'bg-green-600' : 
                  Math.abs(velocity) > 0.1 ? 'bg-blue-700' : 'bg-gray-700'}`}>
                {getDirectionIndicator()}
              </span>
            </div>
          </div>
          {/* Speed bar for visualization */}
          <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
            <div 
              className={`h-2.5 rounded-full ${velocity > 0 ? 'bg-green-600' : velocity < 0 ? 'bg-yellow-600' : 'bg-gray-600'}`}
              style={{ width: `${Math.min(100, (Math.abs(velocity) / 7) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Visual controls display - only show on desktop */}
        {!isMobile && (
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
        )}

        {/* Controls reminder - simplified on mobile */}
        <div className={`mt-3 grid grid-cols-1 gap-1 text-xs text-gray-300 ${isMobile ? 'text-[10px]' : ''}`}>
          {!isMobile ? (
            <>
              <div>W: Move Forward (Max: 7.00 m/s)</div>
              <div>S: When moving forward - Brake to stop</div>
              <div>S: When stopped - Move Backward (Max: 7.00 m/s)</div>
              <div>A: Turn Left</div>
              <div>D: Turn Right</div>
              <div>M: Toggle Sound</div>
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <div>↑: Forward</div>
                <div>↓: Brake/Back</div>
                <div>←→: Turn</div>
                <div>B: Boost</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameHUD;
