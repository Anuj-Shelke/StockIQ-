import type { Material, Mesh, Object3D } from 'three'

export interface Fadeable {
  m: Material
  base: number
}

/** Collects every (transparent) material under `root` with its authored opacity so a whole group can fade in/out. */
export function collectFadeables(root: Object3D): Fadeable[] {
  const seen = new Set<Material>()
  const out: Fadeable[] = []
  root.traverse((o) => {
    const mat = (o as Mesh).material
    if (mat && !Array.isArray(mat) && !seen.has(mat)) {
      seen.add(mat)
      out.push({ m: mat, base: mat.opacity })
    }
  })
  return out
}

export function applyFade(list: Fadeable[], f: number) {
  for (const x of list) x.m.opacity = x.base * f
}
