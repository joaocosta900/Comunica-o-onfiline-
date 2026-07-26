import { ThemePreset, StudioSettings } from '../types';

export const THEMES: Record<ThemePreset, {
  name: string;
  primary: string; // hex
  primaryRgb: string;
  secondary: string;
  bg: string;
  panelBg: string;
  headerBg: string;
  border: string;
  text: string;
  mutedText: string;
}> = {
  'cyber-cyan': {
    name: 'Cyber Cyan (Default)',
    primary: '#2DE1E6',
    primaryRgb: '45, 225, 230',
    secondary: '#5EA1FF',
    bg: '#0B0D14',
    panelBg: '#12141F',
    headerBg: '#171A26',
    border: '#232838',
    text: '#E6E9F2',
    mutedText: '#7C8798',
  },
  'emerald-military': {
    name: 'Militar Esmeralda',
    primary: '#10B981',
    primaryRgb: '16, 185, 129',
    secondary: '#059669',
    bg: '#06130E',
    panelBg: '#0A1C15',
    headerBg: '#0F291E',
    border: '#1A382B',
    text: '#ECFDF5',
    mutedText: '#6EE7B7',
  },
  'amber-tactical': {
    name: 'Tático Âmbar',
    primary: '#F59E0B',
    primaryRgb: '245, 158, 11',
    secondary: '#D97706',
    bg: '#140D05',
    panelBg: '#1C1309',
    headerBg: '#261B0D',
    border: '#3B2914',
    text: '#FEF3C7',
    mutedText: '#FCD34D',
  },
  'crimson-alert': {
    name: 'Crimson Alerta',
    primary: '#EF4444',
    primaryRgb: '239, 68, 68',
    secondary: '#F87171',
    bg: '#140808',
    panelBg: '#1F0C0C',
    headerBg: '#2B1212',
    border: '#3B1A1A',
    text: '#FEE2E2',
    mutedText: '#FCA5A5',
  },
  'neon-purple': {
    name: 'Neon Cyberpunk',
    primary: '#A855F7',
    primaryRgb: '168, 85, 247',
    secondary: '#EC4899',
    bg: '#0F0916',
    panelBg: '#170E24',
    headerBg: '#211333',
    border: '#311C4D',
    text: '#F3E8FF',
    mutedText: '#C084FC',
  },
  'clean-light': {
    name: 'Tático Claro (High Contrast)',
    primary: '#0284C7',
    primaryRgb: '2, 132, 199',
    secondary: '#2563EB',
    bg: '#F8FAFC',
    panelBg: '#FFFFFF',
    headerBg: '#F1F5F9',
    border: '#E2E8F0',
    text: '#0F172A',
    mutedText: '#64748B',
  },
};

export const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  theme: 'cyber-cyan',
  accentColor: '#2DE1E6',
  bgGlow: true,
  glowIntensity: 60,
  gridStyle: 'circles',
  sweepSpeed: 5,
  soundEnabled: true,
  layoutMode: 'standard',
  fontSizeScale: 1.0,
  showDiagnostics: true,
  showSidebar: true,
  deviceLimit: 0,
  radarRangeMeters: 100,
  customTitle: 'BLE.RADAR // MVP-OES',
};
