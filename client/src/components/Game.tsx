import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import MarsRover from "./MarsRover";
import MarsEnvironment from "./MarsEnvironment";
import GameHUD from "./GameHUD";
import VibePortal from "./VibePortal";
import { useRover } from "../lib/stores/useRover";
import { useAudio } from "../lib/stores/useAudio";
import { useGame } from "../lib/stores/useGame";
import * as THREE from "three";

interface GameProps {
  username: string;
  portalParams: {
    isFromPortal: boolean;
    refUrl: string;
    speed: number;
    color: string;
    avatarUrl: string;
    team: string;
    speedX: number;
    speedY: number;
    speedZ: number;
    rotationX: number;
    rotationY: number;
    rotationZ: number;
  }
}

const Game = ({ username, portalParams }: GameProps) => {
  const { camera } = useThree();
  const { backgroundMusic, isMuted } = useAudio();
  const { position, rotation, velocity } = useRover();
  const { phase, start } = useGame();
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  
  // Camera smoothing
  const cameraPositionRef = useRef(new THREE.Vector3(0, 5, 10));
  const cameraLookAtRef = useRef(new THREE.Vector3(0, 1, 0));

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

  // Smooth camera follow logic
  useFrame((state, delta) => {
    if (!cameraRef.current) return;
    
    // Calculate ideal camera position based on rover position and rotation
    // Distance behind the rover depends on speed - further back when moving faster
    const distance = 10 + Math.abs(velocity) * 0.5; 
    const height = 5 + Math.abs(velocity) * 0.2;
    
    // Calculate target position behind the rover
    const targetX = position.x - Math.sin(rotation.y) * distance;
    const targetZ = position.z - Math.cos(rotation.y) * distance;
    const targetY = position.y + height;
    
    // Calculate target look position (slightly above the rover)
    const lookTargetX = position.x;
    const lookTargetY = position.y + 1;
    const lookTargetZ = position.z;
    
    // Smoothly interpolate current camera position toward target position
    cameraPositionRef.current.lerp(new THREE.Vector3(targetX, targetY, targetZ), delta * 2);
    cameraLookAtRef.current.lerp(new THREE.Vector3(lookTargetX, lookTargetY, lookTargetZ), delta * 3);
    
    // Apply the smoothed position to the camera
    cameraRef.current.position.copy(cameraPositionRef.current);
    
    // Make camera look at rover
    cameraRef.current.lookAt(cameraLookAtRef.current);
  });

  return (
    <>
      <PerspectiveCamera 
        ref={cameraRef}
        makeDefault 
        position={[0, 5, 10]} 
        fov={60}
        near={0.1}
        far={1000}
      />
      
      <MarsEnvironment />
      <MarsRover />
      
      {/* Exit Portal */}
      <VibePortal 
        position={[50, 0, -50]} 
        rotation={[0, 0, 0]} 
        color="#00ff00" 
        label="VIBEVERSE PORTAL" 
        portalUrl="https://portal.pieter.com" 
        username={username}
      />
      
      {/* Start Portal - Only visible if we came from another portal */}
      {portalParams.isFromPortal && portalParams.refUrl && (
        <VibePortal 
          position={[-10, 0, 0]} 
          rotation={[0, 0, 0]} 
          color="#ff0000" 
          label="RETURN PORTAL" 
          portalUrl={portalParams.refUrl} 
          username={username}
        />
      )}
    </>
  );
};

export default Game;
