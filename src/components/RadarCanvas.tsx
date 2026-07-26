import React, { useRef, useEffect, useState } from 'react';
import { StudioSettings, BTEmulatedDevice } from '../types';
import { THEMES } from '../utils/theme';
import { playRadarPing } from '../utils/soundEffects';
import { ZoomIn, ZoomOut, RotateCw, Radio, Shield, Signal, Volume2, Bluetooth, Link2, Unlink, Loader2, Sparkles, Trash2, Filter } from 'lucide-react';

interface RadarCanvasProps {
  settings: StudioSettings;
  devices: BTEmulatedDevice[];
  onSelectDevice: (device: BTEmulatedDevice) => void;
  selectedDevice: BTEmulatedDevice | null;
  onScanRealBle?: () => void;
  onClearSimulated?: () => void;
  onConnectGatt?: (device: BTEmulatedDevice) => void;
  onDisconnectGatt?: (device: BTEmulatedDevice) => void;
}

export const RadarCanvas: React.FC<RadarCanvasProps> = ({
  settings,
  devices,
  onSelectDevice,
  selectedDevice,
  onScanRealBle,
  onClearSimulated,
  onConnectGatt,
  onDisconnectGatt,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sweepAngleRef = useRef<number>(0);
  const lastPingTimeRef = useRef<number>(0);

  const [zoom, setZoom] = useState<number>(1);
  const [rotationOffset, setRotationOffset] = useState<number>(0);
  const [activeBlip, setActiveBlip] = useState<BTEmulatedDevice | null>(null);

  const theme = THEMES[settings.theme];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.parentElement?.clientWidth || 600;
    let height = canvas.height = canvas.parentElement?.clientHeight || 500;

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.max(10, (Math.min(width, height) / 2 - 30) * Math.max(0.1, zoom));

      // Draw Grid / Background Elements according to settings.gridStyle
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((rotationOffset * Math.PI) / 180);

      // Radial rings
      const ringCount = 4;
      ctx.strokeStyle = theme.primary;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.25;

      for (let i = 1; i <= ringCount; i++) {
        const r = Math.max(1, (maxRadius / ringCount) * i);
        
        if (settings.gridStyle === 'hexagon') {
          // Draw Hexagon ring
          ctx.beginPath();
          for (let h = 0; h < 6; h++) {
            const hAngle = (h * Math.PI) / 3;
            const hx = r * Math.cos(hAngle);
            const hy = r * Math.sin(hAngle);
            if (h === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.stroke();
        } else if (settings.gridStyle === 'sector') {
          // Arc sector (120 deg)
          ctx.beginPath();
          ctx.arc(0, 0, r, -Math.PI / 3, Math.PI / 3);
          ctx.stroke();
        } else {
          // Standard Circles or Crosshair
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Distance Labels
        ctx.fillStyle = theme.text;
        ctx.font = '9px monospace';
        ctx.globalAlpha = 0.5;
        const distLabel = `${Math.round((settings.radarRangeMeters / ringCount) * i)}m`;
        ctx.fillText(distLabel, 5, -r + 12);
      }

      // Crosshairs & Angle Markers
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.moveTo(-maxRadius, 0);
      ctx.lineTo(maxRadius, 0);
      ctx.moveTo(0, -maxRadius);
      ctx.lineTo(0, maxRadius);
      ctx.stroke();

      if (settings.gridStyle === 'crosshairs') {
        // Additional diagonal lines (45 deg)
        ctx.beginPath();
        ctx.moveTo(-maxRadius * 0.707, -maxRadius * 0.707);
        ctx.lineTo(maxRadius * 0.707, maxRadius * 0.707);
        ctx.moveTo(-maxRadius * 0.707, maxRadius * 0.707);
        ctx.lineTo(maxRadius * 0.707, -maxRadius * 0.707);
        ctx.stroke();
      }

      // Update Sweep Line Angle
      const speedFactor = (settings.sweepSpeed * 0.015);
      sweepAngleRef.current = (sweepAngleRef.current + speedFactor) % (Math.PI * 2);
      const currentSweepAngle = sweepAngleRef.current;

      // Draw Rotating Sweep Gradient Cone
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, maxRadius, currentSweepAngle - 0.5, currentSweepAngle);
      ctx.closePath();

      const sweepGradient = ctx.createConicGradient?.(currentSweepAngle, 0, 0) || null;
      if (sweepGradient) {
        sweepGradient.addColorStop(0, `${theme.primary}80`);
        sweepGradient.addColorStop(0.15, `${theme.primary}20`);
        sweepGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = sweepGradient;
      } else {
        ctx.fillStyle = `${theme.primary}30`;
      }
      ctx.fill();

      // Sweep Beam Line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(maxRadius * Math.cos(currentSweepAngle), maxRadius * Math.sin(currentSweepAngle));
      ctx.strokeStyle = theme.primary;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.9;
      ctx.stroke();
      ctx.restore();

      // Render Devices as Radar Blips
      devices.forEach((device) => {
        // Convert distance & angle to X, Y
        const normalizedDist = Math.min(device.distance / settings.radarRangeMeters, 1.0);
        const r = normalizedDist * maxRadius;
        const radAngle = (device.angle * Math.PI) / 180;

        const blipX = r * Math.cos(radAngle);
        const blipY = r * Math.sin(radAngle);

        // Check if sweep line passes over this device angle to trigger ping audio
        const angleDiff = Math.abs(currentSweepAngle - (radAngle < 0 ? radAngle + Math.PI * 2 : radAngle));
        const isSwept = angleDiff < 0.15;

        if (isSwept && Date.now() - lastPingTimeRef.current > 600) {
          lastPingTimeRef.current = Date.now();
          if (settings.soundEnabled) {
            playRadarPing(true);
          }
        }

        // Blip Outer Glow
        const isSelected = selectedDevice?.id === device.id;
        ctx.save();
        ctx.beginPath();
        ctx.arc(blipX, blipY, isSelected ? 12 : 8, 0, Math.PI * 2);
        ctx.fillStyle = device.isReal ? '#10B981' : (isSelected ? '#EF4444' : isSwept ? theme.primary : '#3B82F6');
        ctx.globalAlpha = isSwept || isSelected || device.isReal ? 0.85 : 0.4;
        ctx.fill();

        // Core Dot
        ctx.beginPath();
        ctx.arc(blipX, blipY, isSelected ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 1.0;
        ctx.fill();

        // Blip Tag Label
        ctx.fillStyle = device.isReal ? '#34D399' : theme.text;
        ctx.font = device.isReal ? 'bold 10px monospace' : '10px monospace';
        ctx.globalAlpha = 0.9;
        ctx.fillText(`${device.name}${device.isReal ? ' [REAL]' : ''} (${device.rssi}dBm)`, blipX + 10, blipY + 4);
        ctx.restore();
      });

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [settings, devices, zoom, rotationOffset, selectedDevice, theme]);

  // Handle canvas clicks to inspect device blip
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left - canvas.width / 2;
    const clickY = e.clientY - rect.top - canvas.height / 2;

    const maxRadius = (Math.min(canvas.width, canvas.height) / 2 - 30) * zoom;

    let closest: BTEmulatedDevice | null = null;
    let minDiff = 30; // pixel tolerance

    devices.forEach((device) => {
      const normalizedDist = Math.min(device.distance / settings.radarRangeMeters, 1.0);
      const r = normalizedDist * maxRadius;
      const radAngle = (device.angle * Math.PI) / 180;

      const bx = r * Math.cos(radAngle);
      const by = r * Math.sin(radAngle);

      const distToClick = Math.hypot(clickX - bx, clickY - by);
      if (distToClick < minDiff) {
        minDiff = distToClick;
        closest = device;
      }
    });

    if (closest) {
      onSelectDevice(closest);
      setActiveBlip(closest);
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col justify-between">
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at center, ${theme.primary} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Real-time HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-crosshair relative z-10"
      />

      {/* Top Left Telemetry Overlay */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 text-[10px] font-mono p-2.5 rounded-lg border bg-black/80 backdrop-blur-md text-white border-white/10 shadow-lg">
        <div className="flex items-center gap-1.5 font-bold" style={{ color: theme.primary }}>
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>VARREDURA EM TEMPO REAL</span>
        </div>
        <div className="opacity-70">Alcance: {settings.radarRangeMeters}m | Velocidade: {settings.sweepSpeed}x</div>
        <div className="opacity-70">
          Total: {devices.length} ({devices.filter(d => d.isReal).length} Real / {devices.filter(d => !d.isReal).length} Demo)
        </div>
        
        <div className="flex flex-col gap-1.5 mt-1">
          <button
            type="button"
            onClick={onScanRealBle}
            className="w-full py-1.5 px-2.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
            title="Buscar dispositivos Bluetooth reais usando a Web Bluetooth API do celular/PC"
          >
            <Bluetooth className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Escanear BLE Real</span>
          </button>

          {devices.some(d => !d.isReal) && (
            <button
              type="button"
              onClick={onClearSimulated}
              className="w-full py-1 px-2 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 text-[9px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
              title="Remover alvos demonstrativos/fakes para ver apenas Bluetooth real"
            >
              <Trash2 className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Limpar Dispositivos Simulados</span>
            </button>
          )}
        </div>
      </div>

      {/* Selected Target HUD Box */}
      {selectedDevice && (
        <div className="absolute top-4 right-4 z-20 p-3 rounded-lg border bg-black/85 backdrop-blur-md font-mono text-xs text-white space-y-2 border-cyan-500/60 shadow-xl min-w-[240px] max-w-[290px]">
          <div className="flex items-center justify-between border-b pb-1.5 border-white/20">
            <div className="flex items-center gap-1.5 font-bold text-cyan-400">
              <Signal className="w-3.5 h-3.5" />
              <span>ALVO SELECIONADO</span>
            </div>
            <button onClick={() => onSelectDevice(null as any)} className="text-[11px] opacity-60 hover:opacity-100 p-0.5 cursor-pointer">✕</button>
          </div>

          <div className="flex justify-between items-start gap-1">
            <div className="font-bold text-sm text-white break-words">{selectedDevice.name}</div>
            {selectedDevice.isReal ? (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-bold text-[9px] shrink-0">REAL</span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300 font-bold text-[9px] shrink-0">DEMO</span>
            )}
          </div>

          <div className="text-[10px] opacity-75 font-mono truncate">ID: {selectedDevice.id}</div>

          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] bg-white/5 p-2 rounded border border-white/10">
            <div>Sinal RSSI: <span className="font-bold text-emerald-400">{selectedDevice.rssi} dBm</span></div>
            <div>Distância: <span className="font-bold text-amber-400">~{selectedDevice.distance}m</span></div>
            <div>Ângulo: <span className="font-bold text-blue-400">{selectedDevice.angle}°</span></div>
            <div>Tipo: <span className="font-bold uppercase text-purple-400">{selectedDevice.type}</span></div>
          </div>

          {/* Connection status & GATT button */}
          <div className="pt-1 space-y-1.5 border-t border-white/10">
            <div className="flex justify-between items-center text-[10px]">
              <span className="opacity-70">Status Conexão:</span>
              <span className={`font-bold ${
                selectedDevice.connected ? 'text-emerald-400' : selectedDevice.connecting ? 'text-amber-400 animate-pulse' : 'text-red-400'
              }`}>
                {selectedDevice.connected ? '🟢 CONECTADO (GATT)' : selectedDevice.connecting ? '🟡 CONECTANDO...' : '🔴 DESCONECTADO'}
              </span>
            </div>

            {selectedDevice.connected ? (
              <button
                type="button"
                onClick={() => onDisconnectGatt?.(selectedDevice)}
                className="w-full py-1.5 px-2 rounded bg-red-600/80 hover:bg-red-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>DESCONECTAR GATT</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onConnectGatt?.(selectedDevice)}
                disabled={selectedDevice.connecting}
                className="w-full py-1.5 px-2 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                {selectedDevice.connecting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>CONECTANDO...</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-3.5 h-3.5" />
                    <span>CONECTAR DISPOSITIVO VIA GATT</span>
                  </>
                )}
              </button>
            )}

            {selectedDevice.gattServices && selectedDevice.gattServices.length > 0 && (
              <div className="text-[9px] text-cyan-300/90 font-mono bg-cyan-950/40 p-1.5 rounded border border-cyan-500/30">
                Serviços GATT: {selectedDevice.gattServices.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Controls Overlay */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
        <button 
          onClick={() => setZoom(z => Math.min(z + 0.2, 2.5))}
          className="p-2 rounded bg-black/70 hover:bg-black border border-white/20 text-white cursor-pointer transition-all"
          title="Zoom In (Z+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}
          className="p-2 rounded bg-black/70 hover:bg-black border border-white/20 text-white cursor-pointer transition-all"
          title="Zoom Out (Z-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setRotationOffset(r => (r + 45) % 360)}
          className="p-2 rounded bg-black/70 hover:bg-black border border-white/20 text-white cursor-pointer transition-all"
          title="Girar Orientação (ROT)"
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <span className="text-[10px] font-mono px-2 py-1 bg-black/70 border border-white/20 text-white rounded">
          ZOOM: {zoom.toFixed(1)}x | ROT: {rotationOffset}°
        </span>
      </div>
    </div>
  );
};
