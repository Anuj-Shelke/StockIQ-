import { CanvasTexture, SRGBColorSpace } from 'three'

/** Draws a ₹ glyph with canvas paths so it never depends on installed fonts. */
function drawRupee(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string) {
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = s * 0.11
  ctx.beginPath()
  ctx.moveTo(cx - 0.34 * s, cy - 0.46 * s)
  ctx.lineTo(cx + 0.36 * s, cy - 0.46 * s)
  ctx.moveTo(cx - 0.34 * s, cy - 0.2 * s)
  ctx.lineTo(cx + 0.36 * s, cy - 0.2 * s)
  ctx.moveTo(cx - 0.24 * s, cy - 0.46 * s)
  ctx.bezierCurveTo(cx + 0.46 * s, cy - 0.46 * s, cx + 0.46 * s, cy + 0.1 * s, cx - 0.24 * s, cy + 0.1 * s)
  ctx.lineTo(cx + 0.3 * s, cy + 0.56 * s)
  ctx.stroke()
}

function makeCanvas(size: number, bump: boolean) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const mid = size / 2
  if (bump) {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, size, size)
  } else {
    const g = ctx.createRadialGradient(mid, mid, size * 0.05, mid, mid, mid)
    g.addColorStop(0, '#e9c25a')
    g.addColorStop(1, '#b98a2c')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  }
  const ink = bump ? '#fff' : '#a9801f'
  ctx.strokeStyle = ink
  ctx.lineWidth = size * 0.035
  ctx.beginPath()
  ctx.arc(mid, mid, mid * 0.84, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = size * 0.012
  ctx.beginPath()
  ctx.arc(mid, mid, mid * 0.74, 0, Math.PI * 2)
  ctx.stroke()
  drawRupee(ctx, mid, mid, size * 0.5, ink)
  return c
}

export function makeCoinTextures() {
  const map = new CanvasTexture(makeCanvas(512, false))
  map.colorSpace = SRGBColorSpace
  map.anisotropy = 4
  const bump = new CanvasTexture(makeCanvas(512, true))
  return { map, bump }
}
