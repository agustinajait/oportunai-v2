export const FONT_OPTIONS = {
  'plus-jakarta': {
    name: 'Plus Jakarta Sans',
    url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
    family: "'Plus Jakarta Sans', system-ui, sans-serif",
  },
  'sora': {
    name: 'Sora',
    url: 'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap',
    family: "'Sora', system-ui, sans-serif",
  },
  'space-grotesk': {
    name: 'Space Grotesk',
    url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap',
    family: "'Space Grotesk', system-ui, sans-serif",
  },
  'dm-sans': {
    name: 'DM Sans',
    url: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap',
    family: "'DM Sans', system-ui, sans-serif",
  },
  'outfit': {
    name: 'Outfit',
    url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap',
    family: "'Outfit', system-ui, sans-serif",
  },
  'montserrat': {
    name: 'Montserrat',
    url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap',
    family: "'Montserrat', system-ui, sans-serif",
  },
  'impact': {
    name: 'Impact',
    url: '',
    family: "Impact, 'Arial Narrow', Arial, sans-serif",
  },
} as const;

export type FontKey = keyof typeof FONT_OPTIONS;

export function resolveFont(fuente: string | null | undefined) {
  const key = (fuente ?? 'plus-jakarta') as FontKey;
  return FONT_OPTIONS[key] ?? FONT_OPTIONS['plus-jakarta'];
}
