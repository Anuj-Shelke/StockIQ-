import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  CubicBezierCurve3,
  CurvePath,
  ExtrudeGeometry,
  Group,
  LineCurve3,
  MathUtils,
  MeshPhysicalMaterial,
  Shape,
  TubeGeometry,
  Vector3,
} from 'three'
import { makeGold } from './materials'
import type { Runtime } from './runtime'

/**
 * The hero object: a vertical, lush black ceramic financial card with a very thin
 * polished-gold edge and a tone-on-tone embossed ₹.
 * Idle: slow sway + bob. Scroll: one eased 360° turn, then it settles facing front.
 * Pointer: gentle parallax tilt. Reduced motion: static front-facing pose.
 */

const W = 0.95
const H = 1.5
const R = 0.08
const DEPTH = 0.045
const BEVEL = 0.008
const FRONT = DEPTH / 2 + BEVEL // z of the front face after centering

function drawRoundedRect(p: Shape, w: number, h: number, r: number) {
  const x = -w / 2
  const y = -h / 2
  p.moveTo(x + r, y)
  p.lineTo(x + w - r, y)
  p.quadraticCurveTo(x + w, y, x + w, y + r)
  p.lineTo(x + w, y + h - r)
  p.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  p.lineTo(x + r, y + h)
  p.quadraticCurveTo(x, y + h, x, y + h - r)
  p.lineTo(x, y + r)
  p.quadraticCurveTo(x, y, x + r, y)
}

export function Rupee({ rt }: { rt: Runtime }) {
  const group = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)

  const gold = useMemo(() => makeGold(0.18), [])

  // Lush near-black ceramic: deep base colour, glassy clearcoat.
  const black = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: '#040405',
        metalness: 0.3,
        roughness: 0.4,
        clearcoat: 1,
        clearcoatRoughness: 0.07,
        envMapIntensity: 0.8,
      }),
    [],
  )

  // Tone-on-tone emboss: dark brushed gold, no shine.
  const emboss = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: '#2a2216',
        metalness: 0.85,
        roughness: 0.4,
        clearcoat: 0.3,
        clearcoatRoughness: 0.4,
      }),
    [],
  )

  // Card body. ExtrudeGeometry groups: 0 = front/back faces, 1 = sides + bevel (gold edge).
  const body = useMemo(() => {
    const shape = new Shape()
    drawRoundedRect(shape, W, H, R)
    const geo = new ExtrudeGeometry(shape, {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 4,
      curveSegments: 24,
    })
    geo.center()
    return geo
  }, [])

  // ₹ glyph (relief only).
  const tube = useMemo(() => {
    const path = new CurvePath<Vector3>()
    path.add(
      new CubicBezierCurve3(new Vector3(-0.24, 0.46, 0), new Vector3(0.46, 0.46, 0), new Vector3(0.46, -0.1, 0), new Vector3(-0.24, -0.1, 0)),
    )
    path.add(new LineCurve3(new Vector3(-0.24, -0.1, 0), new Vector3(0.3, -0.56, 0)))
    return new TubeGeometry(path, 72, 0.055, 18, false)
  }, [])

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    const k = rt.animate ? Math.min(dt, 0.05) : 1
    const TAU = Math.PI * 2

    // One single, eased 360° turn driven by scroll, then it settles facing front.
    const p = rt.animate ? MathUtils.clamp(rt.story.rupeeSpin / TAU, 0, 1) : 0
    const turn = MathUtils.smootherstep(p, 0, 1) * TAU
    const dip = Math.sin(p * Math.PI) * 0.3 // gentle vertical tilt during the turn

    // Slow idle sway (horizontal + vertical) so it never feels frozen.
    const swayY = rt.animate ? Math.sin(rt.time * 0.5) * 0.18 : 0
    const swayX = rt.animate ? Math.sin(rt.time * 0.7) * 0.04 : 0
    const bob = rt.animate ? Math.sin(rt.time * 0.9) * 0.05 : 0

    g.position.y = 1.15 + bob
    g.rotation.y = MathUtils.damp(g.rotation.y, turn + swayY + rt.pointer.x * 0.25, rt.animate ? 5 : 100, k)
    g.rotation.x = MathUtils.damp(g.rotation.x, -0.08 + swayX + dip - rt.pointer.y * 0.12, rt.animate ? 5 : 100, k)
    g.rotation.z = rt.animate ? Math.sin(rt.time * 0.5) * 0.01 : 0
    const s = MathUtils.damp(g.scale.x, hovered ? 1.29 : 1.25, 6, k)
    g.scale.setScalar(s)
  })

  const handlers = rt.mobile
    ? {}
    : {
        onPointerOver: () => setHovered(true),
        onPointerOut: () => setHovered(false),
      }

  return (
    <group ref={group} scale={1.25} {...handlers}>
      <mesh geometry={body} material={[black, gold]} />

      {/* embossed ₹ on the front face */}
      <group position={[-0.02, 0.06, FRONT - 0.004]} scale={[0.5, 0.5, 0.3]}>
        <mesh geometry={tube} material={emboss} />
        <mesh position={[0, 0.46, 0]} rotation-z={Math.PI / 2} material={emboss}>
          <capsuleGeometry args={[0.05, 0.64, 6, 16]} />
        </mesh>
        <mesh position={[0, 0.2, 0]} rotation-z={Math.PI / 2} material={emboss}>
          <capsuleGeometry args={[0.05, 0.64, 6, 16]} />
        </mesh>
      </group>
    </group>
  )
}