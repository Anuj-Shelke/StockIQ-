import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshReflectorMaterial, RoundedBox } from '@react-three/drei'
import { Group, MathUtils } from 'three'
import { makeGold } from './materials'
import type { Runtime } from './runtime'

const TOP = -1.34

const gold = makeGold(0.22)

function Bar({ position, rotY, rt }: { position: [number, number, number]; rotY: number; rt: Runtime }) {
  const g = useRef<Group>(null)
  const hover = useRef(false)
  useFrame((_, dt) => {
    if (g.current) g.current.scale.setScalar(MathUtils.damp(g.current.scale.x, hover.current ? 1.04 : 1, 8, Math.min(dt, 0.05)))
  })
  const h = rt.mobile
    ? {}
    : {
        onPointerOver: () => (hover.current = true),
        onPointerOut: () => (hover.current = false),
      }
  return (
    <group ref={g} position={position} rotation-y={rotY} {...h}>
      <RoundedBox args={[0.72, 0.17, 0.34]} radius={0.03} smoothness={3} material={gold} />
    </group>
  )
}

/** Black glossy circular stage with a mirror-like top, a silver edge line and a small stack of gold bars. */
export function Platform({ rt, reflections }: { rt: Runtime; reflections: boolean }) {
  return (
    <group>
      <mesh position={[0, TOP - 0.28, 0]}>
        <cylinderGeometry args={[2.5, 2.66, 0.22, 96]} />
        <meshStandardMaterial color="#04060b" metalness={0.9} roughness={0.3} envMapIntensity={1.1} />
      </mesh>
      <mesh position={[0, TOP - 0.09, 0]}>
        <cylinderGeometry args={[2.1, 2.2, 0.18, 96]} />
        <meshStandardMaterial color="#04060b" metalness={0.9} roughness={0.26} envMapIntensity={1.2} />
      </mesh>
      <mesh position={[0, TOP + 0.002, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[2.1, 96]} />
        {reflections ? (
          <MeshReflectorMaterial
            blur={[260, 80]}
            resolution={512}
            mixBlur={1}
            mixStrength={1.1}
            mirror={0.75}
            depthScale={0.6}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#070a12"
            metalness={0.6}
            roughness={0.85}
          />
        ) : (
          <meshStandardMaterial color="#070a12" metalness={0.9} roughness={0.2} envMapIntensity={1.4} />
        )}
      </mesh>
      <mesh position={[0, TOP + 0.004, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[2.1, 0.012, 8, 128]} />
        <meshStandardMaterial color="#d7dfee" metalness={1} roughness={0.15} emissive="#9fb4d8" emissiveIntensity={0.25} />
      </mesh>

      {/* gold bars */}
      <Bar rt={rt} position={[1.15, TOP + 0.085, 0.55]} rotY={0.35} />
      <Bar rt={rt} position={[1.3, TOP + 0.085, 0.05]} rotY={-0.15} />
      <Bar rt={rt} position={[1.2, TOP + 0.255, 0.3]} rotY={0.1} />
      <Bar rt={rt} position={[-1.35, TOP + 0.085, 0.6]} rotY={-0.4} />
    </group>
  )
}
