import { Suspense, useEffect } from "react";
import { KeyboardControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useAudio } from "./lib/stores/useAudio";
import "@fontsource/inter";
import Game from "./components/Game";

// Define an enum for controls to ensure type safety
export enum Controls {
  forward = "forward",
  backward = "backward",
  leftward = "leftward",
  rightward = "rightward",
  boost = "boost",
}

// Define control key mappings
const controlsMap = [
  { name: Controls.forward, keys: ["KeyW", "ArrowUp"] },
  { name: Controls.backward, keys: ["KeyS", "ArrowDown"] },
  { name: Controls.leftward, keys: ["KeyA", "ArrowLeft"] },
  { name: Controls.rightward, keys: ["KeyD", "ArrowRight"] },
  { name: Controls.boost, keys: ["ShiftLeft", "ShiftRight"] },
];

// Main App component
function App() {
  const { setBackgroundMusic, setHitSound, toggleMute } = useAudio();

  // Setup audio resources
  useEffect(() => {
    // Load background music
    const bgMusic = new Audio("/sounds/background.mp3");
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
    setBackgroundMusic(bgMusic);

    // Load sound effects
    const sfxHit = new Audio("/sounds/hit.mp3");
    sfxHit.volume = 0.5;
    setHitSound(sfxHit);

    // Add keyboard listener for muting
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "m") {
        toggleMute();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [setBackgroundMusic, setHitSound, toggleMute]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <KeyboardControls map={controlsMap}>
        <Canvas
          shadows
          camera={{
            position: [0, 5, 10],
            fov: 60,
            near: 0.1,
            far: 1000
          }}
          gl={{
            antialias: true,
            powerPreference: "default"
          }}
        >
          <color attach="background" args={["#000000"]} />
          <fog attach="fog" args={["#270000", 30, 90]} />
          
          <Suspense fallback={null}>
            <Game />
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </div>
  );
}

export default App;
