import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  MathUtils,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Object3D,
  Sphere,
  TubeGeometry,
  Vector3,
} from 'three'
import type { Runtime } from './runtime'
import { clamp01, smooth } from './story'

const N = 72
const W = 5
const TUBULAR = 240
const RADIAL = 6

/** Deterministic, illustrative price-like series (noisy, with a dip). NOT real or predictive data. */
function makeSeries() {
  let seed = 11
  const rnd = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  let v = 0
  const raw: number[] = []
  for (let i = 0; i < N; i++) {
    v += (rnd() - 0.46) * 0.24 + 0.01 + (i > 30 && i < 38 ? -0.13 : 0)
    raw.push(v)
  }
  const min = Math.min(...raw)
  const max = Math.max(...raw)
  return raw.map((r, i) => new Vector3((i / (N - 1) - 0.5) * W, ((r - min) / (max - min)) * 1.5 - 0.6, 0))
}

/**
 * A line chart that lives inside the 3D world: a thin glowing tube draws itself as `chart` goes 0 -> 1,
 * with data points that react to hover, over a faint glass pane. Deliberately minimal (no axes / tickers).
 */
export function MarketChart({ rt }: { rt: Runtime }) {
  const group = useRef<Group>(null)
  const points = useRef<InstancedMesh>(null)
  const hovered = useRef(-1)
  const lastHover = useRef(-2)
  const scales = useRef<number[]>([])
  const dummy = useMemo(() => new Object3D(), [])
  const base = useMemo(() => new Color('#cfe0ff'), [])
  const hot = useMemo(() => new Color('#f1d98a'), [])

  const pts = useMemo(() => makeSeries(), [])
  const markers = useMemo(() => pts.filter((_, i) => i % 3 === 0), [pts])

  const tube = useMemo(() => new TubeGeometry(new CatmullRomCurve3(pts, false, 'centripetal'), TUBULAR, 0.016, RADIAL, false), [pts])
  const totalSegs = TUBULAR
  const lineMat = useMemo(() => new MeshBasicMaterial({ color: '#dbe8ff', transparent: true, opacity: 0 }), [])
  const glassMat = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: '#8fb4ff',
        transparent: true,
        opacity: 0,
        roughness: 0.1,
        clearcoat: 1,
        depthWrite: false,
      }),
    [],
  )
  const grid = useMemo(() => {
    const g = new BufferGeometry()
    const v: number[] = []
    for (let k = 0; k < 4; k++) {
      const y = -0.75 + k * 0.62
      v.push(-W / 2 - 0.2, y, 0, W / 2 + 0.2, y, 0)
    }
    g.setAttribute('position', new Float32BufferAttribute(v, 3))
    return g
  }, [])

  // See Coins.tsx: give the instanced points a sane bounding sphere so hover raycasts can hit them.
  useEffect(() => {
    if (points.current) points.current.boundingSphere = new Sphere(new Vector3(0, 0.2, 0), 4)
  }, [])

  useFrame((_, dtRaw) => {
    const g = group.current
    const im = points.current
    if (!g || !im) return
    const dt = rt.animate ? Math.min(dtRaw, 0.05) : 1
    const c = rt.story.chart
    g.visible = c > 0.001
    if (!g.visible) return
    g.position.x = -0.1 + rt.pointer.x * 0.18
    g.position.y = 0.3 + rt.pointer.y * 0.06

    lineMat.opacity = clamp01(c * 3) * (1 - rt.story.organize * 0.25)
    glassMat.opacity = 0.07 * clamp01(c * 2)
    const drawn = Math.floor(c * totalSegs) * RADIAL * 6
    tube.setDrawRange(0, drawn)

    if (lastHover.current !== hovered.current) {
      if (!im.instanceColor) im.setColorAt(0, base)
      for (let i = 0; i < markers.length; i++) im.setColorAt(i, i === hovered.current ? hot : base)
      im.instanceColor!.needsUpdate = true
      lastHover.current = hovered.current
    }
    for (let i = 0; i < markers.length; i++) {
      const appear = clamp01((c * 1.08 - i / markers.length) * 7)
      const target = (hovered.current === i ? 2.6 : 1) * smooth(appear)
      scales.current[i] = MathUtils.damp(scales.current[i] ?? 0, target, 10, dt)
      dummy.position.copy(markers[i])
      dummy.scale.setScalar(scales.current[i])
      dummy.updateMatrix()
      im.setMatrixAt(i, dummy.matrix)
    }
    im.instanceMatrix.needsUpdate = true
  })

  const over = (e: ThreeEvent<PointerEvent>) => {
    if (rt.mobile) return
    e.stopPropagation()
    hovered.current = e.instanceId ?? -1
  }

  return (
    <group ref={group} position={[-0.1, 0.3, -1.25]} rotation-y={-0.2} visible={false}>
      <mesh position={[0, 0.2, -0.08]} material={glassMat}>
        <planeGeometry args={[W + 0.7, 2.7]} />
      </mesh>
      <lineSegments geometry={grid}>
        <lineBasicMaterial color="#9fb4d8" transparent opacity={0.12} />
      </lineSegments>
      <mesh geometry={tube} material={lineMat} />
      <instancedMesh
        ref={points}
        args={[undefined, undefined, markers.length]}
        frustumCulled={false}
        onPointerMove={over}
        onPointerOut={() => (hovered.current = -1)}
      >
        <sphereGeometry args={[0.05, 16, 12]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>
    </group>
  )
}
