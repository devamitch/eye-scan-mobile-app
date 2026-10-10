export const Colors = {
  PrimaryBackground: 'rgba(241, 241, 235, 1)',
  SecondaryBackground: 'rgba(255, 255, 255, 1)',
  lightText: 'rgba(146, 162, 156, 1)',
  white: 'rgba(255, 255, 255, 1)',
  PrimaryText: 'rgba(72, 89, 83, 1)',
  SecondaryText: '#94ab96ff',
  logoColor: 'rgba(173, 137, 88, 1)',
  red: '#FF6B6B',
} as const;

export type ColorsType = typeof Colors;
