/**
 * SVG Icons designed in Claude's minimalist, clean stroke aesthetic
 */

export const ICONS = {
  // Claude 4-point Sparkle
  sparkle: (size = 16, className = "text-[#d97757]") => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" class="${className}">
      <path d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12z"/>
    </svg>
  `,

  // Earbuds / Headphones (Lane 1)
  earbuds: (size = 24, className = "text-[#d97757]") => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="${className}">
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>
    </svg>
  `,

  // Charger / Plug (Lane 2)
  charger: (size = 24, className = "text-[#8fae8b]") => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="${className}">
      <path d="M12 2v6"/>
      <path d="M9 2v4"/>
      <path d="M15 2v4"/>
      <rect x="6" y="8" width="12" height="7" rx="2"/>
      <path d="M12 15v7"/>
    </svg>
  `,

  // Earphone Pocket / Pouch (Lane 3)
  pocket: (size = 24, className = "text-[#e5a86a]") => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="${className}">
      <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a8 8 0 0 1-16 0V6z"/>
      <path d="M9 10a3 3 0 0 0 6 0"/>
    </svg>
  `,

  // Heart Full
  heartFull: (size = 20, className = "text-[#e05252]") => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" class="${className}">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  `,

  // Heart Empty
  heartEmpty: (size = 20, className = "text-[#4a4742]") => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="${className}">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  `,

  // Volume Sound On
  volumeOn: (size = 14, className = "text-[#ece9df]") => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="${className}">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  `,

  // Volume Sound Off
  volumeOff: (size = 14, className = "text-[#827e75]") => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="${className}">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <line x1="23" y1="9" x2="17" y2="15"/>
      <line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
  `,

  // Trophy / Victory
  trophy: (size = 48, className = "text-[#d97757]") => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="${className}">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34"/>
      <path d="M6 4h12v7a6 6 0 0 1-12 0V4Z"/>
    </svg>
  `,

  // Broken Shield / Game Over
  shieldAlert: (size = 48, className = "text-[#b4b0a5]") => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="${className}">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  `,

  // Helper function to get icon by lane label/index
  getLaneIcon: (index: number, size = 24) => {
    switch (index) {
      case 0:
        return ICONS.earbuds(size);
      case 1:
        return ICONS.charger(size);
      case 2:
        return ICONS.pocket(size);
      default:
        return ICONS.sparkle(size);
    }
  }
};
