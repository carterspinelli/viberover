import { useRef, useEffect, useState, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { GLTF } from "three-stdlib";
import { useRover } from "../lib/stores/useRover";
import { useAudio } from "../lib/stores/useAudio";

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
  
  // Get keyboard inputs
  const [, getKeys] = useKeyboardControls();
  
  // Get rover state from the store
  const { 
    position, rotation, velocity, health, energy,
    accelerate, decelerate, turnLeft, turnRight, setColliding,
    updatePosition
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
      roverModel.rotation.set(0, 0, 0);
      roverModel.scale.set(0.5, 0.5, 0.5);
      
      console.log("Mars rover model loaded successfully");
    }
  }, [roverModel]);
  
  // Update rover position and handle controls each frame
  useFrame((state, delta) => {
    if (!roverRef.current || !modelLoaded) return;
    
    // Get keyboard state
    const { forward, backward, leftward, rightward, boost } = getKeys();
    
    // Apply controls
    if (forward) {
      accelerate(delta);
    } else if (backward) {
      decelerate(delta);
    } else {
      // Apply friction when no input
      if (velocity > 0) {
        accelerate(-delta * 0.5);
      } else if (velocity < 0) {
        decelerate(-delta * 0.5);
      }
    }
    
    if (leftward) {
      turnLeft(delta);
    }
    
    if (rightward) {
      turnRight(delta);
    }
    
    // Check for collisions
    let isColliding = false;
    const roverPosition = new THREE.Vector3(position.x, position.y, position.z);
    
    // Cast rays in different directions to detect potential collisions
    for (const direction of directionVectors) {
      collisionRay.set(roverPosition, direction);
      const intersects = collisionRay.intersectObjects(state.scene.children, true);
      
      // Filter out the rover itself from collision detection
      const filteredIntersects = intersects.filter(intersection => {
        return intersection.object.parent !== roverRef.current;
      });
      
      // If we hit something close by that isn't the rover itself
      if (filteredIntersects.length > 0 && filteredIntersects[0].distance < 1) {
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
    
    // Animate wheels based on velocity
    wheelRefs.current.forEach(wheel => {
      wheel.rotation.x += velocity * delta * 2;
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
