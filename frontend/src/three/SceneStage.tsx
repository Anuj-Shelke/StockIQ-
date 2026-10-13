import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ACESFilmicToneMapping } from 'three'
import { SceneRoot, type SceneRootProps } from './SceneRoot'

export interface SceneStageProps extends SceneRootProps {
  /** Called once the first frames are drawn and the shaders are compiled. */
  onReady?: () => void
}

/**
 * Waits a few frames (so the environment lighting exists), compiles every material's shader program
 * in parallel, then reports ready. This moves the one-off compile stall out of the user's first scroll.
 */
function ReadyGate({ onReady }: { onReady?: () => void }) {
  const { gl, scene, camera } = useThree()
  const frames = useRef(0)
  const fired = useRef(false)
  useFrame(() => {
    if (fired.current) return
    frames.current += 1
    if (frames.current < 3) return
    fired.current = true
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => onReady?.())
  })
  return null
}

/** The R3F canvas. Default export so it can be code-split with React.lazy (three.js is ~600KB). */
export default function SceneStage({ onReady, ...props }: SceneStageProps) {
  const { mobile, mode } = props
  return (
    <Canvas
      style={{ position: 'absolute', inset: 0 }}
      dpr={mobile ? [1, 1.25] : [1, 1.5]}
      frameloop={mode === 'static' ? 'demand' : 'always'}
      camera={{ fov: 35, position: [0, 0.6, 10.2], near: 0.1, far: 70 }}
      gl={{ antialias: !mobile, powerPreference: 'high-performance', toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
    >
      <SceneRoot {...props} />
      <ReadyGate onReady={onReady} />
    </Canvas>
  )
}