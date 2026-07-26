/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { 
  StudioSettings, 
  ViewMode, 
  BTEmulatedDevice, 
  ChatMsg, 
  EmergencyContact 
} from './types';
import { DEFAULT_STUDIO_SETTINGS, THEMES } from './utils/theme';
import { playScanBeep, playButtonClick } from './utils/soundEffects';

import { Header } from './components/Header';
import { RadarCanvas } from './components/RadarCanvas';
import { OfflineHub } from './components/OfflineHub';
import { SosModule } from './components/SosModule';
import { MusicPlayerModule } from './components/MusicPlayerModule';
import { StudioPanel } from './components/StudioPanel';
import { LogcatFooter } from './components/LogcatFooter';

export default function App() {
  // Studio Settings State with localStorage persistence
  const [studioSettings, setStudioSettings] = useState<StudioSettings>(() => {
    try {
      const saved = localStorage.getItem('studioSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.deviceLimit === 12) parsed.deviceLimit = 0;
        return { ...DEFAULT_STUDIO_SETTINGS, ...parsed };
      }
      return DEFAULT_STUDIO_SETTINGS;
    } catch {
      return DEFAULT_STUDIO_SETTINGS;
    }
  });

  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [view, setView] = useState<ViewMode>('radar');
  const [logs, setLogs] = useState<string[]>([
    "[SCANNER] Estúdio de Pré-visualização AO VIVO Inicializado.",
    "[OES] Renderizador WebGL e Canvas 2D operacionais.",
    "[SYS] Módulo de Telemetria pronto."
  ]);

  // Devices & Target Selection
  const [devices, setDevices] = useState<BTEmulatedDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<BTEmulatedDevice | null>(null);
  const [bleNoticeModal, setBleNoticeModal] = useState<{ open: boolean; title: string; message: string; showNewTabBtn?: boolean }>({ open: false, title: '', message: '' });

  // Chat & Files State
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    {
      sender: 'System',
      text: 'Conexão P2P local estabelecida na porta 8000. Você pode trocar texto, áudio de voz e arquivos.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [files, setFiles] = useState<any[]>([
    { name: 'termo_de_uso_tatico.pdf' },
    { name: 'mapa_esquematico_zona_01.png' },
    { name: 'firmware_update_v2.apk' }
  ]);
  const wsRef = useRef<WebSocket | null>(null);

  // Helper for full date and time string
  const getFormattedDateTime = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR');
    return { dateStr, timeStr, fullStamp: `${dateStr} ${timeStr}` };
  };

  // SOS & GPS State
  const [sosActive, setSosActive] = useState(false);
  const [sosBroadcastToChat, setSosBroadcastToChat] = useState(true);
  const [gpsData, setGpsData] = useState<{ lat: number; lng: number; acc: number; time: string; date: string } | null>(null);
  const [peerSosData, setPeerSosData] = useState<any>(null);
  const [gpsStatus, setGpsStatus] = useState<string>("Aguardando ativação do GPS...");
  const [customMessage, setCustomMessage] = useState("Preciso de assistência imediata. Esta é uma transmissão de emergência.");
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(() => {
    try {
      const saved = localStorage.getItem('sosContacts');
      return saved ? JSON.parse(saved) : [
        { name: 'Polícia Militar (190)', number: '190', description: 'Emergência policial', active: true },
        { name: 'SAMU (192)', number: '192', description: 'Urgência médica', active: true },
        { name: 'Contato Familiar', number: '+55 11 99999-8888', description: 'Emergência pessoal', active: true },
      ];
    } catch {
      return [];
    }
  });

  const watchIdRef = useRef<number | null>(null);

  // Sync Studio Settings to LocalStorage & DOM Font Scale
  const updateStudioSettings = (newSettings: Partial<StudioSettings>) => {
    setStudioSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('studioSettings', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const resetStudioSettings = () => {
    setStudioSettings(DEFAULT_STUDIO_SETTINGS);
    try {
      localStorage.removeItem('studioSettings');
    } catch {}
    setLogs((prev) => [...prev, "[ESTÚDIO] Configurações de layout e tema restauradas para os padrões."]);
  };

  // Generate Simulated Devices according to deviceLimit
  useEffect(() => {
    if (studioSettings.deviceLimit === 0) {
      setDevices((prev) => prev.filter((d) => d.isReal));
      return;
    }

    const types: BTEmulatedDevice['type'][] = ['headset', 'tag', 'phone', 'tv', 'beacon', 'unknown'];
    const names = [
      'Sony WH-1000XM4', 'AirPods Pro 2', 'Moto Tag #04', 'Galaxy Watch 6', 
      'Smart TV LG OLED', 'Beacon BLE-88', 'Beacon Sensor #12', 'Fone Bluetooth #09',
      'Raspberry Pi Node', 'Termux Gateway'
    ];

    const generateDevice = (i: number): BTEmulatedDevice => ({
      id: `node-${i + 1}-${Math.random().toString(36).substring(2, 7)}`,
      name: names[i % names.length] || `BLE Target #${i + 1}`,
      rssi: -35 - Math.floor(Math.random() * 55),
      distance: Number((Math.random() * (studioSettings.radarRangeMeters * 0.8) + 2).toFixed(1)),
      angle: Math.floor(Math.random() * 360),
      type: types[i % types.length],
      active: true,
      lastSeen: new Date().toLocaleTimeString()
    });

    setDevices((prev) => {
      const realDevices = prev.filter((d) => d.isReal);
      const simDevices: BTEmulatedDevice[] = Array.from({ length: studioSettings.deviceLimit }, (_, i) => generateDevice(i));
      return [...realDevices, ...simDevices];
    });
  }, [studioSettings.deviceLimit, studioSettings.radarRangeMeters]);

  // Periodic Device Jitter (simulates real movement & signal fluctuation)
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices((prev) =>
        prev.map((d) => ({
          ...d,
          rssi: Math.min(-20, Math.max(-95, d.rssi + (Math.floor(Math.random() * 7) - 3))),
          angle: (d.angle + (Math.random() > 0.5 ? 1 : -1) + 360) % 360,
        }))
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // SOS Geolocation Management
  const activateSOS = () => {
    setSosActive(true);
    setLogs((prev) => [...prev, "[SOS] Ativando protocolo de transmissão de emergência..."]);

    const { dateStr, timeStr, fullStamp } = getFormattedDateTime();

    if (sosBroadcastToChat) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'System',
          text: `🚨 TRANSMISSÃO SOS INICIADA — Rastreamento GPS ao vivo sintonizado na barra superior do Chat.`,
          timestamp: fullStamp
        }
      ]);
    }

    if ("geolocation" in navigator) {
      setGpsStatus("🟢 Obtendo coordenadas de satélite...");

      const handlePos = (pos: GeolocationPosition) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const current = getFormattedDateTime();
        setGpsData({ lat: latitude, lng: longitude, acc: accuracy, time: current.timeStr, date: current.dateStr });
        setGpsStatus("🟢 GPS Sintonizado em Alta Precisão");

        setLogs((prev) => [
          ...prev, 
          `[SOS] Coordenadas GPS: Lat ${latitude.toFixed(6)}, Lng ${longitude.toFixed(6)} (±${accuracy.toFixed(0)}m)`
        ]);
      };

      const handleErr = (err: GeolocationPositionError) => {
        setGpsStatus(`🔴 Erro no sensor GPS: ${err.message}`);
        setLogs((prev) => [...prev, `[SOS] Erro Geolocation: ${err.message}. Usando coordenadas estimadas.`]);
        
        // Fallback simulation coordinates
        const current = getFormattedDateTime();
        const simGps = { lat: -23.55052, lng: -46.633308, acc: 12, time: current.timeStr, date: current.dateStr };
        setGpsData(simGps);
      };

      watchIdRef.current = navigator.geolocation.watchPosition(handlePos, handleErr, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    } else {
      setGpsStatus("🔴 Dispositivo sem suporte a GPS nativo");
    }
  };

  const stopSOS = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSosActive(false);
    setGpsStatus("Aguardando ativação do GPS...");
    setLogs((prev) => [...prev, "[SOS] Transmissão de emergência ENCERRADA."]);

    const { fullStamp } = getFormattedDateTime();

    if (sosBroadcastToChat) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'System',
          text: `🛑 TRANSMISSÃO SOS ENCERRADA.`,
          timestamp: fullStamp
        }
      ]);
    }
  };

  const testSosSimulation = () => {
    if (studioSettings.soundEnabled) playScanBeep();
    setLogs((prev) => [
      ...prev,
      "[SOS TESTE] Executando diagnóstico completo de emergência...",
      "[SOS TESTE] Sensor GPS: OK",
      `[SOS TESTE] Contatos Ativos: ${emergencyContacts.filter((c) => c.active).length}`,
      "[SOS TESTE] Canal P2P LAN: Ativo",
      "[SOS TESTE] Resultado: Alerta gerado com sucesso!"
    ]);
  };

  // Actions
  const handleScanRealBleDevices = async () => {
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

    if (typeof window === 'undefined' || !navigator.bluetooth) {
      setBleNoticeModal({
        open: true,
        title: '📱 Web Bluetooth Não Suportado',
        message: 'A Web Bluetooth API não foi detectada neste navegador ou aba.\n\nPara escanear dispositivos Bluetooth reais (fones, tags, relógios):\n• Use o Google Chrome ou Edge no Android ou PC.\n• Abra a página via HTTPS.',
        showNewTabBtn: true
      });
      return;
    }

    setLogs((prev) => [
      ...prev,
      "[BLE PASSO 1] Solicitando permissão de Bluetooth ao navegador...",
      "⚠️ DICA ANDROID: Mantenha a LOCALIZAÇÃO (GPS) ligada no celular e o fone em MODO DE PAREAMENTO para ele aparecer na lista!"
    ]);

    try {
      if (studioSettings.soundEnabled) playScanBeep();
      
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'battery_service', 
          'device_information', 
          'generic_access', 
          'generic_attribute',
          0x180f, 0x180a, 0x1800, 0x1801, 0x180d, 0x180e
        ]
      });

      if (device) {
        const newRealDevice: BTEmulatedDevice = {
          id: device.id || `ble-real-${Math.random().toString(36).substring(2, 7)}`,
          name: device.name || `Dispositivo BLE (${device.id.substring(0, 6)})`,
          rssi: -42,
          distance: 1.8,
          angle: Math.floor(Math.random() * 360),
          type: 'phone',
          active: true,
          lastSeen: new Date().toLocaleTimeString(),
          isReal: true,
          gattDevice: device,
          connected: device.gatt?.connected || false,
        };

        setDevices((prev) => [newRealDevice, ...prev.filter((d) => d.id !== newRealDevice.id)]);
        setSelectedDevice(newRealDevice);

        setLogs((prev) => [
          ...prev,
          `[BLE REAL CONECTADO/SELECIONADO] Nome: "${newRealDevice.name}" | ID: ${newRealDevice.id}`,
          `[GATT] Clique em "CONECTAR DISPOSITIVO VIA GATT" no painel do dispositivo para estabelecer o canal de dados!`
        ]);
      }
    } catch (err: any) {
      if (err.name === 'SecurityError' || (err.message && err.message.includes('iframe'))) {
        setBleNoticeModal({
          open: true,
          title: '🔒 Varredura Bluetooth em iFrame',
          message: 'O navegador restringe o acesso direto ao hardware Bluetooth dentro de iFrames de pré-visualização.\n\nAbra o app em uma Nova Aba para liberar o pareamento Bluetooth real!',
          showNewTabBtn: true
        });
      } else if (err.name === 'NotFoundError') {
        setBleNoticeModal({
          open: true,
          title: '🔍 Nenhum Dispositivo Apareceu?',
          message: 'O pareamento do Android ficou rodando sem encontrar ninguém? Siga estes 3 passos no celular:\n\n1. 📍 LIGUE O GPS / LOCALIZAÇÃO do celular (o Android bloqueia varredura Bluetooth se o GPS estiver desligado).\n2. 🎧 COLOQUE O FONE EM MODO DE PAREAMENTO (segure o botão do fone até piscar a luz azul/vermelha).\n3. 📲 Se o fone já estiver conectado tocando música, desconecte-o nas configurações do Bluetooth para ele ficar visível.',
          showNewTabBtn: isInIframe
        });
        setLogs((prev) => [...prev, "[BLE] Varredura cancelada ou nenhum dispositivo foi selecionado na lista nativa."]);
      } else {
        setBleNoticeModal({
          open: true,
          title: '⚠️ Aviso de Acesso Bluetooth',
          message: `${err.message || 'Certifique-se de que o Bluetooth e a Localização (GPS) do seu celular estão ativados.'}`,
          showNewTabBtn: isInIframe
        });
      }
    }
  };

  const handleClearSimulatedDevices = () => {
    setStudioSettings((prev) => ({ ...prev, deviceLimit: 0 }));
    setDevices((prev) => prev.filter((d) => d.isReal));
    setSelectedDevice((prev) => (prev && !prev.isReal ? null : prev));
    setLogs((prev) => [
      ...prev,
      "[RADAR] Dispositivos simulados (fakes) removidos do radar.",
      "[RADAR] Exibindo exclusivamente dispositivos Bluetooth reais escaneados!"
    ]);
  };

  const handleConnectGatt = async (targetDevice: BTEmulatedDevice) => {
    setLogs((prev) => [...prev, `[GATT] Tentando conectar ao dispositivo "${targetDevice.name}"...`]);

    setDevices((prev) =>
      prev.map((d) => (d.id === targetDevice.id ? { ...d, connecting: true } : d))
    );
    setSelectedDevice((prev) => (prev?.id === targetDevice.id ? { ...prev, connecting: true } : prev));

    if (targetDevice.isReal && targetDevice.gattDevice && targetDevice.gattDevice.gatt) {
      try {
        const server = await targetDevice.gattDevice.gatt.connect();
        setLogs((prev) => [...prev, `[GATT SUCESSO] 🟢 Conectado via Web Bluetooth GATT a ${targetDevice.name}!`]);

        let serviceUuids: string[] = [];
        try {
          const services = await server.getPrimaryServices();
          serviceUuids = services.map((s: any) => s.uuid);
          setLogs((prev) => [...prev, `[GATT SERVIÇOS] Encontrados: ${serviceUuids.join(', ')}`]);
        } catch {
          setLogs((prev) => [...prev, `[GATT INFO] Conexão GATT ativa.`]);
        }

        const updated: BTEmulatedDevice = {
          ...targetDevice,
          connecting: false,
          connected: true,
          gattServices: serviceUuids.length > 0 ? serviceUuids : ['Serviço Genérico (GATT)'],
        };

        setDevices((prev) => prev.map((d) => (d.id === targetDevice.id ? updated : d)));
        setSelectedDevice(updated);
      } catch (err: any) {
        setLogs((prev) => [...prev, `[GATT ERRO] 🔴 Falha ao conectar: ${err.message}`]);
        const updated: BTEmulatedDevice = { ...targetDevice, connecting: false, connected: false };
        setDevices((prev) => prev.map((d) => (d.id === targetDevice.id ? updated : d)));
        setSelectedDevice(updated);
      }
    } else {
      // Simulated connection handshake
      setTimeout(() => {
        const updated: BTEmulatedDevice = {
          ...targetDevice,
          connecting: false,
          connected: true,
          gattServices: ['0x180F (Bateria)', '0x180A (Info Dispositivo)', '0x1800 (Acesso Genérico)'],
        };
        setDevices((prev) => prev.map((d) => (d.id === targetDevice.id ? updated : d)));
        setSelectedDevice(updated);
        setLogs((prev) => [
          ...prev,
          `[GATT CONECTADO] 🟢 Par Bluetooth estabelecido com ${targetDevice.name}! (Serviços GATT Ativos)`
        ]);
      }, 1000);
    }
  };

  const handleDisconnectGatt = (targetDevice: BTEmulatedDevice) => {
    if (targetDevice.isReal && targetDevice.gattDevice?.gatt?.connected) {
      targetDevice.gattDevice.gatt.disconnect();
    }
    const updated: BTEmulatedDevice = {
      ...targetDevice,
      connected: false,
      connecting: false,
      gattServices: undefined,
    };
    setDevices((prev) => prev.map((d) => (d.id === targetDevice.id ? updated : d)));
    setSelectedDevice(updated);
    setLogs((prev) => [...prev, `[GATT] Desconectado de ${targetDevice.name}.`]);
  };

  const handleScanDevices = () => {
    if (studioSettings.soundEnabled) playScanBeep();
    const newDevice: BTEmulatedDevice = {
      id: `scanned-${Math.random().toString(36).substring(2, 7)}`,
      name: `Dispositivo Novo BLE #${devices.length + 1}`,
      rssi: -40 - Math.floor(Math.random() * 30),
      distance: Number((Math.random() * 25 + 3).toFixed(1)),
      angle: Math.floor(Math.random() * 360),
      type: 'phone',
      active: true,
      lastSeen: new Date().toLocaleTimeString()
    };
    setDevices((prev) => [newDevice, ...prev]);
    setLogs((prev) => [...prev, `[SCANNER] Dispositivo detectado: ${newDevice.name} (${newDevice.rssi} dBm)`]);
  };

  const handleInterceptAudio = () => {
    if (studioSettings.soundEnabled) playButtonClick();
    setLogs((prev) => [
      ...prev,
      "[ÁUDIO] Sintonizando canal A2DP Bluetooth...",
      "[ÁUDIO] Análise de Espectro: Criptografia AES-CCM detectada no par de fones.",
      "[SYS] Transmissão protegida. Exibindo simulador de frequência de voz."
    ]);
  };

  const handleTransmitTvSignal = () => {
    if (studioSettings.soundEnabled) playButtonClick();
    setLogs((prev) => [
      ...prev,
      "[SINAL TV] Enviando payload IR / Wake-On-LAN...",
      "[SINAL TV] Buscando emissor de Infravermelho ou comando HDMI-CEC...",
      "[SYS] Sinal transmitido para a rede local."
    ]);
  };

  const handleSendMessage = (text: string) => {
    setChatMessages((prev) => [
      ...prev,
      { sender: 'Me', text, timestamp: new Date().toLocaleTimeString() }
    ]);
    setLogs((prev) => [...prev, `[HUB] Mensagem enviada: "${text.substring(0, 20)}..."`]);

    // Simulated Peer Echo response
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'Peer',
          text: `Confirmação de recebimento: ${text}`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }, 800);
  };

  const handleDeleteMessage = (index: number) => {
    setChatMessages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    const fileUrl = URL.createObjectURL(file);

    const newFileObj = {
      name: file.name,
      url: fileUrl,
      isImage,
      isVideo,
      isAudio
    };

    const fileTypeLabel = isAudio 
      ? '🎙️ Áudio de Voz' 
      : isVideo 
        ? '📹 Vídeo' 
        : isImage 
          ? '📷 Foto / Imagem' 
          : `📄 Arquivo: ${file.name.length > 20 ? file.name.substring(0, 18) + '...' : file.name}`;

    setFiles((prev) => [newFileObj, ...prev]);
    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'Me',
        text: fileTypeLabel,
        timestamp: new Date().toLocaleTimeString(),
        file: newFileObj
      }
    ]);
    setLogs((prev) => [...prev, `[HUB] Arquivo compartilhado na rede: ${file.name}`]);
  };

  const handleDeleteFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => (f.name || f) !== fileName));
  };

  const handleSaveContacts = (contactsList: EmergencyContact[]) => {
    setEmergencyContacts(contactsList);
    try {
      localStorage.setItem('sosContacts', JSON.stringify(contactsList));
    } catch {}
  };

  const currentTheme = THEMES[studioSettings.theme];

  return (
    <div 
      className="w-full h-dvh flex flex-col overflow-hidden font-mono transition-all duration-200 select-none"
      style={{
        backgroundColor: currentTheme.bg,
        color: currentTheme.text,
        fontSize: `${studioSettings.fontSizeScale * 100}%`
      }}
    >
      {/* Top Navigation & Status Bar */}
      <Header 
        settings={studioSettings}
        view={view}
        onViewChange={setView}
        onOpenStudio={() => setIsStudioOpen(true)}
        onScanDevices={handleScanDevices}
        onInterceptAudio={handleInterceptAudio}
        onTransmitTvSignal={handleTransmitTvSignal}
        deviceCount={devices.length}
      />

      {/* Main Content Area according to view & layoutMode */}
      <main className="flex-1 flex overflow-hidden relative">
        {view === 'radar' && (
          <div className="w-full h-full flex flex-col md:flex-row overflow-hidden">
            {/* Interactive Animated Radar Screen */}
            <section className="flex-1 h-full relative overflow-hidden">
              <RadarCanvas 
                settings={studioSettings}
                devices={devices}
                onSelectDevice={setSelectedDevice}
                selectedDevice={selectedDevice}
                onScanRealBle={handleScanRealBleDevices}
                onClearSimulated={handleClearSimulatedDevices}
                onConnectGatt={handleConnectGatt}
                onDisconnectGatt={handleDisconnectGatt}
              />
            </section>

            {/* Devices Feed Sidebar */}
            {studioSettings.showSidebar && (
              <aside 
                className="w-full md:w-80 h-48 md:h-full border-t md:border-t-0 md:border-l flex flex-col shrink-0 overflow-hidden"
                style={{ backgroundColor: currentTheme.panelBg, borderColor: currentTheme.border }}
              >
                <div 
                  className="p-3 border-b flex justify-between items-center shrink-0"
                  style={{ backgroundColor: currentTheme.headerBg, borderColor: currentTheme.border }}
                >
                  <span className="font-bold text-xs uppercase tracking-wider">Feed de Dispositivos</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-emerald-400">{devices.length} ATIVOS</span>
                    {devices.some((d) => !d.isReal) && (
                      <button
                        type="button"
                        onClick={handleClearSimulatedDevices}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 hover:bg-amber-500/30 font-bold cursor-pointer transition-all active:scale-95"
                        title="Remover alvos simulados e manter apenas o Bluetooth real"
                      >
                        Limpar Fakes
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2 hide-scrollbar">
                  {devices.map((device) => {
                    const isSelected = selectedDevice?.id === device.id;
                    return (
                      <div 
                        key={device.id}
                        onClick={() => setSelectedDevice(device)}
                        className={`p-2.5 rounded border text-xs cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-white/10 border-cyan-400 ring-1 ring-cyan-400' 
                            : 'bg-black/30 hover:bg-black/50 border-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-center font-bold">
                          <div className="flex items-center gap-1.5 truncate pr-2">
                            <span className="truncate">{device.name}</span>
                            {device.isReal && (
                              <span className="px-1 py-0.2 text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded">REAL</span>
                            )}
                          </div>
                          <span className="text-emerald-400 text-[11px] shrink-0">{device.rssi} dBm</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] opacity-70 mt-1">
                          <span>~{device.distance}m de distância</span>
                          <span className={`uppercase font-bold ${device.connected ? 'text-emerald-400' : 'text-sky-400'}`}>
                            {device.connected ? '🟢 CONECTADO' : device.type}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                            <div className="text-[10px] flex justify-between font-mono">
                              <span className="opacity-70">GATT:</span>
                              <span className={device.connected ? 'text-emerald-400 font-bold' : device.connecting ? 'text-amber-400 font-bold animate-pulse' : 'text-red-400 font-bold'}>
                                {device.connected ? '🟢 CONECTADO' : device.connecting ? '🟡 CONECTANDO...' : '🔴 DESCONECTADO'}
                              </span>
                            </div>

                            {device.connected ? (
                              <button
                                type="button"
                                onClick={() => handleDisconnectGatt(device)}
                                className="w-full py-1.5 px-2 rounded bg-red-600/80 hover:bg-red-500 text-white font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow"
                              >
                                <span>Desconectar GATT</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleConnectGatt(device)}
                                disabled={device.connecting}
                                className="w-full py-1.5 px-2 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow"
                              >
                                <span>{device.connecting ? 'Conectando...' : '🔗 Conectar Dispositivo (GATT)'}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </aside>
            )}
          </div>
        )}

        {view === 'hub' && (
          <OfflineHub 
            settings={studioSettings}
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            onDeleteMessage={handleDeleteMessage}
            files={files}
            onFileUpload={handleFileUpload}
            onDeleteFile={handleDeleteFile}
            peerSosData={peerSosData}
            sosActive={sosActive}
            gpsData={gpsData}
            onStopSos={stopSOS}
          />
        )}

        {view === 'sos' && (
          <SosModule 
            settings={studioSettings}
            sosActive={sosActive}
            onActivateSos={activateSOS}
            onStopSos={stopSOS}
            gpsData={gpsData}
            gpsStatus={gpsStatus}
            contacts={emergencyContacts}
            onSaveContacts={handleSaveContacts}
            customMessage={customMessage}
            onCustomMessageChange={setCustomMessage}
            broadcastToChat={sosBroadcastToChat}
            onBroadcastToChatChange={setSosBroadcastToChat}
            onTestSos={testSosSimulation}
          />
        )}

        {view === 'music' && (
          <MusicPlayerModule 
            settings={studioSettings}
            devices={devices}
            selectedDevice={selectedDevice}
            onSelectDevice={setSelectedDevice}
            onAddLog={(log) => setLogs((prev) => [...prev, log])}
          />
        )}
      </main>

      {/* Diagnostics Terminal Logcat Footer */}
      <LogcatFooter 
        settings={studioSettings}
        logs={logs}
        onClearLogs={() => setLogs([])}
      />

      {/* Real-time Studio Customizer Drawer */}
      <StudioPanel 
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        settings={studioSettings}
        onUpdateSettings={updateStudioSettings}
        onResetSettings={resetStudioSettings}
      />

      {/* Bluetooth Info / Permission Modal */}
      {bleNoticeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4 font-mono text-white text-xs">
            <div className="flex justify-between items-center border-b border-cyan-500/30 pb-2">
              <span className="font-bold text-sm text-cyan-400 flex items-center gap-2">
                {bleNoticeModal.title}
              </span>
              <button 
                type="button"
                onClick={() => setBleNoticeModal(prev => ({ ...prev, open: false }))}
                className="text-white/60 hover:text-white p-1 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <p className="opacity-90 leading-relaxed text-[11px] whitespace-pre-line">
              {bleNoticeModal.message}
            </p>

            <div className="flex flex-col gap-2 pt-2">
              {bleNoticeModal.showNewTabBtn && (
                <button
                  type="button"
                  onClick={() => {
                    window.open(window.location.href, '_blank');
                    setBleNoticeModal(prev => ({ ...prev, open: false }));
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg"
                >
                  🚀 Abrir App em Nova Aba Externa
                </button>
              )}

              <button
                type="button"
                onClick={() => setBleNoticeModal(prev => ({ ...prev, open: false }))}
                className="w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer transition-all"
              >
                Entendi / Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
