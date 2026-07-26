import React from 'react';
import { 
  X, 
  Palette, 
  Gauge, 
  Volume2, 
  VolumeX, 
  LayoutGrid, 
  RotateCcw, 
  Sliders, 
  Eye, 
  Radio, 
  Sparkles,
  Type,
  Maximize2
} from 'lucide-react';
import { StudioSettings, ThemePreset, RadarGridStyle, LayoutMode } from '../types';
import { THEMES } from '../utils/theme';
import { playButtonClick } from '../utils/soundEffects';

interface StudioPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StudioSettings;
  onUpdateSettings: (newSettings: Partial<StudioSettings>) => void;
  onResetSettings: () => void;
}

export const StudioPanel: React.FC<StudioPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings,
}) => {
  if (!isOpen) return null;

  const currentTheme = THEMES[settings.theme];

  const handleThemeSelect = (themeKey: ThemePreset) => {
    playButtonClick(settings.soundEnabled);
    onUpdateSettings({ 
      theme: themeKey,
      accentColor: THEMES[themeKey].primary 
    });
  };

  const applyPreset = (preset: 'night' | 'alert' | 'clean' | 'performance') => {
    playButtonClick(settings.soundEnabled);
    if (preset === 'night') {
      onUpdateSettings({
        theme: 'cyber-cyan',
        glowIntensity: 80,
        gridStyle: 'circles',
        sweepSpeed: 6,
        layoutMode: 'standard',
        showSidebar: true,
        showDiagnostics: true,
      });
    } else if (preset === 'alert') {
      onUpdateSettings({
        theme: 'crimson-alert',
        glowIntensity: 100,
        gridStyle: 'crosshair',
        sweepSpeed: 9,
        layoutMode: 'focus-radar',
        showSidebar: false,
        showDiagnostics: true,
      });
    } else if (preset === 'clean') {
      onUpdateSettings({
        theme: 'clean-light',
        glowIntensity: 20,
        gridStyle: 'sector',
        sweepSpeed: 4,
        layoutMode: 'standard',
        showSidebar: true,
        showDiagnostics: true,
      });
    } else if (preset === 'performance') {
      onUpdateSettings({
        theme: 'emerald-military',
        glowIntensity: 30,
        gridStyle: 'hexagon',
        sweepSpeed: 3,
        layoutMode: 'dual-equal',
        showSidebar: true,
        showDiagnostics: false,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:w-[420px] h-full flex flex-col border-l shadow-2xl overflow-hidden transition-all duration-200"
        style={{
          backgroundColor: currentTheme.panelBg,
          borderColor: currentTheme.border,
          color: currentTheme.text,
        }}
      >
        {/* Header */}
        <div 
          className="p-4 border-b flex items-center justify-between shrink-0"
          style={{ backgroundColor: currentTheme.headerBg, borderColor: currentTheme.border }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="p-1.5 rounded-md text-black font-bold"
              style={{ backgroundColor: settings.accentColor }}
            >
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wider uppercase flex items-center gap-2">
                Estúdio AO VIVO
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                  PREVIEW 100% ATIVO
                </span>
              </h2>
              <p className="text-[11px] opacity-70">
                Ajustes em tempo real sem recarregar a tela
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar font-mono text-xs">
          
          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 opacity-80">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Presets de Design Rápido
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyPreset('night')}
                className="p-2 rounded border text-left hover:opacity-90 transition-all cursor-pointer bg-cyan-950/40 border-cyan-500/40 text-cyan-300"
              >
                <div className="font-bold text-[11px]">Cyber Tático</div>
                <div className="text-[9px] opacity-70">Cyan + Alta taxa</div>
              </button>
              <button
                onClick={() => applyPreset('alert')}
                className="p-2 rounded border text-left hover:opacity-90 transition-all cursor-pointer bg-red-950/40 border-red-500/40 text-red-300"
              >
                <div className="font-bold text-[11px]">Alerta Vermelho</div>
                <div className="text-[9px] opacity-70">Crimson + Foco</div>
              </button>
              <button
                onClick={() => applyPreset('clean')}
                className="p-2 rounded border text-left hover:opacity-90 transition-all cursor-pointer bg-sky-100 dark:bg-sky-900/40 border-sky-400 text-sky-800 dark:text-sky-200"
              >
                <div className="font-bold text-[11px]">Modo Claro</div>
                <div className="text-[9px] opacity-70">Alto contraste</div>
              </button>
              <button
                onClick={() => applyPreset('performance')}
                className="p-2 rounded border text-left hover:opacity-90 transition-all cursor-pointer bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              >
                <div className="font-bold text-[11px]">Militar Hex</div>
                <div className="text-[9px] opacity-70">Verde + Painel duplo</div>
              </button>
            </div>
          </div>

          {/* Theme Palette */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 opacity-80">
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              Tema & Paleta de Cores
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(THEMES) as ThemePreset[]).map((key) => {
                const t = THEMES[key];
                const isSelected = settings.theme === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleThemeSelect(key)}
                    className={`p-2.5 rounded border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected ? 'ring-2 ring-offset-1 ring-offset-black' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: t.panelBg,
                      borderColor: isSelected ? t.primary : t.border,
                      boxShadow: isSelected ? `0 0 10px ${t.primary}40` : 'none'
                    }}
                  >
                    <span 
                      className="w-4 h-4 rounded-full shrink-0 border border-white/20 shadow-xs"
                      style={{ backgroundColor: t.primary }}
                    />
                    <div className="truncate">
                      <div className="font-bold text-[11px]" style={{ color: t.text }}>{t.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Accent Color & Glow */}
          <div className="space-y-3 p-3 rounded border" style={{ borderColor: currentTheme.border, backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px]">Brilho & Neon Glow</span>
              <span className="text-[11px] font-bold" style={{ color: settings.accentColor }}>
                {settings.glowIntensity}%
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={settings.glowIntensity} 
              onChange={(e) => onUpdateSettings({ glowIntensity: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="font-bold text-[11px]">Cor de Destaque Customizada</span>
              <input 
                type="color" 
                value={settings.accentColor} 
                onChange={(e) => onUpdateSettings({ accentColor: e.target.value })}
                className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
              />
            </div>
          </div>

          {/* Radar Customizer */}
          <div className="space-y-3 p-3 rounded border" style={{ borderColor: currentTheme.border, backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 opacity-80">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              Customização do Radar em Tempo Real
            </label>

            {/* Sweep Speed */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span>Velocidade de Varredura (Sweep)</span>
                <span className="font-bold" style={{ color: settings.accentColor }}>{settings.sweepSpeed}x</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={settings.sweepSpeed} 
                onChange={(e) => onUpdateSettings({ sweepSpeed: Number(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Grid Style */}
            <div className="space-y-1 pt-1">
              <label className="text-[11px] opacity-80">Estilo de Grade do Radar</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'circles', label: 'Círculos Táticos' },
                  { id: 'crosshairs', label: 'Mira Cruzada' },
                  { id: 'hexagon', label: 'Malha Hexagonal' },
                  { id: 'sector', label: 'Arco de Setor' },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => onUpdateSettings({ gridStyle: g.id as RadarGridStyle })}
                    className={`py-1.5 px-2 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                      settings.gridStyle === g.id
                        ? 'bg-white/10 border-cyan-400 text-white'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Density */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px]">
                <span>Dispositivos Simulados (0 = Apenas BLE Real)</span>
                <span className="font-bold" style={{ color: settings.accentColor }}>{settings.deviceLimit}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="30" 
                value={settings.deviceLimit} 
                onChange={(e) => onUpdateSettings({ deviceLimit: Number(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Layout & Structure Controls */}
          <div className="space-y-3 p-3 rounded border" style={{ borderColor: currentTheme.border, backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 opacity-80">
              <LayoutGrid className="w-3.5 h-3.5 text-blue-400" />
              Arranjo de Layout & Visualização
            </label>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'standard', label: 'Divisão Padrão' },
                { id: 'dual-equal', label: 'Painéis Iguais' },
                { id: 'compact', label: 'Modo Compacto' },
                { id: 'focus-radar', label: 'Foco no Radar' },
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => onUpdateSettings({ layoutMode: l.id as LayoutMode })}
                  className={`py-1.5 px-2 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                    settings.layoutMode === l.id
                      ? 'bg-white/10 border-blue-400 text-white'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Font Scaling */}
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-[11px]">
                <span className="flex items-center gap-1"><Type className="w-3 h-3" /> Escala do Texto</span>
                <span className="font-bold">{Math.round(settings.fontSizeScale * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0.85" 
                max="1.15" 
                step="0.05"
                value={settings.fontSizeScale} 
                onChange={(e) => onUpdateSettings({ fontSizeScale: Number(e.target.value) })}
                className="w-full accent-blue-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Component Visibility Toggles */}
          <div className="space-y-2 p-3 rounded border" style={{ borderColor: currentTheme.border, backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 opacity-80">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              Alternância de Componentes
            </label>

            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-[11px]">Exibir Barra Lateral de Dispositivos</span>
              <input 
                type="checkbox" 
                checked={settings.showSidebar} 
                onChange={(e) => onUpdateSettings({ showSidebar: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-[11px]">Exibir Console Logcat de Diagnóstico</span>
              <input 
                type="checkbox" 
                checked={settings.showDiagnostics} 
                onChange={(e) => onUpdateSettings({ showDiagnostics: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-[11px] flex items-center gap-1">
                {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-red-400" />}
                Efeitos Sonoros de Telemetria
              </span>
              <input 
                type="checkbox" 
                checked={settings.soundEnabled} 
                onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </label>

            <div className="pt-2">
              <label className="text-[10px] opacity-70 block mb-1">Título Personalizado da Aplicação</label>
              <input 
                type="text" 
                value={settings.customTitle} 
                onChange={(e) => onUpdateSettings({ customTitle: e.target.value })}
                className="w-full bg-black/40 border p-1.5 text-xs rounded text-white focus:outline-none focus:border-cyan-400"
                style={{ borderColor: currentTheme.border }}
              />
            </div>
          </div>

          {/* Reset Action */}
          <div className="pt-2">
            <button
              onClick={onResetSettings}
              className="w-full py-2 px-3 rounded border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Configurações Originais
            </button>
          </div>

        </div>

        {/* Footer */}
        <div 
          className="p-3 border-t text-[10px] text-center opacity-60 shrink-0"
          style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.headerBg }}
        >
          TaskFlow BLE.RADAR // Motor de Estúdio de Design em Tempo Real
        </div>
      </div>
    </div>
  );
};
