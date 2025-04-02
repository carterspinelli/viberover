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

const MarsEnvironment = () => {
  // Load Mars ground texture (using sand texture as base)
  const sandTexture = useTexture("/textures/sand.jpg");
  
  // Create Mars surface texture (red tint)
  const marsTexture = useMemo(() => {
    sandTexture.wrapS = sandTexture.wrapT = THREE.RepeatWrapping;
    sandTexture.repeat.set(5, 5);
    
    // Adjust texture color to be Mars-like (reddish)
    const newTexture = sandTexture.clone();
    newTexture.colorSpace = THREE.SRGBColorSpace;
    
    return newTexture;
  }, [sandTexture]);
  
  // Create terrain geometry with craters and hills
  const terrainGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(100, 100, 128, 128);
    
    // Add some random craters
    const craterCount = 15;
    for (let i = 0; i < craterCount; i++) {
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 80,
        0,
        (Math.random() - 0.5) * 80
      );
      const radius = 2 + Math.random() * 5;
      const depth = 0.2 + Math.random() * 0.8;
      
      createCrater(geometry, position, radius, depth);
    }
    
    // Add some hills
    const hillCount = 10;
    for (let i = 0; i < hillCount; i++) {
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 80,
        0,
        (Math.random() - 0.5) * 80
      );
      const radius = 5 + Math.random() * 10;
      const height = 0.5 + Math.random() * 2;
      
      createHill(geometry, position, radius, height);
    }
    
    // Rotate to horizontal plane
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }, []);
  
  // Create Martian sky (simple dark red/orange gradient for Mars atmosphere)
  const skyColor = new THREE.Color("#270000");
  const horizonColor = new THREE.Color("#661800");
  
  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.3} color="#f5deb3" />
      
      {/* Main sunlight - reddish tint for Mars */}
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={1.5} 
        color="#ff9966" 
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      {/* Secondary fill light */}
      <directionalLight 
        position={[-10, 5, -10]} 
        intensity={0.5} 
        color="#ffccaa" 
      />
      
      {/* Mars terrain */}
      <mesh receiveShadow position={[0, 0, 0]} geometry={terrainGeometry}>
        <meshStandardMaterial 
          map={marsTexture}
          color="#c1440e"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* Add some rocks for more detail */}
      {Array.from({ length: 50 }).map((_, i) => {
        // Precompute random values outside component rendering
        const position = [
          (Math.random() - 0.5) * 80,
          0,
          (Math.random() - 0.5) * 80
        ];
        const scale = 0.3 + Math.random() * 0.7;
        const rotation = Math.random() * Math.PI * 2;
        
        return (
          <mesh 
            key={`rock-${i}`}
            position={[position[0], position[1] + scale / 2, position[2]]}
            rotation={[0, rotation, 0]}
            castShadow
            receiveShadow
          >
            <dodecahedronGeometry args={[scale, 0]} />
            <meshStandardMaterial 
              color="#ab5c2e"
              roughness={0.9}
              metalness={0.2}
            />
          </mesh>
        );
      })}
    </>
  );
};

export default MarsEnvironment;
