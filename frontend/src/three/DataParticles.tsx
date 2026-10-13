import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, Color, Float32BufferAttribute, BufferGeometry, Points, PointsMaterial, SRGBColorSpace } from 'three'
import type { Runtime } from './runtime'

function dotTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

/** Sparse drifting dust of silver / gold / blue-white motes. Count is reduced on mobile. */
export function DataParticles({ rt }: { rt: Runtime }) {
  const pts = useRef<Points>(null)
  const count = rt.mobile ? 140 : 420

  const { geometry, material } = useMemo(() => {
    let seed = 99
    const rnd = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const palette = [new Color('#c9d3e3'), new Color('#e4c366'), new Color('#b9d3ff')]
    for (let i = 0; i < count; i++) {
      const r = 0.9 + rnd() * 2.7
      const th = rnd() * Math.PI * 2
      const ph = Math.acos(2 * rnd() - 1)
      pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.8, r * Math.sin(ph) * Math.sin(th)], i * 3)
      const c = palette[Math.floor(rnd() * palette.length)]
      col.set([c.r, c.g, c.b], i * 3)
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(pos, 3))
    geometry.setAttribute('color', new Float32BufferAttribute(col, 3))
    const material = new PointsMaterial({
      size: 0.055,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      map: dotTexture(),
    })
    return { geometry, material }
  }, [count])

  useFrame((_, dt) => {
    const p = pts.current
    if (!p) return
    const a = rt.story.particles
    p.visible = a > 0.001
    material.opacity = a * 0.7
    if (rt.animate) p.rotation.y += Math.min(dt, 0.05) * 0.035
  })

  return <points ref={pts} geometry={geometry} material={material} position={[0, 0.2, 0]} visible={false} />
}
