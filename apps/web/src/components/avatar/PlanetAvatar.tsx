'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface PlanetProps {
  isSpeaking: boolean;
}

function AnimatedPlanet({ isSpeaking }: PlanetProps) {
  const materialRef = useRef<any>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (materialRef.current) {
      // Smoothly transition the distortion and speed based on speaking state
      const targetDistort = isSpeaking ? 0.4 : 0.1;
      const targetSpeed = isSpeaking ? 4 : 1;
      
      materialRef.current.distort = THREE.MathUtils.lerp(materialRef.current.distort, targetDistort, 0.1);
      materialRef.current.speed = THREE.MathUtils.lerp(materialRef.current.speed, targetSpeed, 0.1);
    }
    
    if (meshRef.current) {
      // Slowly rotate the planet
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.1;
      
      // Grow and shrink slightly
      const targetScale = isSpeaking ? 1.15 : 1.0;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <Sphere ref={meshRef} args={[1.2, 64, 64]}>
      <MeshDistortMaterial
        ref={materialRef}
        color="#6C4DFF" // Violet
        emissive="#4A31D1"
        emissiveIntensity={0.5}
        roughness={0.2}
        metalness={0.8}
        distort={0.1} // Base distortion
        speed={1}     // Base speed
      />
    </Sphere>
  );
}

export const PlanetAvatar: React.FC<{ isSpeaking: boolean; className?: string }> = ({ isSpeaking, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Dynamic Glow Behind Planet */}
      <div 
        className={`absolute inset-0 rounded-full bg-violet/40 blur-2xl transition-all duration-300 ${
          isSpeaking ? 'scale-150 opacity-100' : 'scale-100 opacity-50'
        }`} 
      />
      
      {/* 3D Canvas */}
      <Canvas 
        camera={{ position: [0, 0, 3], fov: 45 }} 
        className="w-full h-full rounded-full relative z-10"
        dpr={[1, 1.5]} // Limit pixel ratio to save battery/performance on mobile
        gl={{ powerPreference: 'high-performance', antialias: true }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 5, 5]} intensity={2} color="#2ED47A" /> {/* Mint highlight */}
        <directionalLight position={[-5, -5, -5]} intensity={2} color="#38C6F4" /> {/* Sky highlight */}
        <Environment preset="city" />
        <AnimatedPlanet isSpeaking={isSpeaking} />
      </Canvas>
    </div>
  );
};
