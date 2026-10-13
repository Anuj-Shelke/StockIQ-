import { MeshStandardMaterial } from 'three'

/** Polished gold, shared by coins, bars and the rupee. */
export function makeGold(roughness = 0.24) {
  return new MeshStandardMaterial({ color: '#dcb04a', metalness: 1, roughness, envMapIntensity: 1.7 })
}

export const PALETTE = {
  gold: '#e4c366',
  silver: '#c9d3e3',
  blueWhite: '#b9d3ff',
  navy: '#27447a',
  void: '#03060d',
}
