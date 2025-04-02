import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import MarsRover from "./MarsRover";
import MarsEnvironment from "./MarsEnvironment";
import GameHUD from "./GameHUD";
import { useRover } from "../lib/stores/useRover";
import { useAudio } from "../lib/stores/useAudio";
import { useGame } from "../lib/stores/useGame";

const Game = () => {
  const { camera } = useThree();
  const { backgroundMusic, isMuted } = useAudio();
  const { position, rotation } = useRover();
  const { phase, start } = useGame();
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  // Start background music when game loads
  useEffect(() => {
    if (backgroundMusic && !isMuted) {
      backgroundMusic.play().catch(error => {
        console.log("Background music play prevented:", error);
      });
    }
    
    // Start the game
    if (phase === "ready") {
      start();
    }

    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause();
      }
    };
  }, [backgroundMusic, isMuted, phase, start]);

  // Update camera to follow rover
  useEffect(() => {
    if (cameraRef.current) {
      // Calculate camera target position behind and above the rover
      const cameraTargetX = position.x - Math.sin(rotation.y) * 10;
      const cameraTargetZ = position.z - Math.cos(rotation.y) * 10;
      const cameraTargetY = position.y + 5;
      
      // Update camera position to follow rover smoothly
      cameraRef.current.position.x = cameraTargetX;
      cameraRef.current.position.y = cameraTargetY;
      cameraRef.current.position.z = cameraTargetZ;
      
      // Make camera look at rover
      cameraRef.current.lookAt(position.x, position.y + 1, position.z);
    }
  }, [position, rotation]);

  return (
    <>
      {/* Custom camera that follows the rover */}
      <PerspectiveCamera 
        ref={cameraRef}
        makeDefault 
        position={[0, 5, 10]} 
        fov={60}
        near={0.1}
        far={1000}
      />
      
      {/* Mars environment and lighting */}
      <MarsEnvironment />
      
      {/* The rover player can control */}
      <MarsRover />
      
      {/* Debug controls - disabled in final game */}
      {/* <OrbitControls /> */}
      
      {/* HUD overlay */}
      <GameHUD />
    </>
  );
};

export default Game;
