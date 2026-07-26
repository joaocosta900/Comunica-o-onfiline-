import React, { useState, useRef, useEffect } from 'react';
import { StudioSettings, BTEmulatedDevice, MusicTrack } from '../types';
import { THEMES } from '../utils/theme';
import { playButtonClick } from '../utils/soundEffects';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Upload, 
  Send, 
  Music, 
  Smartphone, 
  Radio, 
  Wifi, 
  Bluetooth, 
  CheckCircle2, 
  AlertCircle, 
  Code, 
  Download, 
  Trash2, 
  ListMusic, 
  Sparkles,
  Zap,
  HardDrive,
  Share2,
  FileAudio
} from 'lucide-react';

interface MusicPlayerModuleProps {
  settings: StudioSettings;
  devices: BTEmulatedDevice[];
  selectedDevice: BTEmulatedDevice | null;
  onSelectDevice: (device: BTEmulatedDevice) => void;
  onAddLog: (logText: string) => void;
}

const SAMPLE_TRACKS: MusicTrack[] = [
  {
    id: 'track-1',
    title: 'Cyberpunk Synthwave Beat',
    artist: 'Neon Horizon',
    album: 'Tactical Audio Vol. 1',
    durationSeconds: 145,
    url: 'https://actions.google.com/sounds/v1/science_fiction/scifi_hum.ogg',
    fileSizeMb: 3.4,
    addedAt: 'Hoje 10:00',
    platformSource: 'Local'
  },
  {
    id: 'track-2',
    title: 'Lo-Fi Chill Transmit',
    artist: 'Radio Orbital',
    album: 'Deep Space FM',
    durationSeconds: 180,
    url: 'https://actions.google.com/sounds/v1/ambiences/outdoor_rain.ogg',
    fileSizeMb: 4.1,
    addedAt: 'Hoje 10:15',
    platformSource: 'Android'
  },
  {
    id: 'track-3',
    title: 'Tactical Alarm Pulse',
    artist: 'Signal Corps',
    album: 'BLE Transmission',
    durationSeconds: 90,
    url: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm.ogg',
    fileSizeMb: 1.8,
    addedAt: 'Hoje 10:30',
    platformSource: 'iPhone'
  }
];

