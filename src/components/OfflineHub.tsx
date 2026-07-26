import React, { useState, useRef, useEffect } from 'react';
import { StudioSettings, ChatMsg } from '../types';
import { THEMES } from '../utils/theme';
import { playButtonClick } from '../utils/soundEffects';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { 
  Send, 
  Mic, 
  MicOff, 
  Paperclip, 
  Download, 
  Trash2, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  WifiOff,
  Radio,
  FolderKanban,
  MessageSquare,
  ShieldAlert,
  MapPin,
  Maximize2,
  Minimize2,
  Play
} from 'lucide-react';

interface OfflineHubProps {
  settings: StudioSettings;
  messages: ChatMsg[];
  onSendMessage: (text: string) => void;
  onDeleteMessage: (index: number) => void;
  files: any[];
  onFileUpload: (file: File) => void;
  onDeleteFile: (fileName: string) => void;
  peerSosData?: any;
  sosActive?: boolean;
  gpsData?: { lat: number; lng: number; acc: number; time: string } | null;
  onStopSos?: () => void;
}

export const OfflineHub: React.FC<OfflineHubProps> = ({
  settings,
  messages,
  onSendMessage,
  onDeleteMessage,
  files,
  onFileUpload,
  onDeleteFile,
  peerSosData,
  sosActive,
  gpsData,
  onStopSos,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [activeMediaModal, setActiveMediaModal] = useState<{ url: string; type: 'image' | 'video' | 'audio'; title: string } | null>(null);
  const [expandedMediaMsgs, setExpandedMediaMsgs] = useState<Record<number, boolean>>({});
  
  // Mobile tab toggle: 'chat' or 'files'
  const [mobileSubTab, setMobileSubTab] = useState<'chat' | 'files'>('chat');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const theme = THEMES[settings.theme];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, mobileSubTab]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    playButtonClick(settings.soundEnabled);
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const startVoiceRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const voiceFile = new File([audioBlob], `audio_voz_${Date.now()}.webm`, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        onFileUpload(voiceFile);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      alert('Acesso ao microfone negado ou indisponível.');
    }
  };

  const cancelVoiceRecord = () => {
    if (!isRecording) return;
    if (mediaRecorderRef.current) {
      // Unset onstop to prevent file upload
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  const stopVoiceRecord = () => {
    if (!isRecording) return;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden font-mono text-xs">
      {/* Mobile Sub-Navigation Header */}
      <div className="md:hidden flex items-center border-b p-1 bg-black/60 shrink-0" style={{ borderColor: theme.border }}>
        <button
          onClick={() => setMobileSubTab('chat')}
          className={`flex-1 py-1.5 font-bold text-center rounded flex items-center justify-center gap-1.5 text-[11px] transition-all ${
            mobileSubTab === 'chat'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
              : 'opacity-60 text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat P2P ({messages.length})</span>
        </button>

        <button
          onClick={() => setMobileSubTab('files')}
          className={`flex-1 py-1.5 font-bold text-center rounded flex items-center justify-center gap-1.5 text-[11px] transition-all ${
            mobileSubTab === 'files'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
              : 'opacity-60 text-white'
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>Arquivos LAN ({files.length})</span>
        </button>
      </div>

      {/* Main Chat Area */}
      <section 
        className={`flex-1 flex flex-col border-r overflow-hidden h-full ${
          mobileSubTab === 'chat' ? 'flex' : 'hidden md:flex'
        }`}
        style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}
      >
        {/* Chat Header */}
        <div 
          className="p-2.5 sm:p-3 border-b flex justify-between items-center shrink-0"
          style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}
        >
          <div className="flex items-center gap-2 truncate">
            <Radio className="w-4 h-4 text-sky-400 animate-pulse shrink-0" />
            <span className="font-bold uppercase tracking-wider text-xs sm:text-sm truncate">
              Chat P2P Local (Sem Internet)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-emerald-400 shrink-0 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="hidden sm:inline">REDE LAN ATIVA</span>
            <span className="sm:hidden">LAN</span>
          </div>
        </div>

        {/* Live My Active SOS Horizontal Banner */}
        {sosActive && gpsData && (
          <div className="bg-red-500/20 border-b border-red-500/60 p-2 sm:p-2.5 px-3 text-red-300 text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0 animate-pulse">
            <div className="flex items-start sm:items-center gap-2 w-full sm:w-auto">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5 sm:mt-0" />
              <div className="text-[11px] sm:text-xs leading-relaxed space-y-0.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-white font-bold uppercase">🚨 TRANSMISSÃO SOS AO VIVO</span>
                  <span className="opacity-80 font-mono text-[10px] text-amber-300">
                    📅 {gpsData.date || new Date().toLocaleDateString('pt-BR')} • 🕒 {gpsData.time}
                  </span>
                </div>
                <div className="font-mono text-white text-[11px] sm:text-xs whitespace-normal break-words flex flex-wrap items-center gap-x-2">
                  <span>Lat: <strong className="text-emerald-400">{gpsData.lat.toFixed(6)}</strong></span>
                  <span className="text-red-400">|</span>
                  <span>Lng: <strong className="text-emerald-400">{gpsData.lng.toFixed(6)}</strong></span>
                  <span className="opacity-80 text-[10px] font-normal text-white/80">(±{gpsData.acc.toFixed(0)}m)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0 self-end sm:self-center">
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${gpsData.lat},${gpsData.lng}`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold shadow-xs cursor-pointer flex items-center gap-1 transition-all shrink-0"
              >
                <MapPin className="w-3 h-3" />
                <span>MAPA</span>
              </a>
              {onStopSos && (
                <button
                  onClick={() => { playButtonClick(settings.soundEnabled); onStopSos(); }}
                  className="px-2 py-1 bg-white/20 hover:bg-white/35 text-white rounded text-[10px] font-bold cursor-pointer transition-all shrink-0"
                >
                  PARAR SOS
                </button>
              )}
            </div>
          </div>
        )}

        {/* SOS Alert Banner for Peer */}
        {peerSosData && (
          <div className="bg-red-500/20 border-b border-red-500/50 p-2 text-red-300 text-xs font-bold flex items-center justify-between animate-pulse shrink-0">
            <span>🚨 ALERTA SOS REGISTRADO ({peerSosData.date || new Date().toLocaleDateString('pt-BR')} {peerSosData.time})</span>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${peerSosData.lat},${peerSosData.lng}`}
              target="_blank"
              rel="noreferrer"
              className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] hover:bg-red-700 shrink-0"
            >
              VER MAPA
            </a>
          </div>
        )}

        {/* Chat Messages Feed */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 hide-scrollbar">
          {messages.length === 0 && (
            <div className="text-center my-8 opacity-50 flex flex-col items-center gap-2">
              <WifiOff className="w-8 h-8 text-sky-400" />
              <span>Nenhuma mensagem ainda. Digite algo para testar a comunicação offline.</span>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isMe = msg.sender === 'Me';
            const isRawSos = msg.text.startsWith('🚨EMERGENCIA🚨|');
            const hasFile = !!msg.file;
            const isExpanded = !!expandedMediaMsgs[idx];

            // Truncate long auto-generated text for files to prevent huge cards
            const formattedText = (() => {
              if (hasFile) {
                if (msg.text.startsWith('Arquivo enviado:')) {
                  if (msg.file?.isAudio) return '🎙️ Áudio de Voz';
                  if (msg.file?.isVideo) return '📹 Vídeo';
                  if (msg.file?.isImage) return '📷 Foto / Imagem';
                  return `📄 ${msg.file?.name.length > 20 ? msg.file.name.substring(0, 18) + '...' : msg.file?.name}`;
                }
                if (msg.text.length > 38 && !isExpanded) {
                  return msg.text.substring(0, 35) + '...';
                }
              }
              return msg.text;
            })();

            const isAudioMsg = Boolean(msg.file?.isAudio && msg.file?.url);

            return (
              <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`p-2 sm:p-2.5 rounded-2xl border space-y-1 transition-all shadow-sm ${
                    isAudioMsg
                      ? isMe 
                        ? 'bg-[#8B5CF6] border-purple-400/30 text-white rounded-tr-xs' 
                        : 'bg-[#2E2C40] border-white/10 text-white rounded-tl-xs'
                      : hasFile && !isExpanded 
                        ? 'w-fit max-w-[250px] sm:max-w-[280px] rounded-lg' 
                        : 'max-w-[88%] sm:max-w-[80%] rounded-lg'
                  } ${
                    isRawSos 
                      ? 'bg-red-500/20 border-red-500/50 text-red-200'
                      : !isAudioMsg && (isMe 
                        ? 'bg-sky-500/10 border-sky-500/40 text-white' 
                        : 'bg-white/5 border-white/10 text-white')
                  }`}
                >
                  {!isAudioMsg && (
                    <div className="flex justify-between items-center text-[10px] opacity-60 gap-2">
                      <span className="font-bold truncate">{isMe ? 'Você' : msg.sender}</span>
                      <span className="shrink-0">{msg.timestamp || 'Agora'}</span>
                    </div>
                  )}

                  {isRawSos ? (() => {
                    const parts = msg.text.split('|');
                    const lat = parts[1] || '';
                    const lng = parts[2] || '';
                    const acc = parts[3] || '';
                    const time = parts[4] || msg.timestamp || '';
                    return (
                      <div className="space-y-1 pt-0.5">
                        <div className="flex items-center gap-1 font-bold text-red-400 text-xs">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          <span>Alerta SOS ({time})</span>
                        </div>
                        <div className="text-[11px] font-mono text-white/90">
                          Lat: {lat}, Lng: {lng} (±{acc}m)
                        </div>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold"
                        >
                          <MapPin className="w-3 h-3" /> VER NO MAPA
                        </a>
                      </div>
                    );
                  })() : !(msg.file?.isAudio && msg.text.startsWith('Arquivo enviado:')) ? (
                    <div className="text-xs font-semibold truncate leading-tight">{formattedText}</div>
                  ) : null}

                  {/* Audio File Message (Telegram Style Voice Player) */}
                  {msg.file?.isAudio && msg.file.url && (
                    <div className="pt-0.5">
                      <VoiceMessagePlayer
                        url={msg.file.url}
                        fileName={msg.file.name || 'audio_voz.webm'}
                        isMe={isMe}
                        timestamp={msg.timestamp || 'Agora'}
                      />
                    </div>
                  )}

                  {/* Video Preview */}
                  {msg.file?.isVideo && msg.file.url && (
                    <div className="pt-1">
                      {isExpanded ? (
                        <div className="rounded-lg overflow-hidden border border-white/20 max-w-xs sm:max-w-sm space-y-1 bg-black/50 p-1.5">
                          <video controls playsInline src={msg.file.url} className="w-full max-h-56 rounded object-contain bg-black" />
                          <div className="flex justify-between items-center px-1 py-0.5 text-[10px]">
                            <span className="text-purple-300 font-bold flex items-center gap-1">
                              <Video className="w-3 h-3" /> Vídeo Ampliado
                            </span>
                            <div className="flex items-center gap-2">
                              <a
                                href={msg.file.url}
                                download={msg.file.name || 'video.mp4'}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                                title="Baixar vídeo"
                              >
                                <Download className="w-3 h-3" /> Baixar
                              </a>
                              <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMediaModal({ url: msg.file!.url!, type: 'video', title: msg.file!.name || 'Vídeo' }); }}
                                className="text-sky-400 hover:underline flex items-center gap-1 font-bold"
                              >
                                <Maximize2 className="w-3 h-3" /> Tela Cheia
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpandedMediaMsgs(p => ({ ...p, [idx]: false })); }}
                                className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
                              >
                                <Minimize2 className="w-3 h-3" /> Reduzir
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group rounded-md overflow-hidden border border-white/20 w-36 sm:w-40 h-24 bg-black/70 flex flex-col justify-between p-1">
                          <video src={msg.file.url} muted playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none" />
                          <div className="relative z-10 flex justify-between items-center">
                            <span className="text-[8px] bg-black/80 px-1 py-0.5 rounded text-purple-300 font-bold flex items-center gap-0.5 border border-purple-500/30">
                              <Video className="w-2.5 h-2.5" /> Vídeo
                            </span>
                            <div className="flex items-center gap-1">
                              <a
                                href={msg.file.url}
                                download={msg.file.name || 'video.mp4'}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded text-[9px] font-bold shadow-xs cursor-pointer flex items-center gap-0.5"
                                title="Baixar vídeo"
                              >
                                <Download className="w-2.5 h-2.5" />
                              </a>
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpandedMediaMsgs(p => ({ ...p, [idx]: true })); }}
                                className="p-1 bg-purple-600/90 hover:bg-purple-600 text-white rounded text-[9px] font-bold shadow-xs cursor-pointer flex items-center gap-0.5"
                                title="Aumentar no chat"
                              >
                                <Maximize2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                          <div className="relative z-10 flex justify-center items-center my-auto">
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMediaModal({ url: msg.file!.url!, type: 'video', title: msg.file!.name || 'Vídeo' }); }}
                              className="p-2 bg-purple-600/90 hover:bg-purple-500 rounded-full text-white shadow-lg cursor-pointer transition-transform group-hover:scale-110 flex items-center gap-1"
                              title="Reproduzir em Tela Cheia"
                            >
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Image Preview */}
                  {msg.file?.isImage && msg.file.url && (
                    <div className="pt-1">
                      {isExpanded ? (
                        <div className="rounded-lg overflow-hidden border border-white/20 max-w-xs sm:max-w-sm space-y-1 bg-black/50 p-1.5">
                          <img src={msg.file.url} alt={msg.file.name} className="w-full max-h-56 object-contain rounded bg-black/60" />
                          <div className="flex justify-between items-center px-1 py-0.5 text-[10px]">
                            <span className="text-emerald-300 font-bold flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" /> Foto Ampliada
                            </span>
                            <div className="flex items-center gap-2">
                              <a
                                href={msg.file.url}
                                download={msg.file.name || 'foto.jpg'}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                                title="Baixar foto"
                              >
                                <Download className="w-3 h-3" /> Baixar
                              </a>
                              <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMediaModal({ url: msg.file!.url!, type: 'image', title: msg.file!.name || 'Imagem' }); }}
                                className="text-sky-400 hover:underline flex items-center gap-1 font-bold"
                              >
                                <Maximize2 className="w-3 h-3" /> Tela Cheia
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpandedMediaMsgs(p => ({ ...p, [idx]: false })); }}
                                className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
                              >
                                <Minimize2 className="w-3 h-3" /> Reduzir
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={(e) => { e.preventDefault(); setActiveMediaModal({ url: msg.file!.url!, type: 'image', title: msg.file!.name || 'Imagem' }); }}
                          className="relative group rounded-md overflow-hidden border border-white/20 w-36 sm:w-40 h-24 bg-black/70 flex flex-col justify-between p-1 cursor-pointer hover:border-emerald-400/50 transition-all"
                        >
                          <img src={msg.file.url} alt={msg.file.name} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          <div className="relative z-10 flex justify-between items-center">
                            <span className="text-[8px] bg-black/80 px-1 py-0.5 rounded text-emerald-300 font-bold flex items-center gap-0.5 border border-emerald-500/30">
                              <ImageIcon className="w-2.5 h-2.5" /> Foto
                            </span>
                            <div className="flex items-center gap-1">
                              <a
                                href={msg.file.url}
                                download={msg.file.name || 'foto.jpg'}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded text-[9px] font-bold shadow-xs cursor-pointer flex items-center gap-0.5"
                                title="Baixar foto"
                              >
                                <Download className="w-2.5 h-2.5" />
                              </a>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setExpandedMediaMsgs(p => ({ ...p, [idx]: true })); }}
                                className="p-1 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded text-[9px] font-bold shadow-xs cursor-pointer flex items-center gap-0.5"
                                title="Aumentar no chat"
                              >
                                <Maximize2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isMe && (
                    <div className="text-right pt-1">
                      <button 
                        onClick={() => onDeleteMessage(idx)}
                        className="text-[10px] text-red-400 hover:underline cursor-pointer"
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div 
          className="p-2 sm:p-3 border-t flex items-center gap-1.5 sm:gap-2 shrink-0 min-h-[52px]"
          style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}
        >
          {isRecording ? (
            /* Telegram Recording Bar */
            <div className="flex-1 flex items-center justify-between bg-black/60 px-3 py-1.5 sm:py-2 rounded-full border border-red-500/40 animate-pulse gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                <span className="font-mono text-red-400 font-bold text-xs sm:text-sm">
                  {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')},0
                </span>
              </div>

              <button
                type="button"
                onClick={cancelVoiceRecord}
                className="text-sky-400 hover:text-sky-300 font-bold tracking-wider uppercase text-xs sm:text-sm cursor-pointer transition-colors px-2 py-0.5 rounded hover:bg-white/10"
              >
                CANCELAR
              </button>

              <button
                type="button"
                onClick={stopVoiceRecord}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sky-500 hover:bg-sky-400 text-black flex items-center justify-center shrink-0 shadow-md cursor-pointer transition-transform active:scale-90"
                title="Concluir e Enviar Áudio"
              >
                <Send className="w-4 h-4 fill-current ml-0.5" />
              </button>
            </div>
          ) : (
            /* Standard Message Bar */
            <>
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escreva uma mensagem..."
                className="flex-1 min-w-0 bg-black/40 border px-3 py-1.5 sm:py-2 rounded-full text-white text-xs focus:outline-none focus:border-sky-400 placeholder:text-white/40"
                style={{ borderColor: theme.border }}
              />

              {/* Voice Record Button */}
              <button
                type="button"
                onClick={startVoiceRecord}
                className="p-2 rounded-full border border-sky-500/40 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 cursor-pointer transition-all shrink-0"
                title="Gravar Áudio de Voz (Estilo Telegram)"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* File Upload Trigger */}
              <label className="p-2 rounded-full border bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer transition-all shrink-0">
                <Paperclip className="w-4 h-4" />
                <input type="file" onChange={handleFileSelect} className="hidden" />
              </label>

              {/* Send Button */}
              <button 
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full font-bold bg-sky-500 text-black hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center justify-center shrink-0 text-xs shadow-md"
                title="Enviar Mensagem"
              >
                <Send className="w-4 h-4 fill-current ml-0.5" />
              </button>
            </>
          )}
        </div>
      </section>

      {/* Files & LAN Storage Sidebar */}
      <aside 
        className={`w-full md:w-80 flex-col border-t md:border-t-0 shrink-0 h-full ${
          mobileSubTab === 'files' ? 'flex' : 'hidden md:flex'
        }`}
        style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}
      >
        <div 
          className="p-3 border-b flex justify-between items-center shrink-0"
          style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}
        >
          <span className="font-bold uppercase tracking-wider text-xs">
            Servidor de Arquivos LAN
          </span>
          <span className="text-[10px] text-amber-400 font-bold">{files.length} Itens</span>
        </div>

        {/* Upload Button */}
        <div className="p-3 border-b space-y-2 shrink-0" style={{ borderColor: theme.border }}>
          <label className="w-full py-2 px-3 rounded border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 font-bold text-center block cursor-pointer transition-all text-xs">
            + Enviar Arquivo para a Rede
            <input type="file" onChange={handleFileSelect} className="hidden" />
          </label>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 hide-scrollbar">
          {files.length === 0 && (
            <div className="text-center opacity-50 py-6">Nenhum arquivo na pasta compartilhada.</div>
          )}

          {files.map((fileObj, idx) => {
            const fileName = fileObj.name || fileObj;
            return (
              <div 
                key={idx}
                className="p-2.5 rounded border flex flex-col gap-1.5 bg-black/20 hover:bg-black/40 transition-all"
                style={{ borderColor: theme.border }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 truncate pr-2">
                    {fileObj.isImage ? <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" /> :
                     fileObj.isVideo ? <Video className="w-4 h-4 text-purple-400 shrink-0" /> :
                     fileObj.isAudio ? <Music className="w-4 h-4 text-amber-400 shrink-0" /> :
                     <FileText className="w-4 h-4 text-sky-400 shrink-0" />}
                    <span className="font-bold truncate" title={fileName}>{fileName}</span>
                  </div>
                  <button 
                    onClick={() => onDeleteFile(fileName)}
                    className="text-red-400 hover:text-red-300 p-1 shrink-0 cursor-pointer"
                    title="Excluir arquivo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {fileObj.url && (
                  <div className="flex justify-end gap-2 text-[10px] pt-1 border-t border-white/10">
                    <a 
                      href={fileObj.url} 
                      download={fileName}
                      className="text-sky-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Download className="w-3 h-3" /> Baixar
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Lightbox / Media Modal */}
      {activeMediaModal && (
        <div 
          onClick={() => setActiveMediaModal(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="max-w-3xl w-full bg-neutral-900 border border-white/20 p-3 sm:p-4 rounded-xl space-y-3 shadow-2xl relative"
          >
            <div className="flex justify-between items-center text-white font-bold border-b border-white/10 pb-2.5">
              <span className="truncate pr-2 text-xs sm:text-sm font-mono text-sky-400">{activeMediaModal.title}</span>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={activeMediaModal.url}
                  download={activeMediaModal.title || 'midia'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar
                </a>
                <button 
                  type="button"
                  onClick={() => setActiveMediaModal(null)} 
                  className="text-white/70 hover:text-white text-xs px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 font-bold cursor-pointer"
                >
                  ✕ Fechar
                </button>
              </div>
            </div>
            {activeMediaModal.type === 'image' && (
              <img src={activeMediaModal.url} alt={activeMediaModal.title} className="w-full max-h-[75vh] object-contain rounded-lg" />
            )}
            {activeMediaModal.type === 'video' && (
              <video controls playsInline autoPlay src={activeMediaModal.url} className="w-full max-h-[75vh] object-contain rounded-lg bg-black" />
            )}
            {activeMediaModal.type === 'audio' && (
              <div className="py-8 flex flex-col items-center justify-center gap-4 bg-black/50 rounded-lg border border-white/10">
                <Music className="w-12 h-12 text-amber-400 animate-pulse" />
                <span className="text-xs text-white/80 font-mono">Reprodução de Áudio Ampliada</span>
                <audio controls autoPlay src={activeMediaModal.url} className="w-full max-w-md" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

