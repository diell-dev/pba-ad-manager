import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Particles({ count = 120 }) {
  const meshRef = useRef()
  const lineRef = useRef()

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10

      velocities[i * 3] = (Math.random() - 0.5) * 0.003
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.003
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002
    }

    return { positions, velocities }
  }, [count])

  const linePositions = useMemo(() => new Float32Array(count * count * 6), [count])

  useFrame(() => {
    if (!meshRef.current) return

    const pos = meshRef.current.geometry.attributes.position.array
    const vel = particles.velocities

    // Move particles
    for (let i = 0; i < count; i++) {
      pos[i * 3] += vel[i * 3]
      pos[i * 3 + 1] += vel[i * 3 + 1]
      pos[i * 3 + 2] += vel[i * 3 + 2]

      // Wrap around bounds
      for (let j = 0; j < 3; j++) {
        const bounds = j === 2 ? 5 : j === 1 ? 7 : 10
        if (Math.abs(pos[i * 3 + j]) > bounds) {
          vel[i * 3 + j] *= -1
        }
      }
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true

    // Draw connections
    if (lineRef.current) {
      let lineIdx = 0
      const connectionDistance = 3

      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const dx = pos[i * 3] - pos[j * 3]
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1]
          const dz = pos[i * 3 + 2] - pos[j * 3 + 2]
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

          if (dist < connectionDistance && lineIdx < linePositions.length - 6) {
            linePositions[lineIdx++] = pos[i * 3]
            linePositions[lineIdx++] = pos[i * 3 + 1]
            linePositions[lineIdx++] = pos[i * 3 + 2]
            linePositions[lineIdx++] = pos[j * 3]
            linePositions[lineIdx++] = pos[j * 3 + 1]
            linePositions[lineIdx++] = pos[j * 3 + 2]
          }
        }
      }

      // Zero out remaining
      for (let i = lineIdx; i < linePositions.length; i++) {
        linePositions[i] = 0
      }

      lineRef.current.geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(linePositions.slice(0, lineIdx), 3)
      )
      lineRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <group rotation={[0.1, 0, 0]}>
      {/* Particles */}
      <points ref={meshRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={particles.positions}
            count={count}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color="#00ff85"
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>

      {/* Connection lines */}
      <lineSegments ref={lineRef}>
        <bufferGeometry />
        <lineBasicMaterial color="#00ff85" transparent opacity={0.08} />
      </lineSegments>
    </group>
  )
}

export default function ParticleBackground({ intensity = 'subtle' }) {
  const count = intensity === 'full' ? 200 : 80

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: intensity === 'subtle' ? 0.3 : 0.8 }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Particles count={count} />
      </Canvas>
    </div>
  )
}
