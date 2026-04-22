import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'

// ── Palette ───────────────────────────────────────────────────────────────────
const FUR      = '#D4903A'
const FUR_DARK = '#AA6E18'
const SUIT     = '#1B3560'
const SHIRT    = '#EEEEFF'
const TIE      = '#CC1A1A'
const DARK     = '#1A0D06'
const PINK     = '#F87171'
const WHITE    = '#FFFFFF'

// ── Tiny geometry helpers (reduce repetition) ─────────────────────────────────
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
  const rootRef   = useRef<Group>(null)
  const headRef   = useRef<Group>(null)
  const eyeLRef   = useRef<Mesh>(null)
  const eyeRRef   = useRef<Mesh>(null)
  const earLRef   = useRef<Mesh>(null)
  const earRRef   = useRef<Mesh>(null)
  const armRRef   = useRef<Group>(null)

  const blink = useRef({ timer: 0, next: 2 + Math.random() * 2, active: false, phase: 0 })

  // Wave fires on sequence: wait 5s → wave, wait 7s → wave, wait 5s → wave, wait 10s → wave, repeat
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

    // Gentle float + slow sway (amplitude reduced to 25%)
    if (rootRef.current) {
      rootRef.current.position.y = -1.60 + Math.sin(t * 0.85) * 0.011
      rootRef.current.rotation.y = Math.sin(t * 0.42) * 0.07
    }

    // Subtle head tilt
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 0.65) * 0.05
      headRef.current.rotation.x = Math.sin(t * 0.52) * 0.025
    }

    // Ear flutter
    if (earLRef.current) earLRef.current.rotation.z =  0.14 + Math.sin(t * 1.25 + 1.0) * 0.08
    if (earRRef.current) earRRef.current.rotation.z = -0.14 + Math.sin(t * 1.25) * 0.08

    // Blinking
    const b = blink.current
    b.timer += delta
    if (!b.active && b.timer >= b.next) { b.active = true; b.phase = 0; b.timer = 0 }
    if (b.active) {
      b.phase += delta / 0.13
      const sy = Math.max(0.07, b.phase < 0.5 ? 1 - b.phase * 2 : (b.phase - 0.5) * 2)
      if (eyeLRef.current) eyeLRef.current.scale.y = sy
      if (eyeRRef.current) eyeRRef.current.scale.y = sy
      if (b.phase >= 1) {
        b.active = false; b.next = 2.5 + Math.random() * 3.5; b.timer = 0
        if (eyeLRef.current) eyeLRef.current.scale.y = 1
        if (eyeRRef.current) eyeRRef.current.scale.y = 1
      }
    }

    // Wave — right arm only
    const w = wave.current
    w.timer += delta
    if (!w.active && w.timer >= w.next) {
      w.active = true; w.phase = 0; w.timer = 0
    }
    if (w.active && armRRef.current) {
      w.phase += delta / 2.0   // 2s total wave duration
      const p = w.phase
      let rotZ: number
      if (p < 0.2) {
        // raise arm: 0.42 → -1.0
        rotZ = 0.42 + (-1.42) * (p / 0.2)
      } else if (p < 0.8) {
        // waggle 3 cycles around -1.0
        rotZ = -1.0 + Math.sin(((p - 0.2) / 0.6) * Math.PI * 3) * 0.35
      } else {
        // lower arm: -1.0 → 0.42
        rotZ = -1.0 + 1.42 * ((p - 0.8) / 0.2)
      }
      armRRef.current.rotation.z = rotZ
      if (p >= 1.0) {
        w.active = false
        w.seqIdx = (w.seqIdx + 1) % 4
        w.next   = w.intervals[w.seqIdx]
        w.timer  = 0
        armRRef.current.rotation.z = 0.42
      }
    }
  })

  return (
    <group ref={rootRef}>

      {/* ── FEET ─────────────────────────────────────────────────────────── */}
      <Sp p={[-0.12, 0.07, 0.04]} r={0.080} c={FUR} s={[1.30, 0.70, 1.10]} />
      <Sp p={[ 0.12, 0.07, 0.04]} r={0.080} c={FUR} s={[1.30, 0.70, 1.10]} />

      {/* ── LEGS (slim navy trousers) ─────────────────────────────────────── */}
      <mesh position={[-0.100, 0.37, 0]}>
        <capsuleGeometry args={[0.065, 0.30, 4, 12]} />
        <meshStandardMaterial color={SUIT} roughness={0.70} />
      </mesh>
      <mesh position={[ 0.100, 0.37, 0]}>
        <capsuleGeometry args={[0.065, 0.30, 4, 12]} />
        <meshStandardMaterial color={SUIT} roughness={0.70} />
      </mesh>

      {/* ── JACKET — slim European fit: 0.25w × 0.13d ───────────────────── */}
      <Bx p={[0, 0.87, 0]} sz={[0.250, 0.52, 0.130]} c={SUIT} />
      {/* Shoulder rounds to soften corners */}
      <Sp p={[-0.150, 1.095, 0]} r={0.068} c={SUIT} s={[1.10, 0.85, 0.74]} />
      <Sp p={[ 0.150, 1.095, 0]} r={0.068} c={SUIT} s={[1.10, 0.85, 0.74]} />
      {/* Hem detail */}
      <Bx p={[0, 0.628, 0]} sz={[0.265, 0.017, 0.142]} c={SUIT} />

      {/* Shirt front panel */}
      <Bx p={[0, 0.870, 0.068]} sz={[0.088, 0.38, 0.008]} c={SHIRT} />
      {/* Lapels */}
      <Bx p={[-0.043, 1.015, 0.068]} sz={[0.050, 0.152, 0.008]} c={SHIRT} rot={[0, 0,  0.50]} />
      <Bx p={[ 0.043, 1.015, 0.068]} sz={[0.050, 0.152, 0.008]} c={SHIRT} rot={[0, 0, -0.50]} />
      {/* Tie body + knot */}
      <Bx p={[0, 0.870, 0.069]} sz={[0.026, 0.300, 0.008]} c={TIE} />
      <Sp p={[0, 1.014, 0.069]} r={0.020} c={TIE} />

      {/* ── ARMS ─────────────────────────────────────────────────────────── */}
      {/* Left arm + paw (static) */}
      <mesh position={[-0.228, 0.935, 0]} rotation={[0, 0, -0.42]}>
        <capsuleGeometry args={[0.048, 0.240, 4, 12]} />
        <meshStandardMaterial color={SUIT} roughness={0.70} />
      </mesh>
      <Sp p={[-0.300, 0.770, 0]} r={0.063} c={FUR} />

      {/* Right arm + paw grouped so paw follows arm during wave */}
      <group ref={armRRef} position={[0.228, 0.935, 0]} rotation={[0, 0, 0.42]}>
        <mesh>
          <capsuleGeometry args={[0.048, 0.240, 4, 12]} />
          <meshStandardMaterial color={SUIT} roughness={0.70} />
        </mesh>
        {/* Paw offset relative to arm center (matches original world position [0.300, 0.770]) */}
        <mesh position={[0.072, -0.165, 0]}>
          <sphereGeometry args={[0.063, 16, 12]} />
          <meshStandardMaterial color={FUR} roughness={0.72} />
        </mesh>
      </group>

      {/* ── NECK FUR ─────────────────────────────────────────────────────── */}
      <Sp p={[0, 1.160, 0]} r={0.090} c={FUR} />

      {/* ── HEAD GROUP (carries blink/tilt animations) ────────────────────── */}
      <group ref={headRef} position={[0, 1.43, 0]}>

        {/* Floppy ears */}
        <mesh ref={earLRef} position={[-0.232, 0.018, -0.040]} rotation={[0.10, 0, 0.14]} scale={[0.84, 1.42, 0.60]}>
          <sphereGeometry args={[0.112, 14, 12]} />
          <meshStandardMaterial color={FUR_DARK} roughness={0.85} />
        </mesh>
        <mesh ref={earRRef} position={[ 0.232, 0.018, -0.040]} rotation={[0.10, 0, -0.14]} scale={[0.84, 1.42, 0.60]}>
          <sphereGeometry args={[0.112, 14, 12]} />
          <meshStandardMaterial color={FUR_DARK} roughness={0.85} />
        </mesh>

        {/* Main head */}
        <Sp p={[0, 0, 0]} r={0.262} c={FUR} />

        {/* Top fluff bumps */}
        <Sp p={[-0.118,  0.220, 0.040]} r={0.090} c={FUR} />
        <Sp p={[  0,     0.248, 0.058]} r={0.100} c={FUR} />
        <Sp p={[ 0.118,  0.220, 0.040]} r={0.090} c={FUR} />

        {/* Cheek puffs */}
        <Sp p={[-0.232, -0.008, 0.100]} r={0.078} c={FUR} />
        <Sp p={[ 0.232, -0.008, 0.100]} r={0.078} c={FUR} />

        {/* Eyes */}
        <mesh ref={eyeLRef} position={[-0.092, 0.036, 0.247]}>
          <sphereGeometry args={[0.036, 14, 12]} />
          <meshStandardMaterial color={DARK} />
        </mesh>
        <mesh ref={eyeRRef} position={[ 0.092, 0.036, 0.247]}>
          <sphereGeometry args={[0.036, 14, 12]} />
          <meshStandardMaterial color={DARK} />
        </mesh>
        {/* Eye shines */}
        <Sp p={[-0.079, 0.050, 0.275]} r={0.012} c={WHITE} />
        <Sp p={[ 0.105, 0.050, 0.275]} r={0.012} c={WHITE} />

        {/* Nose */}
        <mesh position={[0, -0.052, 0.260]}>
          <sphereGeometry args={[0.036, 14, 12]} />
          <meshStandardMaterial color={DARK} />
        </mesh>

        {/* Tongue peek */}
        <Sp p={[0, -0.114, 0.246]} r={0.024} c={PINK} s={[1.10, 0.78, 0.70]} />
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

      <MaxScene />
    </Canvas>
  )
}
