import { useRef, useEffect, useState, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { GLTF } from "three-stdlib";
import { useRover } from "../lib/stores/useRover";
import { useAudio } from "../lib/stores/useAudio";
import { Controls } from "../App";

// Preload the rover model
useGLTF.preload('/models/viberover.glb');

const MarsRover = () => {
  const roverRef = useRef<THREE.Group>(null);
  const wheelRefs = useRef<THREE.Object3D[]>([]);
  
  // Load the rover model
  const { scene: roverModel } = useGLTF('/models/viberover.glb') as GLTF & {
    scene: THREE.Group
  };
  
  const [modelLoaded, setModelLoaded] = useState(false);
  const { playHit } = useAudio();
  
  // Get keyboard inputs with correct typing
  const [, getKeys] = useKeyboardControls<Controls>();
  
  // Track key states to detect key up events
  const prevKeysRef = useRef({
    forward: false,
    backward: false,
    leftward: false,
    rightward: false
  });
  
  // Get rover state from the store
  const { 
    position, rotation, velocity, health, energy,
    accelerate, decelerate, turnLeft, turnRight, stopTurning,
    setColliding, updatePosition
  } = useRover();
  
  // Setup collision detection variables
  const collisionRay = new THREE.Raycaster();
  const directionVectors = [
    new THREE.Vector3(1, 0, 0),   // right
    new THREE.Vector3(-1, 0, 0),  // left
    new THREE.Vector3(0, 0, 1),   // forward
    new THREE.Vector3(0, 0, -1),  // backward
  ];
  
  // Process rover model when loaded
  useEffect(() => {
    if (roverModel) {
      setModelLoaded(true);
      
      // Find and collect wheel references for animation
      roverModel.traverse((child) => {
        if (child.name.includes('wheel')) {
          wheelRefs.current.push(child);
        }
      });
      
      // Setup model
      roverModel.position.set(0, 0, 0);
      // Rotate the model 180 degrees to face the correct direction
      roverModel.rotation.set(0, Math.PI, 0);
      roverModel.scale.set(0.5, 0.5, 0.5);
      
      console.log("Mars rover model loaded successfully");
    }
  }, [roverModel]);
  
  // Update rover position and handle controls each frame
  useFrame((state, delta) => {
    if (!roverRef.current || !modelLoaded) return;
    
    // Get current keyboard state with proper typing
    const keys = getKeys();
    
    // Handle key presses and releases for smoother controls
    
    // Forward/backward movement
    if (keys[Controls.forward] && !keys[Controls.backward]) {
      // Move forward
      accelerate(delta);
    } else if (keys[Controls.backward] && !keys[Controls.forward]) {
      // Move backward
      decelerate(delta);
    }
    
    // Turning
    if (keys[Controls.leftward] && !keys[Controls.rightward]) {
      // Turn left
      turnLeft(delta);
    } else if (keys[Controls.rightward] && !keys[Controls.leftward]) {
      // Turn right
      turnRight(delta);
    } else if (prevKeysRef.current.leftward || prevKeysRef.current.rightward) {
      // If previously turning but now stopped
      stopTurning();
    }
    
    // Store current key states for next frame
    prevKeysRef.current = {
      forward: !!keys[Controls.forward],
      backward: !!keys[Controls.backward],
      leftward: !!keys[Controls.leftward],
      rightward: !!keys[Controls.rightward]
    };
    
    // Check for collisions
    let isColliding = false;
    const roverPosition = new THREE.Vector3(position.x, position.y, position.z);
    
    // Cast rays in different directions to detect potential collisions
    for (const direction of directionVectors) {
      // Get direction vector adjusted for current rotation
      const rotatedDirection = direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation.y);
      
      collisionRay.set(roverPosition, rotatedDirection);
      const intersects = collisionRay.intersectObjects(state.scene.children, true);
      
      // Filter out the rover itself from collision detection
      const filteredIntersects = intersects.filter(intersection => {
        let current = intersection.object;
        while (current) {
          if (current === roverRef.current) return false;
          current = current.parent as THREE.Object3D;
        }
        return true;
      });
      
      // If we hit something close by that isn't the rover itself
      if (filteredIntersects.length > 0 && filteredIntersects[0].distance < 1.2) {
        isColliding = true;
        // Play collision sound
        playHit();
        break;
      }
    }
    
    // Update collision state
    setColliding(isColliding);
    
    // Update rover position
    updatePosition(delta);
    
    // Apply position and rotation to the model
    roverRef.current.position.set(position.x, position.y, position.z);
    roverRef.current.rotation.y = rotation.y;
    
    // Animate wheels based on velocity - faster rotation when moving faster
    const wheelSpeed = Math.abs(velocity) * delta * 3;
    wheelRefs.current.forEach(wheel => {
      // Wheels rotate forward when moving forward, backward when in reverse
      const direction = velocity >= 0 ? 1 : -1;
      wheel.rotation.x += direction * wheelSpeed;
    });
  });
  
  return (
    <group ref={roverRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
      {modelLoaded ? (
        <Suspense fallback={
          <mesh castShadow>
            <boxGeometry args={[1, 0.5, 2]} />
            <meshStandardMaterial color="#CCCCCC" />
          </mesh>
        }>
          <primitive object={roverModel.clone()} castShadow receiveShadow />
        </Suspense>
      ) : (
        <mesh castShadow>
          <boxGeometry args={[1, 0.5, 2]} />
          <meshStandardMaterial color="#CCCCCC" />
        </mesh>
      )}
    </group>
  );
};

export default MarsRover;
