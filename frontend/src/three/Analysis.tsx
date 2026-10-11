import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute, Group, InstancedMesh, Object3D, Vector3 } from 'three'
import { applyFade, collectFadeables, type Fadeable } from './fade'
import { PALETTE } from './materials'
import type { Runtime } from './runtime'
import { lerp, smooth } from './story'

const WEIGHTS = [0.38, 0.27, 0.2, 0.15]
const COLORS = [PALETTE.gold, PALETTE.silver, PALETTE.blueWhite, PALETTE.navy]
const NODES: [number, number, number][] = [
  [-1.7, 0.1, 0.2], [-1.1, 1.2, -0.4], [-0.5, 0.4, 0.6], [0.2, 1.4, -0.2], [0.8, 0.5, 0.4],
  [1.5, 1.2, 0.1], [1.9, 0.2, -0.5], [-0.2, -0.4, -0.3], [0.9, -0.3, 0.7], [-1.5, -0.3, 0.5],
]

/**
 * Stage 4: portfolio allocation ring, a risk gauge, a small network of connected data nodes and two glass panes.
 * Purely illustrative geometry; fades/scales in with `analysis`. Panes and ring shift slightly with the pointer.
 */
export function Analysis({ rt }: { rt: Runtime }) {
  const group = useRef<Group>(null)
  const donut = useRef<Group>(null)
  const needle = useRef<Group>(null)
  const glassA = useRef<Group>(null)
  const glassB = useRef<Group>(null)
  const nodes = useRef<InstancedMesh>(null)
  const fades = useRef<Fadeable[]>([])
  const dummy = useMemo(() => new Object3D(), [])

  const segments = useMemo(() => {
    let a = 0
    return WEIGHTS.map((w) => {
      const start = a + 0.03
      const len = w * Math.PI * 2 - 0.06
      a += w * Math.PI * 2
      return { start, len }
    })
  }, [])

  const links = useMemo(() => {
    const g = new BufferGeometry()
    const v: number[] = []
    for (let i = 0; i < NODES.length; i++)
      for (let j = i + 1; j < NODES.length; j++) {
        if (new Vector3(...NODES[i]).distanceTo(new Vector3(...NODES[j])) < 1.55) v.push(...NODES[i], ...NODES[j])
      }
    g.setAttribute('position', new Float32BufferAttribute(v, 3))
    return g
  }, [])

  useEffect(() => {
    if (group.current) fades.current = collectFadeables(group.current)
  }, [])

  useFrame(() => {
    const g = group.current
    if (!g) return
    const a = rt.story.analysis
    g.visible = a > 0.001
    if (!g.visible) return
    applyFade(fades.current, a)
    g.scale.setScalar(lerp(0.85, 1, a))
    const t = rt.animate ? rt.time : 0
    if (donut.current) donut.current.rotation.z = t * 0.12
    if (needle.current) needle.current.rotation.z = Math.PI * (0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 0.5))) // swings; illustrative only
    if (glassA.current) glassA.current.position.x = -2.35 + rt.pointer.x * 0.25
    if (glassB.current) glassB.current.position.x = 2.4 + rt.pointer.x * 0.35
    const im = nodes.current
    if (im) {
      for (let i = 0; i < NODES.length; i++) {
        dummy.position.set(...NODES[i])
        dummy.scale.setScalar(1 + 0.25 * Math.sin(t * 1.4 + i) * smooth(a))
        dummy.updateMatrix()
        im.setMatrixAt(i, dummy.matrix)
      }
      im.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group ref={group} visible={false} position={[0, 0.1, -0.2]}>
      {/* portfolio allocation ring */}
      <group position={[2.2, 1.0, -0.5]} rotation={[-0.45, -0.35, 0]} scale={0.95}>
        <group ref={donut}>
          {segments.map((s, i) => (
            <mesh key={i}>
              <ringGeometry args={[0.62, 0.92, 64, 1, s.start, s.len]} />
              <meshPhysicalMaterial color={COLORS[i]} transparent opacity={0.85} metalness={0.6} roughness={0.25} side={2} />
            </mesh>
          ))}
        </group>
      </group>

      {/* risk gauge */}
      <group position={[-2.25, 1.0, -0.3]} rotation={[0, 0.3, 0]}>
        <mesh>
          <ringGeometry args={[0.55, 0.63, 64, 1, 0, Math.PI]} />
          <meshBasicMaterial color={PALETTE.blueWhite} transparent opacity={0.3} side={2} />
        </mesh>
        <mesh>
          <ringGeometry args={[0.55, 0.63, 32, 1, 0, Math.PI * 0.55]} />
          <meshBasicMaterial color={PALETTE.gold} transparent opacity={0.9} side={2} />
        </mesh>
        <group ref={needle}>
          <mesh position={[0.28, 0, 0]}>
            <boxGeometry args={[0.56, 0.014, 0.014]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
          </mesh>
        </group>
        <mesh>
          <sphereGeometry args={[0.035, 12, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={1} />
        </mesh>
      </group>

      {/* connected data */}
      <lineSegments geometry={links}>
        <lineBasicMaterial color={PALETTE.blueWhite} transparent opacity={0.3} />
      </lineSegments>
      <instancedMesh ref={nodes} args={[undefined, undefined, NODES.length]} frustumCulled={false}>
        <sphereGeometry args={[0.05, 14, 10]} />
        <meshBasicMaterial color={PALETTE.gold} transparent opacity={1} toneMapped={false} />
      </instancedMesh>

      {/* analytical glass panes */}
      <group ref={glassA} position={[-2.35, 0.2, -0.7]} rotation-y={0.35}>
        <mesh>
          <planeGeometry args={[1.5, 1.0]} />
          <meshPhysicalMaterial color="#9fc0ff" transparent opacity={0.07} roughness={0.1} clearcoat={1} side={2} depthWrite={false} />
        </mesh>
      </group>
      <group ref={glassB} position={[2.4, -0.2, -0.8]} rotation-y={-0.4}>
        <mesh>
          <planeGeometry args={[1.3, 1.2]} />
          <meshPhysicalMaterial color="#9fc0ff" transparent opacity={0.07} roughness={0.1} clearcoat={1} side={2} depthWrite={false} />
        </mesh>
      </group>
    </group>
  )
}