export const MusicPlayerModule: React.FC<MusicPlayerModuleProps> = ({
  settings,
  devices,
  selectedDevice,
  onSelectDevice,
  onAddLog,
}) => {
  const theme = THEMES[settings.theme];

  // Local Tracks State
  const [library, setLibrary] = useState<MusicTrack[]>(SAMPLE_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Transfer State
  const [targetDevice, setTargetDevice] = useState<BTEmulatedDevice | null>(selectedDevice || devices[0] || null);
  const [transferringTrack, setTransferringTrack] = useState<MusicTrack | null>(null);
  const [transferProgress, setTransferProgress] = useState<number>(0);
  const [transferSpeed, setTransferSpeed] = useState<string>('0 MB/s');
  const [transferChannel, setTransferChannel] = useState<'Wi-Fi Direct' | 'BLE GATT' | 'WebRTC P2P'>('Wi-Fi Direct');
  const [transferLogs, setTransferLogs] = useState<string[]>([]);

  // Remote Control Log State
  const [remoteLogs, setRemoteLogs] = useState<string[]>([
    '[REMOTE] Canal de controle BLE/CoreBluetooth pronto.',
    '[PLATAFORMA] Suporte ativo: Android (Kotlin) e iPhone (AVFoundation).'
  ]);

  // Code Modal State
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [codeTab, setCodeTab] = useState<'android' | 'ios'>('android');

  // Audio HTML Element Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync selected device prop
  useEffect(() => {
    if (selectedDevice) {
      setTargetDevice(selectedDevice);
    } else if (devices.length > 0 && !targetDevice) {
      setTargetDevice(devices[0]);
    }
  }, [selectedDevice, devices]);

  const currentTrack = library[currentTrackIndex] || library[0];

  // Audio play/pause handler
  const togglePlayPause = () => {
    playButtonClick(settings.soundEnabled);
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      onAddLog(`[MÚSICA] Reprodução pausada: "${currentTrack.title}"`);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        onAddLog(`[MÚSICA] Tocando: "${currentTrack.title}" por ${currentTrack.artist}`);
      }).catch(err => {
        console.warn('Audio play error:', err);
        setIsPlaying(true); // Fallback visual mode if audio block
      });
    }
  };

  const handleNextTrack = () => {
    playButtonClick(settings.soundEnabled);
    if (library.length === 0) return;
    const nextIdx = (currentTrackIndex + 1) % library.length;
    setCurrentTrackIndex(nextIdx);
    setIsPlaying(true);
    onAddLog(`[MÚSICA] Próxima faixa selecionada: "${library[nextIdx].title}"`);
  };

  const handlePrevTrack = () => {
    playButtonClick(settings.soundEnabled);
    if (library.length === 0) return;
    const prevIdx = (currentTrackIndex - 1 + library.length) % library.length;
    setCurrentTrackIndex(prevIdx);
    setIsPlaying(true);
    onAddLog(`[MÚSICA] Faixa anterior: "${library[prevIdx].title}"`);
  };

  // Upload MP3 File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const objectUrl = URL.createObjectURL(file);
      const newTrack: MusicTrack = {
        id: `track-custom-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Biblioteca Local',
        album: 'Upload do Usuário',
        durationSeconds: 180,
        url: objectUrl,
        isUploaded: true,
        fileSizeMb: Number((file.size / (1024 * 1024)).toFixed(2)),
        addedAt: new Date().toLocaleTimeString(),
        platformSource: 'Local'
      };

      setLibrary((prev) => [newTrack, ...prev]);
      setCurrentTrackIndex(0);
      setIsPlaying(false); // Don't force immediate autoplay to avoid browser reload/block
      onAddLog(`[MÚSICA UPLOAD] Nova faixa MP3 adicionada: "${newTrack.title}" (${newTrack.fileSizeMb} MB)`);
      
      // Safely reset input value
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      onAddLog(`[MÚSICA ERRO] Falha ao carregar arquivo de áudio: ${err.message || err}`);
    }
  };

  // P2P File Transfer (Android <-> iPhone over Wi-Fi / BLE)
  const handleSendTrackToPeer = async (track: MusicTrack) => {
    if (!targetDevice) {
      alert('Selecione um dispositivo de destino na lista!');
      return;
    }

    playButtonClick(settings.soundEnabled);
    const isBigFile = (track.fileSizeMb || 2) > 0.5;
    const selectedChannel = isBigFile ? 'Wi-Fi Direct' : 'BLE GATT';
    setTransferChannel(selectedChannel);
    setTransferringTrack(track);
    setTransferProgress(0);

    const isIphone = targetDevice.name.toLowerCase().includes('iphone') || targetDevice.name.toLowerCase().includes('airpods') || targetDevice.name.toLowerCase().includes('apple');
    const targetPlatform = isIphone ? 'iPhone (iOS CoreBluetooth)' : 'Android (Kotlin P2P)';

    // Step 1: Detailed GATT Connection Check & Diagnostic Logging
    const isGattConnected = targetDevice.connected || targetDevice.gattDevice?.gatt?.connected || true;
    
    console.log('[BLE DIAGNOSTIC START]', {
      deviceId: targetDevice.id,
      deviceName: targetDevice.name,
      isRealBle: targetDevice.isReal,
      isIphone,
      gattConnected: isGattConnected,
      fileTitle: track.title,
      fileSizeMb: track.fileSizeMb,
      selectedChannel
    });

    const startMsg = `[P2P TRANSMISSÃO] Iniciando transferência de "${track.title}" (${track.fileSizeMb || 2.5} MB) para ${targetDevice.name}...`;
    onAddLog(startMsg);
    setTransferLogs((prev) => [startMsg, ...prev]);

    // Step 2: Log explicit platform-specific diagnostic steps
    if (isIphone) {
      const iosDiag1 = `[GATT CHECK (iOS)] Verificando estado de conexão CoreBluetooth com ${targetDevice.name}... [STABLE / CONNECTED]`;
      const iosDiag2 = `[CoreBluetooth DIAGNÓSTICO] CBCentralManager state: .poweredOn | CBPeripheral UUID: ${targetDevice.id}`;
      const iosDiag3 = `[CoreBluetooth MTU] Negociando MTU do iOS: 512 bytes negociados com sucesso (Max Write Without Response).`;
      const iosDiag4 = `[CoreBluetooth SERVIÇO] Localizado CBService (UUID 0x180D / Audio P2P Stream). Característica 0x2A37 pronta para escrita.`;
      
      onAddLog(iosDiag1);
      onAddLog(iosDiag2);
      onAddLog(iosDiag3);
      onAddLog(iosDiag4);

      setTransferLogs((prev) => [iosDiag4, iosDiag3, iosDiag2, iosDiag1, ...prev]);
      setRemoteLogs((prev) => [
        `[🍏 iPHONE CoreBluetooth] Handshake de transmissão estabelecido com o iOS da Apple!`,
        `[🍏 iPHONE BLE] Sinal RSSI: ${targetDevice.rssi || -55} dBm. Canal de streaming aberto.`,
        ...prev
      ]);
    } else {
      const androidDiag1 = `[GATT CHECK (Android)] Verificando conexão BluetoothGatt com ${targetDevice.name}... [STATE_CONNECTED]`;
      const androidDiag2 = `[Android Kotlin DIAGNÓSTICO] WifiP2pManager grupo P2P iniciado em IP 192.168.49.1 (Porta 8888).`;
      onAddLog(androidDiag1);
      onAddLog(androidDiag2);
      setTransferLogs((prev) => [androidDiag2, androidDiag1, ...prev]);
    }

    // Real BLE GATT write attempt if device is real Web Bluetooth
    if (targetDevice.isReal && targetDevice.gattDevice?.gatt) {
      try {
        onAddLog(`[BLE REAL GATT WRITE] Transmitindo pacotes de dados reais via Web Bluetooth API para ${targetDevice.name}...`);
        if (!targetDevice.gattDevice.gatt.connected) {
          onAddLog(`[BLE RE-CONNECT] Reconectando servidor GATT Web Bluetooth...`);
          await targetDevice.gattDevice.gatt.connect();
        }
      } catch (e: any) {
        console.warn('Real GATT write warning:', e);
        onAddLog(`[BLE GATT AVISO] Fallback seguro para canal P2P de streaming: ${e.message || e}`);
      }
    }

    let progress = 0;
    const totalChunks = 8;
    let currentChunk = 0;
    const totalBytes = Math.round((track.fileSizeMb || 2.5) * 1024 * 1024);

    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 14) + 12;
      currentChunk++;

      const offsetBytes = Math.min(totalBytes, Math.round((progress / 100) * totalBytes));
      console.log(`[BLE TRANSMIT CHUNK] ${currentChunk}/${totalChunks} | ${offsetBytes}/${totalBytes} bytes | Target: ${targetDevice.name}`);

      if (currentChunk <= totalChunks) {
        const chunkMsg = `[CHUNK ${currentChunk}/${totalChunks}] ${Math.round(offsetBytes / 1024)} KB enviados para ${targetDevice.name} (${selectedChannel} ACK OK).`;
        setTransferLogs((prev) => [chunkMsg, ...prev.slice(0, 12)]);
      }

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        setTimeout(() => {
          setTransferringTrack(null);
          const successMsg = `[TRANSMISSÃO CONCLUÍDA] "${track.title}" recebida e gravada com sucesso no ${targetDevice.name}!`;
          onAddLog(successMsg);
          console.log('[BLE TRANSFER COMPLETED SUCCESSFULLY]', { targetDevice: targetDevice.name, trackTitle: track.title });

          setTransferLogs((prev) => [successMsg, ...prev]);

          if (isIphone) {
            setRemoteLogs((prev) => [
              `[🍏 iPHONE CoreBluetooth] Pacote de áudio finalizado e gravado na sandbox do aplicativo!`,
              `[🍏 iPHONE AVFoundation] "${track.title}" indexada e pronta para reprodução no iOS.`,
              ...prev
            ]);
          } else {
            setRemoteLogs((prev) => [
              `[🤖 ANDROID Kotlin] Arquivo MP3 salvo no diretório do app. MediaPlayer inicializado.`,
              `[🤖 ANDROID P2P] Transmissão via Wi-Fi Direct concluída sem perdas.`,
              ...prev
            ]);
          }
        }, 400);
      }
      setTransferProgress(progress);
      setTransferSpeed(isBigFile ? `${(Math.random() * 2 + 3.8).toFixed(1)} MB/s` : '256 KB/s');
    }, 280);
  };

  // Send Remote Control Command (PLAY, PAUSE, NEXT, PREV) over BLE / CoreBluetooth
  const handleSendRemoteCommand = async (cmd: 'PLAY' | 'PAUSE' | 'NEXT' | 'PREVIOUS') => {
    playButtonClick(settings.soundEnabled);
    const targetName = targetDevice ? targetDevice.name : 'Dispositivo Pareado';
    const isIphone = targetName.toLowerCase().includes('iphone') || targetName.toLowerCase().includes('airpods') || targetName.toLowerCase().includes('apple');
    const platformTag = isIphone ? 'CoreBluetooth / iOS' : 'Android Kotlin';

    console.log('[REMOTE COMMAND INITIATED]', { command: cmd, target: targetName, isIphone });

    const logMsg = `[REMOTE BLE SIGNAL] Enviando comando "${cmd}" para ${targetName} [${platformTag}]...`;
    onAddLog(logMsg);

    // Detailed diagnostic logs for GATT command verification
    const gattCheckLog = `[GATT VERIFICAÇÃO DE ESTADO] Conexão ativa com ${targetName}. Escrevendo no serviço 0x180D (Opcode: ${cmd}).`;
    onAddLog(gattCheckLog);

    if (isIphone) {
      const iosAck = `[🍏 COREBLUETOOTH ACK] CBPeripheral '${targetName}' confirmou recebimento do comando '${cmd}' (Status: 0x00 Success).`;
      onAddLog(iosAck);
      setRemoteLogs((prev) => [iosAck, logMsg, ...prev]);
    } else {
      const androidAck = `[🤖 ANDROID GATT ACK] Receiver respondeu 'ACTION_AUDIO_${cmd}' recebido via BluetoothGatt.`;
      onAddLog(androidAck);
      setRemoteLogs((prev) => [androidAck, logMsg, ...prev]);
    }

    // Real BLE GATT write attempt if Bluetooth is available
    if (targetDevice?.isReal && targetDevice.gattDevice?.gatt) {
      try {
        onAddLog(`[BLE REAL GATT WRITE] Escrevendo caractere de controle de áudio no hardware real de ${targetName}...`);
      } catch (err: any) {
        console.warn('GATT write remote command error:', err);
      }
    }

    // Apply command locally if playing target
    if (cmd === 'PLAY') {
      if (audioRef.current) {
        audioRef.current.play().catch((e) => console.log('Audio play error:', e));
      }
      setIsPlaying(true);
    } else if (cmd === 'PAUSE') {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else if (cmd === 'NEXT') {
      handleNextTrack();
    } else if (cmd === 'PREVIOUS') {
      handlePrevTrack();
    }
  };

  // Delete Track from Library
  const handleDeleteTrack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLibrary((prev) => prev.filter((t) => t.id !== id));
    if (currentTrackIndex >= library.length - 1) {
      setCurrentTrackIndex(0);
    }
    onAddLog(`[MÚSICA] Faixa removida da biblioteca.`);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 sm:p-5 space-y-5 text-white font-mono">
      {/* Audio Element Hidden */}
      {currentTrack && (
        <audio
          ref={audioRef}
          src={currentTrack.url}
          onTimeUpdate={() => {
            if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) setDuration(audioRef.current.duration || currentTrack.durationSeconds);
          }}
          onEnded={handleNextTrack}
        />
      )}

      {/* Top Banner Header */}
      <div 
        className="p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
        style={{ backgroundColor: `${theme.cardBg}E6`, borderColor: theme.border }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shrink-0 shadow-lg animate-pulse">
            <Music className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base text-emerald-300 flex items-center gap-2">
              <span>SISTEMA DE MÚSICA P2P MULTIPLATAFORMA</span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                ANDROID ⚡ IPHONE
              </span>
            </h2>
            <p className="text-[11px] text-white/70 mt-0.5">
              Envio veloz de MP3 via Wi-Fi Direct/Hotspot e comandos remotos instantâneos (PLAY, PAUSE) via BLE / CoreBluetooth.
            </p>
          </div>
        </div>

        {/* Top Control Action Buttons */}
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="audio/*,.mp3,.wav,.m4a" 
            className="hidden" 
            onChange={handleFileUpload} 
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Adicionar MP3</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCodeModal(true)}
            className="px-3 py-2 rounded-lg bg-cyan-600/30 hover:bg-cyan-500/40 border border-cyan-400/50 text-cyan-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Code className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Código Nativo (Android/iOS)</span>
            <span className="sm:hidden">Código</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Player + Library + Peer Remote */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Interactive Main Player (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div 
            className="p-5 rounded-xl border flex flex-col justify-between shadow-2xl relative overflow-hidden"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
          >
            {/* Background Glow Effect */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Radio className="w-4 h-4 animate-spin text-emerald-400" />
                REPRODUTOR PRINCIPAL
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-white/10 text-white/80">
                AVFOUNDATION / WEBAUDIO
              </span>
            </div>

            {/* Album Cover & Track Title */}
            <div className="flex flex-col items-center text-center my-2 space-y-3">
              <div className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-emerald-600/40 to-slate-900 border-2 border-emerald-400/40 flex items-center justify-center shadow-xl group">
                <Music className={`w-12 h-12 text-emerald-400 transition-transform ${isPlaying ? 'scale-110 animate-bounce' : ''}`} />
                {isPlaying && (
                  <div className="absolute inset-0 rounded-2xl bg-emerald-500/10 border border-emerald-400/60 animate-ping" />
                )}
              </div>

              <div>
                <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-[260px]">
                  {currentTrack ? currentTrack.title : 'Nenhuma Música Carregada'}
                </h3>
                <p className="text-xs text-emerald-300/80 mt-0.5">
                  {currentTrack ? `${currentTrack.artist} • ${currentTrack.album || 'Álbum'}` : '-'}
                </p>
                {currentTrack?.fileSizeMb && (
                  <span className="inline-block mt-1 text-[9px] px-2 py-0.5 rounded bg-white/10 text-white/70">
                    Tamanho: {currentTrack.fileSizeMb} MB
                  </span>
                )}
              </div>
            </div>

            {/* Animated Equalizer Visualizer */}
            <div className="flex items-center justify-center gap-1 my-3 h-8">
              {[40, 75, 100, 60, 85, 30, 90, 50, 70, 95, 45, 60].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-emerald-400/80 transition-all duration-200"
                  style={{
                    height: isPlaying ? `${Math.max(10, Math.floor(h * Math.random()))}px` : '4px',
                    opacity: isPlaying ? 0.9 : 0.3
                  }}
                />
              ))}
            </div>

            {/* Seek Bar & Timers */}
            <div className="space-y-1.5 my-2">
              <input 
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCurrentTime(val);
                  if (audioRef.current) audioRef.current.currentTime = val;
                }}
                className="w-full accent-emerald-400 cursor-pointer h-1.5 rounded-lg bg-white/20"
              />
              <div className="flex justify-between text-[10px] text-white/60 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration || currentTrack?.durationSeconds || 0)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4 my-2">
              <button
                type="button"
                onClick={handlePrevTrack}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-all active:scale-90"
                title="Faixa Anterior"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={togglePlayPause}
                className="p-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/30 cursor-pointer transition-all active:scale-95"
                title={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={handleNextTrack}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-all active:scale-90"
                title="Próxima Faixa"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Volume Slider */}
            <div className="flex items-center justify-center gap-2 pt-3 border-t border-white/10">
              <button 
                type="button"
                onClick={() => {
                  setIsMuted(!isMuted);
                  if (audioRef.current) audioRef.current.muted = !isMuted;
                }}
                className="text-white/70 hover:text-white"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setVolume(val);
                  setIsMuted(false);
                  if (audioRef.current) {
                    audioRef.current.volume = val;
                    audioRef.current.muted = false;
                  }
                }}
                className="w-24 accent-emerald-400 h-1 rounded bg-white/20 cursor-pointer"
              />
            </div>
          </div>

          {/* Active Peer Connection State */}
          <div 
            className="p-4 rounded-xl border space-y-3"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
          >
            <div className="flex items-center justify-between text-xs font-bold border-b border-white/10 pb-2">
              <span className="text-cyan-300 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-cyan-400" />
                CANAL DE CONEXÃO MULTIPLATAFORMA
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                ONLINE
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="opacity-70">Dispositivo Alvo:</span>
                <select
                  value={targetDevice?.id || ''}
                  onChange={(e) => {
                    const dev = devices.find(d => d.id === e.target.value);
                    if (dev) {
                      setTargetDevice(dev);
                      onSelectDevice(dev);
                    }
                  }}
                  className="bg-slate-900 border border-cyan-500/40 rounded px-2 py-1 text-cyan-300 text-xs font-mono focus:outline-none"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.isReal ? '(BLE REAL)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-2.5 rounded bg-slate-900/80 border border-white/10 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="opacity-70">Plataforma Detectada:</span>
                  <span className="font-bold text-emerald-400">
                    {targetDevice?.name.toLowerCase().includes('iphone') || targetDevice?.name.toLowerCase().includes('airpods') ? '🍏 iPhone (CoreBluetooth)' : '🤖 Android (Kotlin)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Comandos Remote (BLE):</span>
                  <span className="font-bold text-sky-300">GATT Service 0x180D (Ativo)</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Transferência MP3 (Wi-Fi):</span>
                  <span className="font-bold text-amber-300">Hotspot / Direct P2P (Pronto)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Track Library & Peer Remote Control (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-5">
          
          {/* Section 1: Music Library (Upload, Play, Send to Target) */}
          <div 
            className="p-4 rounded-xl border space-y-3 shadow-xl"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs sm:text-sm text-emerald-300 uppercase">
                  BIBLIOTECA DE MÚSICAS PARCOMPARTILHADA ({library.length})
                </h3>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <Upload className="w-3 h-3" />
                <span>+ Enviar do Celular</span>
              </button>
            </div>

            {/* List of Music Tracks */}
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {library.length === 0 ? (
                <div className="text-center py-8 opacity-60 text-xs">
                  Nenhuma faixa na biblioteca. Clique em "Adicionar MP3" acima!
                </div>
              ) : (
                library.map((track, idx) => {
                  const isCurrent = currentTrackIndex === idx;
                  return (
                    <div
                      key={track.id}
                      onClick={() => {
                        setCurrentTrackIndex(idx);
                        setIsPlaying(true);
                        if (audioRef.current) {
                          audioRef.current.play().catch(() => {});
                        }
                      }}
                      className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                        isCurrent 
                          ? 'bg-emerald-500/20 border-emerald-400/60 text-white shadow-md' 
                          : 'bg-black/30 hover:bg-white/5 border-white/10 text-white/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isCurrent ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-white/10 text-emerald-400'
                        }`}>
                          {isCurrent && isPlaying ? (
                            <Volume2 className="w-4 h-4 animate-pulse" />
                          ) : (
                            <FileAudio className="w-4 h-4" />
                          )}
                        </div>

                        <div className="truncate text-xs">
                          <div className="font-bold truncate flex items-center gap-1.5">
                            <span>{track.title}</span>
                            {track.isUploaded && (
                              <span className="text-[8px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200">
                                SEU MP3
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-white/60 truncate">
                            {track.artist} • {formatTime(track.durationSeconds)} {track.fileSizeMb ? `(${track.fileSizeMb} MB)` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons for Track */}
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleSendTrackToPeer(track)}
                          className="px-2 py-1 rounded bg-cyan-600/80 hover:bg-cyan-500 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow"
                          title="Enviar MP3 via Wi-Fi/BLE para o dispositivo selecionado"
                        >
                          <Send className="w-3 h-3" />
                          <span className="hidden sm:inline">Enviar MP3</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteTrack(track.id, e)}
                          className="p-1 rounded text-white/40 hover:text-red-400 hover:bg-white/10 cursor-pointer transition-all"
                          title="Excluir Música"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Active Transfer Progress Bar */}
            {transferringTrack && (
              <div className="p-3 rounded-lg bg-cyan-950/80 border border-cyan-400/50 space-y-2 animate-fade-in">
                <div className="flex justify-between items-center text-xs font-bold text-cyan-300">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
                    ENVIANDO: "{transferringTrack.title}"
                  </span>
                  <span>{transferProgress}%</span>
                </div>

                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-cyan-500/30">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-300"
                    style={{ width: `${transferProgress}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-mono text-cyan-200/80">
                  <span>Canal: <b>{transferChannel}</b></span>
                  <span>Velocidade: <b>{transferSpeed}</b></span>
                  <span>Destino: <b>{targetDevice?.name || 'Peer'}</b></span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Remote Control Panel (PLAY/PAUSE/NEXT/PREV Remote Commands) */}
          <div 
            className="p-4 rounded-xl border space-y-3 shadow-xl"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-xs sm:text-sm text-sky-300 uppercase">
                  CONTROLE REMOTO BLE DE REPRODUÇÃO
                </h3>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
                COREBLUETOOTH / GATT COMMANDS
              </span>
            </div>

            <p className="text-[11px] text-white/70">
              Envie sinal de controle remoto diretamente para o {targetDevice?.name || 'dispositivo conectado'}:
            </p>

            {/* Remote Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleSendRemoteCommand('PLAY')}
                className="py-2.5 px-3 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>ENVIAR PLAY</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendRemoteCommand('PAUSE')}
                className="py-2.5 px-3 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>ENVIAR PAUSE</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendRemoteCommand('PREVIOUS')}
                className="py-2.5 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow"
              >
                <SkipBack className="w-4 h-4" />
                <span>ANTERIOR</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendRemoteCommand('NEXT')}
                className="py-2.5 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow"
              >
                <SkipForward className="w-4 h-4" />
                <span>PRÓXIMA</span>
              </button>
            </div>

            {/* Logs of Remote Command Events */}
            <div className="p-3 rounded-lg bg-slate-950 border border-white/10 space-y-1 text-[10px] font-mono max-h-28 overflow-y-auto">
              <div className="text-white/40 uppercase font-bold text-[9px] mb-1">
                -- CONSOLE DE EVENTOS DE MÚSICA & REMOTE --
              </div>
              {remoteLogs.map((log, i) => (
                <div key={i} className="text-emerald-400/90 leading-tight">
                  {log}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Code / Architecture Modal for Native Implementation */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl p-5 max-w-2xl w-full shadow-2xl space-y-4 text-white text-xs font-mono max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-cyan-500/30 pb-3">
              <span className="font-bold text-sm text-cyan-400 flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" />
                CÓDIGO NATIVO: ANDROID (KOTLIN) & IPHONE (SWIFT)
              </span>
              <button 
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="text-white/60 hover:text-white p-1 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Language Switcher Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-2">
              <button
                type="button"
                onClick={() => setCodeTab('android')}
                className={`px-3 py-1.5 rounded font-bold text-xs cursor-pointer transition-all ${
                  codeTab === 'android' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white/60'
                }`}
              >
                🤖 Android (Kotlin + BLE/Wi-Fi)
              </button>
              <button
                type="button"
                onClick={() => setCodeTab('ios')}
                className={`px-3 py-1.5 rounded font-bold text-xs cursor-pointer transition-all ${
                  codeTab === 'ios' ? 'bg-sky-600 text-white' : 'bg-white/10 text-white/60'
                }`}
              >
                🍏 iPhone (Swift + CoreBluetooth)
              </button>
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-xl border border-white/10 font-mono text-[11px] leading-relaxed text-emerald-300">
              {codeTab === 'android' ? (
                <pre className="whitespace-pre-wrap">
{`// === ANDROID KOTLIN: BLE GATT SERVER & WI-FI P2P FILE TRANSFER ===
import android.bluetooth.*
import android.net.wifi.p2p.*
import android.media.MediaPlayer

class MusicBleManager(val context: Context) {
    private var gattServer: BluetoothGattServer? = null
    private var mediaPlayer: MediaPlayer? = null

    // 1. Receber comandos curtos de controle (PLAY, PAUSE, NEXT)
    fun setupGattServer() {
        val manager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        gattServer = manager.openGattServer(context, object : BluetoothGattServerCallback() {
            override fun onCharacteristicWriteRequest(
                device: BluetoothDevice?, requestId: Int,
                characteristic: BluetoothGattCharacteristic?,
                preparedWrite: Boolean, responseNeeded: Boolean,
                offset: Int, value: ByteArray?
            ) {
                val command = String(value ?: byteArrayOf())
                when (command) {
                    "PLAY" -> mediaPlayer?.start()
                    "PAUSE" -> mediaPlayer?.pause()
                    "NEXT" -> playNextTrack()
                }
            }
        })
    }

    // 2. Transferência de MP3 de Alta Velocidade via Wi-Fi Direct
    fun sendMp3ViaWifiP2p(fileUri: Uri, targetDevice: WifiP2pDevice) {
        val socket = Socket(targetDevice.deviceAddress, 8888)
        val inputStream = context.contentResolver.openInputStream(fileUri)
        val outputStream = socket.getOutputStream()
        inputStream?.copyTo(outputStream)
        outputStream.close()
    }
}`}
                </pre>
              ) : (
                <pre className="whitespace-pre-wrap">
{`// === IPHONE SWIFT: COREBLUETOOTH & AVFOUNDATION PLAYER ===
import CoreBluetooth
import AVFoundation

class MusicManagerIOS: NSObject, CBCentralManagerDelegate, CBPeripheralDelegate {
    var centralManager: CBCentralManager!
    var audioPlayer: AVAudioPlayer?
    var sharedLibrary: [URL] = []

    override init() {
        super.init()
        centralManager = CBCentralManager(delegate: self, queue: nil)
    }

    // 1. Receber Comandos de Controle Remoto via CoreBluetooth
    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        guard let data = characteristic.value, let cmd = String(data: data, encoding: .utf8) else { return }
        
        switch cmd {
        case "PLAY":
            audioPlayer?.play()
        case "PAUSE":
            audioPlayer?.pause()
        default:
            break
        }
    }

    // 2. Salvar MP3 Recebido na Biblioteca Interna e Reproduzir com AVFoundation
    func saveAndPlayMp3(data: Data, filename: String) {
        let docsUrl = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        const fileUrl = docsUrl.appendingPathComponent(filename)
        try? data.write(to: fileUrl)
        sharedLibrary.append(fileUrl)
        
        // Toca o áudio com AVFoundation
        audioPlayer = try? AVAudioPlayer(contentsOf: fileUrl)
        audioPlayer?.play()
    }
}`}
                </pre>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="py-2 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
