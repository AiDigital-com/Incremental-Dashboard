import { useRef, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'
import type { Group } from 'three'
import maxHeadImg from '../assets/max-head.png'

// ── Palette ───────────────────────────────────────────────────────────────────
const FUR  = '#D4903A'
const SUIT = '#1B3560'
const SHIRT = '#EEEEFF'
const TIE  = '#CC1A1A'

// ── Tiny geometry helpers ─────────────────────────────────────────────────────
type V3 = [number, number, number]

function Sp({ p, r, c, s }: { p: V3; r: number; c: string; s?: V3 }) {
  return (
    <mesh position={p} scale={s ?? [1, 1, 1]}>
      <sphereGeometry args={[r, 16, 12]} />
      <meshStandardMaterial color={c} roughness={0.72} />
    </mesh>
  )
}

function Bx({ p, sz, c, rot }: { p: V3; sz: V3; c: string; rot?: V3 }) {
  return (
    <mesh position={p} rotation={rot ?? [0, 0, 0]}>
      <boxGeometry args={sz} />
      <meshStandardMaterial color={c} roughness={0.72} />
    </mesh>
  )
}

// ── Animated character ────────────────────────────────────────────────────────
function MaxScene() {
  const rootRef = useRef<Group>(null)
  const headRef = useRef<Group>(null)
  const armRRef = useRef<Group>(null)

  const headTexture = useLoader(TextureLoader, maxHeadImg)

  // Wave fires on sequence: wait 5s → wave, wait 7s → wave, etc.
  const wave = useRef({
    timer: 0,
    seqIdx: 0,
    intervals: [5, 7, 5, 10] as const,
    next: 5,
    active: false,
    phase: 0,
  })

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime

    // Gentle float + slow sway
    if (rootRef.current) {
      rootRef.current.position.y = -1.60 + Math.sin(t * 0.85) * 0.011
      rootRef.current.rotation.y = Math.sin(t * 0.42) * 0.07
    }

    // Subtle head tilt
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 0.65) * 0.05
      headRef.current.rotation.x = Math.sin(t * 0.52) * 0.025
    }

    // Wave — right arm
    const w = wave.current
    w.timer += delta
    if (!w.active && w.timer >= w.next) {
      w.active = true; w.phase = 0; w.timer = 0
    }
    if (w.active && armRRef.current) {
      w.phase += delta / 2.0
      const p = w.phase
      let rotZ: number
      if (p < 0.2) {
        rotZ = -0.42 + (-1.78) * (p / 0.2)
      } else if (p < 0.8) {
        rotZ = -2.2 + Math.sin(((p - 0.2) / 0.6) * Math.PI * 3) * 0.12
      } else {
        rotZ = -2.2 + 1.78 * ((p - 0.8) / 0.2)
      }
      armRRef.current.rotation.z = rotZ
      if (p >= 1.0) {
        w.active = false
        w.seqIdx = (w.seqIdx + 1) % 4
        w.next   = w.intervals[w.seqIdx]
        w.timer  = 0
        armRRef.current.rotation.z = -0.42
      }
    }
  })

  return (
    <group ref={rootRef}>

      {/* ── FEET ─────────────────────────────────────────────────────────── */}
      <Sp p={[-0.12, 0.07, 0.04]} r={0.080} c={FUR} s={[1.30, 0.70, 1.10]} />
      <Sp p={[ 0.12, 0.07, 0.04]} r={0.080} c={FUR} s={[1.30, 0.70, 1.10]} />

      {/* ── LEGS ─────────────────────────────────────────────────────────── */}
      <mesh position={[-0.100, 0.37, 0]}>
        <capsuleGeometry args={[0.065, 0.30, 4, 12]} />
        <meshStandardMaterial color={SUIT} roughness={0.70} />
      </mesh>
      <mesh position={[ 0.100, 0.37, 0]}>
        <capsuleGeometry args={[0.065, 0.30, 4, 12]} />
        <meshStandardMaterial color={SUIT} roughness={0.70} />
      </mesh>

      {/* ── JACKET ───────────────────────────────────────────────────────── */}
      <Bx p={[0, 0.87, 0]} sz={[0.250, 0.52, 0.130]} c={SUIT} />
      <Sp p={[-0.150, 1.095, 0]} r={0.068} c={SUIT} s={[1.10, 0.85, 0.74]} />
      <Sp p={[ 0.150, 1.095, 0]} r={0.068} c={SUIT} s={[1.10, 0.85, 0.74]} />
      <Bx p={[0, 0.628, 0]} sz={[0.265, 0.017, 0.142]} c={SUIT} />

      {/* Shirt front panel */}
      <Bx p={[0, 0.870, 0.068]} sz={[0.088, 0.38, 0.008]} c={SHIRT} />
      {/* Lapels */}
      <Bx p={[-0.043, 1.015, 0.068]} sz={[0.050, 0.152, 0.008]} c={SHIRT} rot={[0, 0,  0.50]} />
      <Bx p={[ 0.043, 1.015, 0.068]} sz={[0.050, 0.152, 0.008]} c={SHIRT} rot={[0, 0, -0.50]} />
      {/* Tie */}
      <Bx p={[0, 0.870, 0.069]} sz={[0.026, 0.300, 0.008]} c={TIE} />
      <Sp p={[0, 1.014, 0.069]} r={0.020} c={TIE} />

      {/* ── ARMS ─────────────────────────────────────────────────────────── */}
      {/* Left arm + paw (static) */}
      <mesh position={[0.228, 0.935, 0]} rotation={[0, 0, 0.42]}>
        <capsuleGeometry args={[0.048, 0.240, 4, 12]} />
        <meshStandardMaterial color={SUIT} roughness={0.70} />
      </mesh>
      <Sp p={[0.300, 0.770, 0]} r={0.063} c={FUR} />

      {/* Right arm + paw — pivots at shoulder for wave */}
      <group ref={armRRef} position={[-0.159, 1.089, 0]} rotation={[0, 0, -0.42]}>
        <mesh position={[0, -0.168, 0]}>
          <capsuleGeometry args={[0.048, 0.240, 4, 12]} />
          <meshStandardMaterial color={SUIT} roughness={0.70} />
        </mesh>
        <mesh position={[0, -0.36, 0]}>
          <sphereGeometry args={[0.063, 16, 12]} />
          <meshStandardMaterial color={FUR} roughness={0.72} />
        </mesh>
      </group>

      {/* ── NECK FUR ─────────────────────────────────────────────────────── */}
      <Sp p={[0, 1.160, 0]} r={0.090} c={FUR} />

      {/* ── HEAD — image sprite (carries subtle tilt animation) ──────────── */}
      <group ref={headRef} position={[0, 1.45, 0]}>
        <mesh position={[0, 0.02, 0.10]}>
          <planeGeometry args={[0.76, 0.76]} />
          <meshBasicMaterial map={headTexture} transparent alphaTest={0.05} />
        </mesh>
      </group>

    </group>
  )
}

// ── Exported canvas component ─────────────────────────────────────────────────
export function Max3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.50], fov: 40 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent', display: 'block', width: '100%', height: '300px' }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight color="#FFE8C0" intensity={1.45} position={[1.5, 2.5, 2.0]} />
      <directionalLight color="#8EE7F1" intensity={0.32} position={[-2.0, 0.5, -1.5]} />
      <directionalLight color="#AEF33E" intensity={0.14} position={[0, -1.5, 1.0]} />
      <Suspense fallback={null}>
        <MaxScene />
      </Suspense>
    </Canvas>
  )
}
