import { useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";

// Helper function to create a crater on a geometry
const createCrater = (
  geometry: THREE.BufferGeometry,
  position: THREE.Vector3,
  radius: number,
  depth: number
) => {
  // Get vertices from the geometry
  const positionAttribute = geometry.getAttribute('position');
  const vertices = [];
  
  // Extract vertices from buffer geometry
  for (let i = 0; i < positionAttribute.count; i++) {
    const vertex = new THREE.Vector3();
    vertex.fromBufferAttribute(positionAttribute, i);
    vertices.push(vertex);
  }
  
  // Apply crater deformation to vertices
  for (let i = 0; i < vertices.length; i++) {
    const vertex = vertices[i];
    const distance = position.distanceTo(vertex);
    
    // Only affect vertices within the crater radius
    if (distance < radius) {
      // Calculate displacement based on distance from crater center
      const displacement = (1 - distance / radius) * depth;
      const direction = vertex.clone().sub(position).normalize();
      
      // Move vertex downward to create crater
      vertex.sub(direction.multiplyScalar(displacement));
    }
  }
  
  // Update the geometry with new vertex positions
  for (let i = 0; i < vertices.length; i++) {
    const vertex = vertices[i];
    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  
  positionAttribute.needsUpdate = true;
  geometry.computeVertexNormals();
};

// Create hill on geometry
const createHill = (
  geometry: THREE.BufferGeometry,
  position: THREE.Vector3,
  radius: number,
  height: number
) => {
  // Same approach as crater but pushing vertices upward
  const positionAttribute = geometry.getAttribute('position');
  const vertices = [];
  
  for (let i = 0; i < positionAttribute.count; i++) {
    const vertex = new THREE.Vector3();
    vertex.fromBufferAttribute(positionAttribute, i);
    vertices.push(vertex);
  }
  
  for (let i = 0; i < vertices.length; i++) {
    const vertex = vertices[i];
    const distance = position.distanceTo(vertex);
    
    if (distance < radius) {
      // Gaussian-like curve for natural-looking hills
      const falloff = Math.exp(-(distance * distance) / (2 * (radius * 0.4) ** 2));
      const displacement = height * falloff;
      
      // Move vertex upward to create hill
      vertex.y += displacement;
    }
  }
  
  for (let i = 0; i < vertices.length; i++) {
    const vertex = vertices[i];
    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  
  positionAttribute.needsUpdate = true;
  geometry.computeVertexNormals();
};

// Create ridge/mountain range on geometry
const createRidge = (
  geometry: THREE.BufferGeometry,
  startPoint: THREE.Vector3,
  endPoint: THREE.Vector3, 
  width: number,
  height: number
) => {
  const positionAttribute = geometry.getAttribute('position');
  const vertices = [];
  
  for (let i = 0; i < positionAttribute.count; i++) {
    const vertex = new THREE.Vector3();
    vertex.fromBufferAttribute(positionAttribute, i);
    vertices.push(vertex);
  }
  
  // Calculate direction vector of the ridge
  const direction = endPoint.clone().sub(startPoint).normalize();
  const length = startPoint.distanceTo(endPoint);
  
  for (let i = 0; i < vertices.length; i++) {
    const vertex = vertices[i];
    
    // Project vertex onto line to get closest point on ridge line
    const toVertex = vertex.clone().sub(startPoint);
    const projected = startPoint.clone().add(
      direction.clone().multiplyScalar(toVertex.dot(direction))
    );
    
    // Distance to the ridge line
    const distanceToLine = vertex.distanceTo(projected);
    
    // Distance along the ridge line
    const distanceAlongLine = startPoint.distanceTo(projected);
    
    // Only affect vertices within width of the ridge and along its length
    if (distanceToLine < width && distanceAlongLine <= length) {
      // Ripple effect along ridge with height variations
      const heightVariation = 1 - (distanceToLine / width) ** 2;
      const ridgeOffset = Math.sin(distanceAlongLine * 0.2) * 0.3 + 0.7;
      const displacement = height * heightVariation * ridgeOffset;
      
      // Apply height
      vertex.y += displacement;
    }
  }
  
  for (let i = 0; i < vertices.length; i++) {
    const vertex = vertices[i];
    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  
  positionAttribute.needsUpdate = true;
  geometry.computeVertexNormals();
};

// Create a specific boulder mesh
const Boulder = ({ position, scale, rotation }: { 
  position: [number, number, number], 
  scale: number,
  rotation: number
}) => {
  // Use useMemo to ensure the boulder remains stable
  const boulderProps = useMemo(() => {
    // Slightly randomize the boulder to make each one unique
    // but stable across renders
    const color = new THREE.Color(
      0.55 + Math.random() * 0.05,
      0.22 + Math.random() * 0.05,
      0.05 + Math.random() * 0.02
    );
    
    // Create a unique but stable geometry deformation
    const roughness = 0.8 + Math.random() * 0.15;
    const metalness = 0.1 + Math.random() * 0.1;
    
    return { color, roughness, metalness };
  }, [scale]); // Only recompute if scale changes
  
  return (
    <mesh
      position={position}
      rotation={[0, rotation, 0]}
      castShadow
      receiveShadow
    >
      <dodecahedronGeometry args={[scale, 1]} />
      <meshStandardMaterial 
        color={boulderProps.color}
        roughness={boulderProps.roughness}
        metalness={boulderProps.metalness}
      />
    </mesh>
  );
};

// Create a large rock formation
const RockFormation = ({ position, scale, rotation }: {
  position: [number, number, number],
  scale: number,
  rotation: number
}) => {
  // Use useMemo to ensure rock formation remains stable
  const rocks = useMemo(() => {
    // Generate a random rock formation with multiple parts
    const rockCount = Math.floor(3 + Math.random() * 5);
    const rockElements = [];
    
    for (let i = 0; i < rockCount; i++) {
      // Random offset from center position
      const offsetX = (Math.random() - 0.5) * scale * 1.5;
      const offsetZ = (Math.random() - 0.5) * scale * 1.5;
      const offsetY = Math.random() * scale * 0.5;
      
      // Random individual rock size
      const rockSize = (0.5 + Math.random() * 0.7) * scale;
      
      // Precompute colors and properties to prevent re-randomization
      const rockColor = new THREE.Color(
        0.55 + Math.random() * 0.1,
        0.25 + Math.random() * 0.1,
        0.05 + Math.random() * 0.05
      );
      
      const rockRotation = [
        Math.random() * Math.PI * 0.2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 0.2
      ] as [number, number, number];
      
      rockElements.push(
        <mesh
          key={`formation-rock-${i}`}
          position={[
            position[0] + offsetX,
            position[1] + offsetY,
            position[2] + offsetZ
          ]}
          rotation={rockRotation}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[rockSize, 1]} />
          <meshStandardMaterial 
            color={rockColor}
            roughness={0.8 + Math.random() * 0.2}
            metalness={0.05 + Math.random() * 0.1}
          />
        </mesh>
      );
    }
    
    return rockElements;
  }, [position, scale]); // Dependencies ensure stability unless props change
  
  return <group rotation={[0, rotation, 0]}>{rocks}</group>;
};

const MarsEnvironment = () => {
  // Load Mars ground texture (using sand texture as base)
  const sandTexture = useTexture("/textures/sand.jpg");
  
  // Create Mars surface texture (red tint)
  const marsTexture = useMemo(() => {
    sandTexture.wrapS = sandTexture.wrapT = THREE.RepeatWrapping;
    sandTexture.repeat.set(8, 8);
    
    // Adjust texture color to be Mars-like (reddish)
    const newTexture = sandTexture.clone();
    newTexture.colorSpace = THREE.SRGBColorSpace;
    
    return newTexture;
  }, [sandTexture]);
  
  // Create terrain geometry with craters and hills
  const terrainGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(150, 150, 150, 150);
    
    // Add some random craters
    const craterCount = 25;
    for (let i = 0; i < craterCount; i++) {
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 120,
        0,
        (Math.random() - 0.5) * 120
      );
      const radius = 2 + Math.random() * 6;
      const depth = 0.2 + Math.random() * 1.0;
      
      createCrater(geometry, position, radius, depth);
    }
    
    // Add more varied hills - small and large
    const smallHillCount = 20;
    for (let i = 0; i < smallHillCount; i++) {
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 130,
        0,
        (Math.random() - 0.5) * 130
      );
      const radius = 3 + Math.random() * 7;
      const height = 0.4 + Math.random() * 1.5;
      
      createHill(geometry, position, radius, height);
    }
    
    // Add a few large hills/mountains
    const largeHillCount = 5;
    for (let i = 0; i < largeHillCount; i++) {
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 120,
        0,
        (Math.random() - 0.5) * 120
      );
      const radius = 10 + Math.random() * 15;
      const height = 2 + Math.random() * 4;
      
      createHill(geometry, position, radius, height);
    }
    
    // Add a couple of mountain ridges
    const ridgeCount = 3;
    for (let i = 0; i < ridgeCount; i++) {
      const startPoint = new THREE.Vector3(
        (Math.random() - 0.5) * 100,
        0,
        (Math.random() - 0.5) * 100
      );
      
      // Create an end point in a random direction
      const angle = Math.random() * Math.PI * 2;
      const length = 20 + Math.random() * 40;
      const endPoint = new THREE.Vector3(
        startPoint.x + Math.cos(angle) * length,
        0,
        startPoint.z + Math.sin(angle) * length
      );
      
      const width = 5 + Math.random() * 10;
      const height = 1.5 + Math.random() * 3;
      
      createRidge(geometry, startPoint, endPoint, width, height);
    }
    
    // Rotate to horizontal plane
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }, []);
  
  // Precompute random positions for rocks and boulders
  const rockPositions = useMemo(() => {
    return Array.from({ length: 80 }).map(() => ({
      position: [
        (Math.random() - 0.5) * 140,
        0.15 + Math.random() * 0.2,
        (Math.random() - 0.5) * 140
      ] as [number, number, number],
      scale: 0.3 + Math.random() * 0.8,
      rotation: Math.random() * Math.PI * 2
    }));
  }, []);
  
  // Precompute random positions for larger rock formations
  const rockFormations = useMemo(() => {
    return Array.from({ length: 15 }).map(() => ({
      position: [
        (Math.random() - 0.5) * 130,
        0.5,
        (Math.random() - 0.5) * 130
      ] as [number, number, number],
      scale: 1.5 + Math.random() * 2.5,
      rotation: Math.random() * Math.PI * 2
    }));
  }, []);
  
  // Precompute large boulder obstacles
  const boulderObstacles = useMemo(() => {
    return Array.from({ length: 12 }).map(() => ({
      position: [
        (Math.random() - 0.5) * 100,
        1 + Math.random() * 0.5,
        (Math.random() - 0.5) * 100
      ] as [number, number, number],
      scale: 2 + Math.random() * 3,
      rotation: Math.random() * Math.PI * 2
    }));
  }, []);
  
  // Create atmospheric effects - dust and haze
  const fogColor = new THREE.Color("#661800");
  
  return (
    <>
      {/* Fog for Martian atmosphere */}
      <fog attach="fog" args={[fogColor, 50, 150]} />
      
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.3} color="#f5deb3" />
      
      {/* Main sunlight - reddish tint for Mars */}
      <directionalLight 
        position={[20, 30, 15]} 
        intensity={1.2} 
        color="#ff9966" 
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      
      {/* Secondary fill light */}
      <directionalLight 
        position={[-15, 8, -15]} 
        intensity={0.4} 
        color="#ffccaa" 
      />
      
      {/* Mars terrain */}
      <mesh receiveShadow position={[0, -0.1, 0]} geometry={terrainGeometry}>
        <meshStandardMaterial 
          map={marsTexture}
          color="#c1440e"
          roughness={0.9}
          metalness={0.1}
          displacementScale={0.2}
        />
      </mesh>
      
      {/* Small rocks distributed around */}
      {rockPositions.map((props, i) => (
        <Boulder key={`rock-${i}`} {...props} />
      ))}
      
      {/* Larger rock formations */}
      {rockFormations.map((props, i) => (
        <RockFormation key={`formation-${i}`} {...props} />
      ))}
      
      {/* Large boulder obstacles */}
      {boulderObstacles.map((props, i) => (
        <Boulder key={`obstacle-${i}`} {...props} />
      ))}
      
      {/* Distant mountain backdrop to give illusion of vast landscape */}
      <mesh position={[0, 10, -70]} rotation={[0, 0, 0]}>
        <boxGeometry args={[200, 30, 1]} />
        <meshStandardMaterial 
          color="#a33d0a"
          roughness={1}
          metalness={0}
          opacity={0.8}
          transparent
        />
      </mesh>
    </>
  );
};

export default MarsEnvironment;
