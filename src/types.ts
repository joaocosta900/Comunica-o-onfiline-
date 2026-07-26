export type Priority = 'Baixa' | 'Média' | 'Alta';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type Category = 'Trabalho' | 'Estudos' | 'Pessoal' | 'Saúde' | 'Projetos';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  category: Category;
  dueDate?: string;
  subtasks: Subtask[];
  estimatedMinutes?: number;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: Category;
  tags: string[];
  updatedAt: string;
  isPinned?: boolean;
}

export interface Habit {
  id: string;
  name: string;
  category: Category;
  targetPerWeek: number;
  completedDays: string[];
  streak: number;
  color: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedTasks?: string[];
}

export type ThemePreset = 'cyber-cyan' | 'emerald-military' | 'amber-tactical' | 'crimson-alert' | 'neon-purple' | 'clean-light';

export type RadarGridStyle = 'circles' | 'crosshair' | 'hexagon' | 'sector';

export type ViewMode = 'radar' | 'hub' | 'sos' | 'music';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  durationSeconds: number;
  url: string;
  isUploaded?: boolean;
  fileSizeMb?: number;
  addedAt: string;
  platformSource?: 'Android' | 'iPhone' | 'Local' | 'P2P Transfer';
}

export type LayoutMode = 'standard' | 'dual-equal' | 'compact' | 'focus-radar';

export interface StudioSettings {
  theme: ThemePreset;
  accentColor: string;
  bgGlow: boolean;
  glowIntensity: number;
  gridStyle: RadarGridStyle;
  sweepSpeed: number;
  soundEnabled: boolean;
  layoutMode: LayoutMode;
  fontSizeScale: number;
  showDiagnostics: boolean;
  showSidebar: boolean;
  deviceLimit: number;
  radarRangeMeters: number;
  customTitle: string;
}

export interface BTEmulatedDevice {
  id: string;
  name: string;
  rssi: number;
  distance: number;
  angle: number;
  type: 'headset' | 'tag' | 'phone' | 'tv' | 'beacon' | 'unknown';
  active: boolean;
  lastSeen: string;
  isReal?: boolean;
  gattDevice?: any;
  connected?: boolean;
  connecting?: boolean;
  gattServices?: string[];
}

export interface ChatMsg {
  sender: 'Me' | 'Peer' | 'System';
  text: string;
  timestamp?: string;
  file?: {
    name: string;
    url?: string;
    isImage?: boolean;
    isVideo?: boolean;
    isAudio?: boolean;
  };
}

export interface EmergencyContact {
  name: string;
  number: string;
  description?: string;
  active: boolean;
}

export interface PublicAgency {
  label: string;
  number: string;
  desc: string;
}

declare global {
  interface Navigator {
    bluetooth?: any;
  }
}
