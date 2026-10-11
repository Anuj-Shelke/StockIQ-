import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, MeshPhysicalMaterial, Vector3 } from 'three'
import type { Runtime } from './runtime'

/** Point on the unit sphere where the film starts to tear (up-left of camera view). */
export const BURST_ORIGIN = new Vector3(0.35, 0.55, 0.75).normalize()

/**
 * Thin water-film bubble.
 *  - MeshPhysicalMaterial transmission + ior 1.33 + subtle iridescence => refraction & thin-film colour
 *  - vertex shader adds low-frequency wobble and small ripples whose amplitude follows `tension`
 *  - fragment shader tears a noisy hole that spreads from BURST_ORIGIN as `burst` goes 0 -> 1,
 *    with a faint bright rim on the retreating edge. No fire, smoke or particle blast.
 */
export function Bubble({ rt }: { rt: Runtime }) {
  const mesh = useRef<Mesh>(null)

  const { material, uniforms } = useMemo(() => {
    const uniforms = {
      uTime: { value: 0 },
      uWobble: { value: 0.2 },
      uBurst: { value: 0 },
      uOrigin: { value: BURST_ORIGIN.clone() },
    }
    const material = new MeshPhysicalMaterial({
      color: '#ffffff',
      transmission: 1,
      thickness: 0.14,
      ior: 1.33,
      roughness: 0.02,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0,
      iridescence: 0.45,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [120, 380],
      envMapIntensity: 1.5,
      specularIntensity: 1,
    })
    material.customProgramCacheKey = () => 'stockiq-bubble-v1'
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms)
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
           uniform float uTime; uniform float uWobble; uniform vec3 uOrigin;
           varying vec3 vObjPos;`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           vObjPos = position;
           float w = sin(position.x*3.0 + uTime*1.7) * sin(position.y*2.6 - uTime*1.3) * sin(position.z*3.3 + uTime*1.1);
           float rip = sin(length(position - uOrigin)*14.0 - uTime*5.0);
           transformed += normal * uWobble * (0.05*w + 0.011*rip);`,
        )
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
           uniform float uBurst; uniform vec3 uOrigin;
           varying vec3 vObjPos;`,
        )
        .replace(
          '#include <clipping_planes_fragment>',
          `#include <clipping_planes_fragment>
           float bDist = distance(normalize(vObjPos), uOrigin);
           float bNoise = sin(vObjPos.x*17.0+3.0) * sin(vObjPos.y*13.0) * sin(vObjPos.z*19.0) * 0.14;
           float bEdge = uBurst*2.7 - 0.12;
           if (uBurst > 0.0 && bDist + bNoise < bEdge) discard;`,
        )
        .replace(
          '#include <dithering_fragment>',
          `#include <dithering_fragment>
           if (uBurst > 0.0) {
             float rim = 1.0 - smoothstep(0.0, 0.1, (bDist + bNoise) - bEdge);
             gl_FragColor.rgb += rim * vec3(0.55, 0.72, 0.95) * 0.85;
           }`,
        )
    }
    return { material, uniforms }
  }, [])

  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const s = rt.story
    m.visible = rt.burst < 0.995
    if (!m.visible) return
    m.position.set(0, s.bubbleY, 0)
    const breathe = rt.animate ? Math.sin(rt.time * 2.1) * 0.006 * (0.4 + s.tension) : 0
    m.scale.setScalar(s.bubbleR * (1 + breathe + rt.burst * 0.05))
    uniforms.uTime.value = rt.animate ? rt.time : 0
    uniforms.uWobble.value = 0.18 + s.tension * 1.1 + rt.burst * 0.6
    uniforms.uBurst.value = rt.burst
  })

  return (
    <mesh ref={mesh} material={material} renderOrder={2}>
      <sphereGeometry args={[1, rt.mobile ? 48 : 96, rt.mobile ? 32 : 64]} />
    </mesh>
  )
}
