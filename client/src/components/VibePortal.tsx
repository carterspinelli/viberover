import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useRover } from '../lib/stores/useRover';

interface PortalProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  label?: string;
  portalUrl: string;
  username: string;
}

const VibePortal: React.FC<PortalProps> = ({
  position,
  rotation = [0, 0, 0],
  color = '#00ff00',
  label = 'VIBEVERSE PORTAL',
  portalUrl,
  username,
}) => {
  const portalGroupRef = useRef<THREE.Group>(null);
  const portalInnerRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const [portalBox, setPortalBox] = useState<THREE.Box3 | null>(null);
  const [isPreloading, setIsPreloading] = useState(false);
  
  // Get rover position from store
  const roverPosition = useRover(state => state.position);
  const roverVelocity = useRover(state => state.velocity);
  
  // Create a stable position from the array
  const stablePosition = useMemo(() => new THREE.Vector3(...position), [position]);

  // Colors based on prop
  const portalColorHex = color;
  const portalColor = new THREE.Color(portalColorHex);
  const colorR = portalColor.r;
  const colorG = portalColor.g;
  const colorB = portalColor.b;

  // Create particles
  useEffect(() => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;
      
      for (let i = 0; i < positions.length; i += 3) {
        // Create particles in a ring around the portal
        const angle = Math.random() * Math.PI * 2;
        const radius = 3 + (Math.random() - 0.5) * 1;
        positions[i] = Math.cos(angle) * radius;
        positions[i + 1] = Math.sin(angle) * radius;
        positions[i + 2] = (Math.random() - 0.5) * 1;

        // Set colors with slight variation
        colors[i] = colorR * (0.8 + Math.random() * 0.2);
        colors[i + 1] = colorG * (0.8 + Math.random() * 0.2);
        colors[i + 2] = colorB * (0.8 + Math.random() * 0.2);
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      particlesRef.current.geometry.attributes.color.needsUpdate = true;
    }
  }, [colorR, colorG, colorB]);

  // Update portal box for collision detection
  useEffect(() => {
    if (portalGroupRef.current) {
      const box = new THREE.Box3().setFromObject(portalGroupRef.current);
      setPortalBox(box);
    }
  }, [position]);

  // Animate particles and check collision
  useFrame((_, delta) => {
    // Animate portal
    if (portalGroupRef.current) {
      portalGroupRef.current.rotation.z += delta * 0.5;
    }
    
    // Animate particles
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += 0.05 * Math.sin(Date.now() * 0.001 + i);
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
    
    // Check collision with rover
    if (portalBox) {
      const roverBox = new THREE.Box3(
        new THREE.Vector3(roverPosition.x - 1, roverPosition.y - 1, roverPosition.z - 1),
        new THREE.Vector3(roverPosition.x + 1, roverPosition.y + 1, roverPosition.z + 1)
      );
      
      // Check if rover is within 10 units of the portal
      const portalCenter = new THREE.Vector3();
      portalBox.getCenter(portalCenter);
      const roverCenter = new THREE.Vector3();
      roverBox.getCenter(roverCenter);
      
      const distance = portalCenter.distanceTo(roverCenter);
      
      // If rover is getting close, preload destination
      if (distance < 15 && !isPreloading) {
        setIsPreloading(true);
        
        // Build destination URL with all params
        const params = new URLSearchParams();
        params.append('portal', 'true');
        params.append('username', username);
        params.append('color', '#ff0000'); // Red for Mars rover
        params.append('speed', Math.abs(roverVelocity).toString());
        params.append('ref', window.location.origin + window.location.pathname);
        
        const destinationUrl = `${portalUrl}?${params.toString()}`;
        
        // Preload destination in hidden iframe
        if (!document.getElementById('preloadFrame')) {
          const iframe = document.createElement('iframe');
          iframe.id = 'preloadFrame';
          iframe.style.display = 'none';
          iframe.src = destinationUrl;
          document.body.appendChild(iframe);
          console.log('Preloading portal destination:', destinationUrl);
        }
      }
      
      // If rover has entered portal, redirect
      if (distance < 3) {
        console.log('Portal entered! Redirecting...');
        
        // Build destination URL with all params
        const params = new URLSearchParams();
        params.append('portal', 'true');
        params.append('username', username);
        params.append('color', '#ff0000'); // Red for Mars rover
        params.append('speed', Math.abs(roverVelocity).toString());
        params.append('ref', window.location.origin + window.location.pathname);
        
        const destinationUrl = `${portalUrl}?${params.toString()}`;
        window.location.href = destinationUrl;
      }
    }
  });

  return (
    <group ref={portalGroupRef} position={new THREE.Vector3(...position)} rotation={new THREE.Euler(...rotation)}>
      {/* Portal ring */}
      <mesh>
        <torusGeometry args={[3, 0.4, 16, 100]} />
        <meshPhongMaterial 
          color={portalColorHex}
          emissive={portalColorHex}
          transparent={true}
          opacity={0.8}
        />
      </mesh>
      
      {/* Portal inner surface */}
      <mesh ref={portalInnerRef}>
        <circleGeometry args={[2.6, 32]} />
        <meshBasicMaterial
          color={portalColorHex}
          transparent={true}
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={1000}
            array={new Float32Array(1000 * 3)}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={1000}
            array={new Float32Array(1000 * 3)}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          vertexColors={true}
          transparent={true}
          opacity={0.6}
        />
      </points>
      
      {/* Portal label */}
      <Text
        position={[0, 4, 0]}
        fontSize={0.5}
        color={portalColorHex}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {label}
      </Text>
    </group>
  );
};

export default VibePortal;