import React from 'react';
import { StudioSettings, ViewMode } from '../types';
import { THEMES } from '../utils/theme';
import { playButtonClick } from '../utils/soundEffects';
import { 
  Radio, 
  WifiOff, 
  ShieldAlert, 
  Sliders, 
  Plus, 
  Volume2, 
  Tv,
  Music
} from 'lucide-react';

interface HeaderProps {
  settings: StudioSettings;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onOpenStudio: () => void;
  onScanDevices: () => void;
  onInterceptAudio: () => void;
  onTransmitTvSignal: () => void;
  deviceCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  view,
  onViewChange,
  onOpenStudio,
  onScanDevices,
  onInterceptAudio,
  onTransmitTvSignal,
  deviceCount,
}) => {
  const theme = THEMES[settings.theme];

  const handleNavClick = (v: ViewMode) => {
    playButtonClick(settings.soundEnabled);
    onViewChange(v);
  };

  return (
    <header 
      className="py-2 px-3 sm:px-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 z-30 transition-colors duration-200"
      style={{ backgroundColor: theme.headerBg, borderColor: theme.border, color: theme.text }}
    >
      {/* App Branding Line */}
      <div className="flex items-center justify-between sm:justify-start gap-2">
        <div className="flex items-center gap-2 truncate">
          <div className="relative w-3.5 h-3.5 flex items-center justify-center shrink-0">
            <span 
              className="radar-sweep absolute w-6 h-6 rounded-full opacity-60"
              style={{ backgroundColor: `${settings.accentColor}20` }}
            />
            <span 
              className="relative z-10 w-2.5 h-2.5 rounded-full shadow-md animate-pulse"
              style={{ backgroundColor: settings.accentColor, boxShadow: `0 0 10px ${settings.accentColor}` }}
            />
          </div>

          <h1 className="font-bold text-xs sm:text-sm tracking-wider uppercase truncate">
            {settings.customTitle || 'BLE.RADAR // MVP-OES'}
          </h1>
          <span className="text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-white/10 opacity-70 hidden xs:inline-block">
            MOTO_G54 // AO VIVO
          </span>
        </div>

        {/* Mobile Studio Customizer Trigger */}
        <button
          onClick={() => { playButtonClick(settings.soundEnabled); onOpenStudio(); }}
          className="sm:hidden px-2 py-1 rounded font-bold text-black text-[10px] flex items-center gap-1 shrink-0 shadow-sm"
          style={{ backgroundColor: settings.accentColor }}
          title="Abrir Estúdio ao Vivo"
        >
          <Sliders className="w-3 h-3" />
          <span>ESTÚDIO</span>
        </button>
      </div>

      {/* Main Navigation Tabs & Controls */}
      <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar text-xs">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-0.5 rounded border bg-black/40 w-full sm:w-auto justify-between sm:justify-start" style={{ borderColor: theme.border }}>
          <button 
            onClick={() => handleNavClick('radar')}
            className={`flex-1 sm:flex-initial px-2.5 py-1 rounded font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              view === 'radar' 
                ? 'bg-white/15 text-white shadow-xs' 
                : 'opacity-65 hover:opacity-100'
            }`}
            style={{ color: view === 'radar' ? settings.accentColor : theme.text }}
          >
            <Radio className="w-3.5 h-3.5 shrink-0" />
            <span>RADAR</span>
          </button>

          <button 
            onClick={() => handleNavClick('hub')}
            className={`flex-1 sm:flex-initial px-2.5 py-1 rounded font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              view === 'hub' 
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs' 
                : 'opacity-65 hover:opacity-100'
            }`}
          >
            <WifiOff className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>HUB OFFLINE</span>
          </button>

          <button 
            onClick={() => handleNavClick('sos')}
            className={`flex-1 sm:flex-initial px-2.5 py-1 rounded font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              view === 'sos' 
                ? 'bg-red-500/25 text-red-300 border border-red-500/60 shadow-xs' 
                : 'opacity-65 hover:opacity-100 text-red-400'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse shrink-0" />
            <span>EMERGÊNCIA</span>
          </button>

          <button 
            onClick={() => handleNavClick('music')}
            className={`flex-1 sm:flex-initial px-2.5 py-1 rounded font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              view === 'music' 
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/60 shadow-xs' 
                : 'opacity-65 hover:opacity-100 text-emerald-400'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>🎵 MÚSICA</span>
          </button>
        </div>

        {/* Quick Action Triggers (Desktop / Tablet) */}
        {view === 'radar' && (
          <div className="hidden lg:flex items-center gap-1.5">
            <button 
              onClick={() => { playButtonClick(settings.soundEnabled); onScanDevices(); }}
              className="px-2 py-1 rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>BT</span>
            </button>

            <button 
              onClick={() => { playButtonClick(settings.soundEnabled); onInterceptAudio(); }}
              className="px-2 py-1 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1"
            >
              <Volume2 className="w-3 h-3" />
              <span>Áudio</span>
            </button>

            <button 
              onClick={() => { playButtonClick(settings.soundEnabled); onTransmitTvSignal(); }}
              className="px-2 py-1 rounded border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1"
            >
              <Tv className="w-3 h-3" />
              <span>TV</span>
            </button>
          </div>
        )}

        {/* Desktop Studio Customizer Trigger */}
        <button
          onClick={() => { playButtonClick(settings.soundEnabled); onOpenStudio(); }}
          className="hidden sm:flex px-3 py-1 rounded font-bold text-black text-[11px] items-center gap-1.5 shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95 ml-auto"
          style={{ backgroundColor: settings.accentColor }}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>ESTÚDIO AO VIVO</span>
        </button>
      </div>
    </header>
  );
};

