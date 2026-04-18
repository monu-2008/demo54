"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Torus, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

function MonitorModel() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef} scale={1.8}>
        {/* Monitor Screen */}
        <RoundedBox args={[2.2, 1.5, 0.1]} radius={0.06} smoothness={4} position={[0, 0.4, 0]}>
          <meshPhysicalMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
        </RoundedBox>

        {/* Screen display area */}
        <mesh position={[0, 0.4, 0.055]}>
          <planeGeometry args={[2, 1.3]} />
          <meshPhysicalMaterial
            color="#0a0a1a"
            metalness={0.1}
            roughness={0.1}
            emissive="#0055ff"
            emissiveIntensity={0.15}
          />
        </mesh>

        {/* RACE text on screen - glowing lines */}
        <mesh position={[0, 0.7, 0.058]}>
          <planeGeometry args={[1.2, 0.02]} />
          <meshStandardMaterial emissive="#00e5ff" emissiveIntensity={2} color="#00e5ff" transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, 0.5, 0.058]}>
          <planeGeometry args={[0.8, 0.015]} />
          <meshStandardMaterial emissive="#7c3aff" emissiveIntensity={1.5} color="#7c3aff" transparent opacity={0.6} />
        </mesh>
        <mesh position={[0, 0.35, 0.058]}>
          <planeGeometry args={[1.0, 0.01]} />
          <meshStandardMaterial emissive="#00e5ff" emissiveIntensity={1} color="#00e5ff" transparent opacity={0.4} />
        </mesh>
        <mesh position={[0, 0.25, 0.058]}>
          <planeGeometry args={[0.6, 0.01]} />
          <meshStandardMaterial emissive="#ef4444" emissiveIntensity={1} color="#ef4444" transparent opacity={0.4} />
        </mesh>

        {/* Screen glow dots */}
        {[0.8, 0.6, 0.4, 0.2, 0.0, -0.2].map((y, i) => (
          <mesh key={i} position={[-0.8 + i * 0.15, y * 0.5 + 0.15, 0.058]}>
            <circleGeometry args={[0.015, 16]} />
            <meshStandardMaterial
              emissive={i % 2 === 0 ? "#00e5ff" : "#7c3aff"}
              emissiveIntensity={2}
              color={i % 2 === 0 ? "#00e5ff" : "#7c3aff"}
            />
          </mesh>
        ))}

        {/* Monitor Stand - Neck */}
        <RoundedBox args={[0.25, 0.4, 0.1]} radius={0.03} smoothness={4} position={[0, -0.5, 0]}>
          <meshPhysicalMaterial color="#2a2a3e" metalness={0.9} roughness={0.1} />
        </RoundedBox>

        {/* Monitor Stand - Base */}
        <RoundedBox args={[1.0, 0.08, 0.5]} radius={0.03} smoothness={4} position={[0, -0.72, 0.1]}>
          <meshPhysicalMaterial color="#2a2a3e" metalness={0.9} roughness={0.1} />
        </RoundedBox>

        {/* Keyboard */}
        <RoundedBox args={[1.8, 0.06, 0.6]} radius={0.02} smoothness={4} position={[0, -0.85, 0.8]}>
          <meshPhysicalMaterial color="#1e1e32" metalness={0.7} roughness={0.3} />
        </RoundedBox>

        {/* Keyboard keys rows */}
        {[-0.6, -0.35, -0.1, 0.15, 0.4].map((x, row) => (
          <group key={row} position={[x, -0.82, 0.8]}>
            {[0.15, 0.05, -0.05, -0.15].map((z, col) => (
              <RoundedBox key={col} args={[0.08, 0.02, 0.08]} radius={0.005} smoothness={2} position={[0, 0.02, z]}>
                <meshPhysicalMaterial color="#2a2a4a" metalness={0.5} roughness={0.4} />
              </RoundedBox>
            ))}
          </group>
        ))}
      </group>
    </Float>
  );
}

function OrbitingRing({ radius, speed, color, thickness }: { radius: number; speed: number; color: string; thickness: number }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = Math.PI / 2 + Math.sin(state.clock.elapsedTime * speed) * 0.1;
      ref.current.rotation.z = state.clock.elapsedTime * speed * 0.5;
    }
  });

  return (
    <Torus ref={ref} args={[radius, thickness, 16, 100]}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        transparent
        opacity={0.4}
      />
    </Torus>
  );
}

function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 60;

  const { positions } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return { positions: pos };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      particlesRef.current.rotation.x = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial size={0.03} color="#00e5ff" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function GlowSphere({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <Sphere args={[0.15, 32, 32]} position={position}>
      <MeshDistortMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1}
        distort={0.3}
        speed={2}
        transparent
        opacity={0.7}
      />
    </Sphere>
  );
}

function Scene3D() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
      <directionalLight position={[-3, 3, -3]} intensity={0.4} color="#00e5ff" />
      <pointLight position={[0, 2, 3]} intensity={0.5} color="#7c3aff" />
      <pointLight position={[2, -1, 2]} intensity={0.3} color="#ef4444" />

      <MonitorModel />

      {/* Orbiting rings */}
      <OrbitingRing radius={2.2} speed={0.2} color="#00e5ff" thickness={0.008} />
      <OrbitingRing radius={2.8} speed={-0.15} color="#7c3aff" thickness={0.006} />
      <OrbitingRing radius={3.3} speed={0.1} color="#ef4444" thickness={0.005} />

      {/* Glow spheres */}
      <GlowSphere position={[2, 1.5, 0]} color="#00e5ff" />
      <GlowSphere position={[-1.5, -1, 1]} color="#7c3aff" />
      <GlowSphere position={[1, -1.5, 0.5]} color="#ef4444" />

      <FloatingParticles />
    </>
  );
}

// Fallback shown while 3D is loading
function CanvasFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative">
        {/* CSS animated monitor icon as fallback */}
        <div className="w-32 h-24 rounded-lg border-2 border-blue-400/50 bg-gradient-to-br from-blue-900/30 to-purple-900/30 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <div className="text-blue-400 font-mono text-xs tracking-widest">RACE</div>
        </div>
        <div className="w-8 h-1 bg-blue-400/30 mx-auto" />
        <div className="w-16 h-1 bg-blue-400/20 mx-auto rounded" />
        {/* Rotating ring */}
        <div className="absolute inset-0 -m-8 border border-cyan-400/20 rounded-full animate-spin" style={{ animationDuration: "8s" }} />
        <div className="absolute inset-0 -m-14 border border-purple-400/10 rounded-full animate-spin" style={{ animationDuration: "12s", animationDirection: "reverse" }} />
      </div>
    </div>
  );
}

export default function Race3DObject() {
  return (
    <div className="w-full h-full">
      <Suspense fallback={<CanvasFallback />}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
          onError={(error) => {
            console.error("Three.js Canvas error:", error);
          }}
        >
          <Scene3D />
        </Canvas>
      </Suspense>
    </div>
  );
}
