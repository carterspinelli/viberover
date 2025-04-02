import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useAudio } from "./lib/stores/useAudio";
import { useRover } from "./lib/stores/useRover";
import "@fontsource/inter";
import Game from "./components/Game";
import UsernamePrompt from "./components/UsernamePrompt";
import GameHUD from "./components/GameHUD";

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

// Parse URL params for portal functionality
function getPortalParams() {
  const searchParams = new URLSearchParams(window.location.search);
  
  return {
    isFromPortal: searchParams.get('portal') === 'true',
    username: searchParams.get('username') || '',
    refUrl: searchParams.get('ref') || '',
    speed: parseFloat(searchParams.get('speed') || '0'),
    color: searchParams.get('color') || '',
    // Additional params
    avatarUrl: searchParams.get('avatar_url') || '',
    team: searchParams.get('team') || '',
    speedX: parseFloat(searchParams.get('speed_x') || '0'),
    speedY: parseFloat(searchParams.get('speed_y') || '0'),
    speedZ: parseFloat(searchParams.get('speed_z') || '0'),
    rotationX: parseFloat(searchParams.get('rotation_x') || '0'),
    rotationY: parseFloat(searchParams.get('rotation_y') || '0'),
    rotationZ: parseFloat(searchParams.get('rotation_z') || '0'),
  };
}

// Main App component
function App() {
  const { setBackgroundMusic, setHitSound, toggleMute } = useAudio();
  const [username, setUsername] = useState<string>('');
  const [portalParams, setPortalParams] = useState(getPortalParams());
  const [isLoaded, setIsLoaded] = useState(false);

  // Setup initial state based on URL params if coming from a portal
  useEffect(() => {
    if (portalParams.isFromPortal && portalParams.username) {
      console.log("User arrived from portal:", portalParams);
      setUsername(portalParams.username);
      
      // If speed is provided, we could set initial rover speed
      if (portalParams.speed > 0) {
        // This would need corresponding handling in the useRover store
        console.log("Setting initial speed from portal:", portalParams.speed);
      }
      
      setIsLoaded(true);
    }
  }, [portalParams]);

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

  // If we're loading from a portal, skip the username prompt
  const showGame = username !== '';

  // We create the portalParams type expected by Game component
  const gamePortalParams = {
    isFromPortal: portalParams.isFromPortal,
    refUrl: portalParams.refUrl,
    speed: portalParams.speed,
    color: portalParams.color,
    avatarUrl: portalParams.avatarUrl,
    team: portalParams.team,
    speedX: portalParams.speedX,
    speedY: portalParams.speedY,
    speedZ: portalParams.speedZ,
    rotationX: portalParams.rotationX,
    rotationY: portalParams.rotationY,
    rotationZ: portalParams.rotationZ,
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {!showGame ? (
        <UsernamePrompt onSubmit={setUsername} />
      ) : (
        <KeyboardControls map={controlsMap}>
          <>
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
                <Game 
                  username={username} 
                  portalParams={gamePortalParams} 
                />
              </Suspense>
            </Canvas>
            <GameHUD username={username} />
          </>
        </KeyboardControls>
      )}
    </div>
  );
}

export default App;
