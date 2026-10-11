import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { CylinderGeometry, InstancedMesh, MathUtils, MeshStandardMaterial, Object3D, Quaternion, Sphere, Vector3 } from 'three'
import { makeCoinTextures } from './coinTexture'
import { makeGold } from './materials'
import type { Runtime } from './runtime'
import { lerp } from './story'

const TILT = 0.28

/**
 * Gold ₹ coins orbiting the bubble (as in the reference animation).
 * Scroll: coin count grows, orbits drift through 3D space, then everything settles into an
 * ordered ring (the "organised assets" of the Insight stage).
 * Hover: a coin lifts and spins a little faster.
 */
export function Coins({ rt }: { rt: Runtime }) {
  const MAX = rt.mobile ? 24 : 46
  const ref = useRef<InstancedMesh>(null)
  const hovered = useRef(-1)
  const lift = useMemo(() => ({ current: new Float32Array(MAX) }), [MAX])
  const dummy = useMemo(() => new Object3D(), [])
  const qA = useMemo(() => new Quaternion(), [])
  const qB = useMemo(() => new Quaternion(), [])
  const axis = useMemo(() => new Vector3(), [])

  const geometry = useMemo(() => {
    const g = new CylinderGeometry(0.26, 0.26, 0.05, 48, 1)
    g.rotateX(Math.PI / 2) // caps face +/- Z
    return g
  }, [])

  const materials = useMemo(() => {
    const { map, bump } = makeCoinTextures()
    const side = makeGold(0.3)
    const face = new MeshStandardMaterial({ color: '#ffffff', map, bumpMap: bump, bumpScale: 2.2, metalness: 1, roughness: 0.3, envMapIntensity: 1.7 })
    return [side, face, face]
  }, [])

  const params = useMemo(() => {
    let seed = 42
    const rnd = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }
    return Array.from({ length: MAX }, (_, i) => ({
      a0: (i / MAX) * Math.PI * 2 + rnd() * 0.4,
      speed: 0.1 + rnd() * 0.12,
      rx: 2.3 + rnd() * 0.55,
      y0: (rnd() - 0.5) * 1.3,
      phase: rnd() * Math.PI * 2,
      axis: new Vector3(rnd() - 0.5, rnd() - 0.5 + 0.6, rnd() - 0.5).normalize(),
      spin: 0.5 + rnd() * 0.9,
      scale: 0.8 + rnd() * 0.45,
      drift: new Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5),
    }))
  }, [MAX])

  // Raycasting an InstancedMesh uses its bounding sphere, which would otherwise be computed once from
  // identity matrices (before the first frame positions anything) and make hover miss every coin.
  useEffect(() => {
    if (ref.current) ref.current.boundingSphere = new Sphere(new Vector3(), 5)
  }, [MAX])

  useFrame((_, dtRaw) => {
    const m = ref.current
    if (!m) return
    const dt = rt.animate ? Math.min(dtRaw, 0.05) : 1
    const s = rt.story
    const t = rt.time
    const n = Math.max(1, Math.round(lerp(MAX * 0.42, MAX, s.coinFraction)))
    m.count = n
    const cT = Math.cos(TILT)
    const sT = Math.sin(TILT)

    for (let i = 0; i < n; i++) {
      const p = params[i]
      // free orbit
      const ang = p.a0 + t * p.speed
      const rad = p.rx * (1 + s.growth * 0.1)
      let x = Math.cos(ang) * rad
      let y = p.y0 + Math.sin(ang * 2 + p.phase) * 0.28
      let z = Math.sin(ang) * rad * 0.78
      const dr = s.growth * (1 - s.organize)
      x += Math.sin(t * 0.4 + p.phase) * 0.35 * dr * p.drift.x * 2
      y += Math.sin(t * 0.33 + p.phase * 1.7) * 0.4 * dr * p.drift.y * 2
      z += Math.cos(t * 0.37 + p.phase) * 0.45 * dr * p.drift.z * 2
      const yT = y * cT - z * sT
      const zT = y * sT + z * cT
      y = yT
      z = zT
      // ordered ring
      const oa = (i / n) * Math.PI * 2 + t * 0.05
      const ox = Math.cos(oa) * 2.5
      const oz = Math.sin(oa) * 2.5 * 0.82
      const oy = ((i % 3) - 1) * 0.06 + 0.15

      const org = s.organize
      // hover lift
      const target = hovered.current === i ? 1 : 0
      lift.current[i] = MathUtils.damp(lift.current[i], target, 8, dt)
      dummy.position.set(lerp(x, ox, org), lerp(y, oy, org) + lift.current[i] * 0.22, lerp(z, oz, org))

      axis.copy(p.axis)
      qA.setFromAxisAngle(axis, t * p.spin * (1 + lift.current[i] * 1.5) + p.phase)
      qB.setFromAxisAngle(axis.set(0, 1, 0), Math.PI / 2 - oa)
      qA.slerp(qB, org)
      dummy.quaternion.copy(qA)
      dummy.scale.setScalar(p.scale * (1 + lift.current[i] * 0.12))
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  const over = (e: ThreeEvent<PointerEvent>) => {
    if (rt.mobile) return
    e.stopPropagation()
    hovered.current = e.instanceId ?? -1
  }
  const out = () => {
    hovered.current = -1
  }

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, materials, MAX]}
      frustumCulled={false}
      onPointerMove={over}
      onPointerOut={out}
    />
  )
}
