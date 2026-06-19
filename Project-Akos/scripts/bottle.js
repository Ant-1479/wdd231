// bottle-svg.js — SVG bottle art generation

const PALETTES = {
  Noir: { glow: '#6B4A1E', cap: '#B8922A', body: '#2A1F0F', accent: '#C9A96E' },
  Lumière: { glow: '#4A3B2A', cap: '#D4B896', body: '#3D2E1C', accent: '#E0C9A0' },
  Heritage: { glow: '#3A2C1A', cap: '#A07840', body: '#241A0A', accent: '#B8922A' }
};

export function createBottleSVG(collection, size = 'card') {
  const palette = PALETTES[collection] || PALETTES.Noir;
  const isModal = size === 'modal';
  const w = isModal ? 180 : 120;
  const h = isModal ? 220 : 150;
  const cx = w / 2;

  // Bottle proportions
  const bottleW = w * 0.38;
  const bottleH = h * 0.62;
  const neckW = w * 0.14;
  const neckH = h * 0.12;
  const capH = h * 0.08;
  const bx = cx - bottleW / 2;
  const by = h * 0.28;
  const nx = cx - neckW / 2;
  const ny = by - neckH;
  const capY = ny - capH;

  return `
    <svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" 
         aria-hidden="true" style="width:${isModal ? '160px' : '100px'}; height:${isModal ? '200px' : '130px'}">
      <defs>
        <linearGradient id="bodyGrad-${collection}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${palette.body}" />
          <stop offset="40%" stop-color="${palette.accent}" stop-opacity="0.35" />
          <stop offset="100%" stop-color="${palette.body}" />
        </linearGradient>
        <linearGradient id="capGrad-${collection}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${palette.body}" />
          <stop offset="50%" stop-color="${palette.cap}" />
          <stop offset="100%" stop-color="${palette.body}" />
        </linearGradient>
        <radialGradient id="glowGrad-${collection}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${palette.glow}" stop-opacity="0.4" />
          <stop offset="100%" stop-color="${palette.glow}" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- Ambient glow -->
      <ellipse cx="${cx}" cy="${h * 0.6}" rx="${w * 0.42}" ry="${h * 0.28}"
               fill="url(#glowGrad-${collection})" />

      <!-- Bottle body -->
      <rect x="${bx}" y="${by}" width="${bottleW}" height="${bottleH}" rx="3"
            fill="url(#bodyGrad-${collection})" />

      <!-- Bottle highlight -->
      <rect x="${bx + bottleW * 0.12}" y="${by + 4}" width="${bottleW * 0.12}" 
            height="${bottleH - 8}" rx="2"
            fill="${palette.accent}" opacity="0.18" />

      <!-- Label area -->
      <rect x="${bx + 6}" y="${by + bottleH * 0.22}" width="${bottleW - 12}" height="${bottleH * 0.38}"
            fill="none" stroke="${palette.accent}" stroke-width="0.5" opacity="0.4" />
      <line x1="${bx + bottleW * 0.25}" y1="${by + bottleH * 0.33}" 
            x2="${bx + bottleW * 0.75}" y2="${by + bottleH * 0.33}"
            stroke="${palette.accent}" stroke-width="0.4" opacity="0.5" />
      <line x1="${bx + bottleW * 0.3}" y1="${by + bottleH * 0.43}" 
            x2="${bx + bottleW * 0.7}" y2="${by + bottleH * 0.43}"
            stroke="${palette.accent}" stroke-width="0.3" opacity="0.35" />
      <line x1="${bx + bottleW * 0.3}" y1="${by + bottleH * 0.5}" 
            x2="${bx + bottleW * 0.7}" y2="${by + bottleH * 0.5}"
            stroke="${palette.accent}" stroke-width="0.3" opacity="0.35" />

      <!-- Neck -->
      <rect x="${nx}" y="${ny}" width="${neckW}" height="${neckH}" rx="1"
            fill="url(#bodyGrad-${collection})" />

      <!-- Cap -->
      <rect x="${nx - (isModal ? 5 : 3)}" y="${capY}" 
            width="${neckW + (isModal ? 10 : 6)}" height="${capH}" rx="1"
            fill="url(#capGrad-${collection})" />

      <!-- Cap top detail -->
      <rect x="${cx - (isModal ? 5 : 3)}" y="${capY - (isModal ? 6 : 4)}" 
            width="${isModal ? 10 : 6}" height="${isModal ? 6 : 4}" rx="1"
            fill="${palette.cap}" opacity="0.8" />

      <!-- Bottom shadow -->
      <ellipse cx="${cx}" cy="${by + bottleH - 1}" rx="${bottleW * 0.5}" ry="3"
               fill="#000" opacity="0.3" />
    </svg>
  `;
}