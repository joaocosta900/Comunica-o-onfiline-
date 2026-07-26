import React, { useState } from 'react';
import { StudioSettings } from '../types';
import { THEMES } from '../utils/theme';
import { Terminal, ChevronUp, ChevronDown, Cpu, HardDrive, Battery, Shield, Trash2 } from 'lucide-react';

interface LogcatFooterProps {
  settings: StudioSettings;
  logs: string[];
  onClearLogs: () => void;
}

export const LogcatFooter: React.FC<LogcatFooterProps> = ({
  settings,
  logs,
  onClearLogs,
}) => {
  const [expanded, setExpanded] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [filterTag, setFilterTag] = useState<string>('ALL');

  if (!settings.showDiagnostics) return null;

  const theme = THEMES[settings.theme];

  const filteredLogs = logs.filter((log) => {
    if (filterTag === 'ALL') return true;
    return log.includes(`[${filterTag}]`);
  });

  return (
    <footer 
      className={`border-t flex flex-col font-mono text-[10px] shrink-0 transition-all duration-200 ${
        expanded ? 'h-28 md:h-32' : 'h-8'
      }`}
      style={{ backgroundColor: '#000000', borderColor: theme.border }}
    >
      {/* Logcat Top Bar */}
      <div 
        className="px-3 py-1 border-b flex items-center justify-between text-white/80 shrink-0"
        style={{ borderColor: theme.border, backgroundColor: theme.headerBg }}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold uppercase tracking-wider text-[10px]">
            Logcat Telemetria & Diagnóstico
          </span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {filteredLogs.length} Eventos
          </span>
        </div>

        {/* Filters */}
        {expanded && (
          <div className="hidden sm:flex items-center gap-1.5 text-[9px]">
            {['ALL', 'SCANNER', 'BLE', 'SOS', 'HUB', 'AUDIO'].map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  filterTag === tag ? 'bg-emerald-500 text-black font-bold' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {tag}
              </button>
            ))}
            <button 
              onClick={onClearLogs} 
              className="text-red-400 hover:underline flex items-center gap-1 ml-2"
              title="Limpar logs"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}

        <button 
          onClick={() => setExpanded(!expanded)}
          className="p-0.5 hover:bg-white/10 rounded cursor-pointer"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Logcat Content & System Stats */}
      {expanded && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-2 gap-2">
          {/* Live Scroll Log Stream */}
          <div className="flex-1 overflow-y-auto font-mono text-[10px] text-emerald-400/90 leading-relaxed pr-2 space-y-0.5 hide-scrollbar">
            {filteredLogs.length === 0 && (
              <div className="opacity-40 italic">Aguardando novos eventos de telemetria...</div>
            )}
            {filteredLogs.map((log, idx) => (
              <div key={idx} className="hover:bg-white/5 px-1 rounded truncate">
                {log}
              </div>
            ))}
          </div>

          {/* System Hardware Stats */}
          <div className="w-full md:w-52 border-t md:border-t-0 md:border-l pl-2 flex md:flex-col justify-between md:justify-start gap-2 text-[10px] opacity-80 shrink-0" style={{ borderColor: theme.border }}>
            <div className="font-bold text-white uppercase text-[9px] hidden md:block">Métricas Termux/GLES</div>
            <div className="flex items-center gap-1.5"><Cpu className="w-3 h-3 text-cyan-400" /> CPU: <span className="font-bold text-white">12%</span></div>
            <div className="flex items-center gap-1.5"><HardDrive className="w-3 h-3 text-purple-400" /> RAM: <span className="font-bold text-white">128MB</span></div>
            <div className="flex items-center gap-1.5"><Battery className="w-3 h-3 text-emerald-400" /> BATERIA: <span className="font-bold text-emerald-400">92%</span></div>
            <div className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-amber-400" /> TEMP: <span className="font-bold text-white">36°C</span></div>
          </div>
        </div>
      )}
    </footer>
  );
};
