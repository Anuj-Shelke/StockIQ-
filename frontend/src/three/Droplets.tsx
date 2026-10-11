import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedMesh, Object3D, Vector3 } from 'three'
import { BURST_ORIGIN } from './Bubble'
import type { Runtime } from './runtime'
import { smooth } from './story'

/** Small transparent water droplets that scatter as the film tears, catch the light, then fall away. */
export function Droplets({ rt }: { rt: Runtime }) {
  const count = rt.mobile ? 70 : 150
  const ref = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])

  const data = useMemo(() => {
    let seed = 7
    const rnd = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }
    return Array.from({ length: count }, () => {
      const u = rnd() * 2 - 1
      const a = rnd() * Math.PI * 2
      const r = Math.sqrt(1 - u * u)
      const dir = new Vector3(r * Math.cos(a), u, r * Math.sin(a))
      const tangent = new Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.9)
      const vel = dir.clone().multiplyScalar(0.6 + rnd() * 1.5).add(tangent).add(new Vector3(0, 0.35, 0))
      const size = rnd() < 0.12 ? 0.07 + rnd() * 0.05 : 0.018 + rnd() * 0.04
      return { dir, vel, size, d: dir.distanceTo(BURST_ORIGIN) }
    })
  }, [count])

  useFrame(() => {
    const m = ref.current
    if (!m) return
    const clock = rt.burstClock
    m.visible = clock > 0.02 && clock < 4.1
    if (!m.visible) return
    const R = rt.story.bubbleR
    const cy = rt.story.bubbleY
    for (let i = 0; i < count; i++) {
      const d = data[i]
      const t = Math.max(0, clock * 1.45 - 0.1 - d.d)
      if (t <= 0) {
        dummy.scale.setScalar(0)
      } else {
        dummy.position.set(
          d.dir.x * R + d.vel.x * t * 0.9,
          cy + d.dir.y * R + d.vel.y * t * 0.9 - 1.4 * t * t,
          d.dir.z * R + d.vel.z * t * 0.9,
        )
        dummy.scale.setScalar(d.size * smooth(Math.min(1, t / 0.15)) * (1 - smooth(Math.min(1, Math.max(0, (t - 1.1) / 1.1)))))
      }
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false} renderOrder={3}>
      <sphereGeometry args={[1, 14, 10]} />
      <meshPhysicalMaterial
        color="#d6e8ff"
        transparent
        opacity={0.5}
        roughness={0}
        metalness={0}
        clearcoat={1}
        ior={1.33}
        envMapIntensity={2.4}
        depthWrite={false}
      />
    </instancedMesh>
  )
}
