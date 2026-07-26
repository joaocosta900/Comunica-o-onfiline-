import React, { useState } from 'react';
import { StudioSettings, EmergencyContact, PublicAgency } from '../types';
import { THEMES } from '../utils/theme';
import { playSosMorseCode, playButtonClick } from '../utils/soundEffects';
import { 
  AlertTriangle, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  ShieldAlert, 
  PhoneCall,
  Users,
  MessageSquare,
  Send,
  Copy,
  Check
} from 'lucide-react';

const PUBLIC_AGENCIES: PublicAgency[] = [
  { label: "Polícia Militar (190)", number: "190", desc: "Crimes em andamento, agressões, ameaças à vida e roubos." },
  { label: "SAMU (192)", number: "192", desc: "Urgências médicas, acidentes graves, problemas cardíacos, traumas." },
  { label: "Corpo de Bombeiros (193)", number: "193", desc: "Incêndios, resgates, acidentes de trânsito com vítimas presas." },
  { label: "Defesa Civil (199)", number: "199", desc: "Desastres naturais, desabamentos, enchentes, risco de desmoronamento." },
  { label: "Polícia Rod. Federal (191)", number: "191", desc: "Acidentes e crimes nas rodovias federais." },
  { label: "Polícia Civil (197)", number: "197", desc: "Investigações, informações sobre crimes já ocorridos." },
  { label: "Disque Denúncia (181)", number: "181", desc: "Denúncias anônimas de crimes, tráfico e esconderijos." },
  { label: "CVV (188)", number: "188", desc: "Apoio emocional e prevenção do suicídio (24h)." },
  { label: "Delegacia da Mulher (180)", number: "180", desc: "Denúncias de violência contra a mulher." },
];

interface SosModuleProps {
  settings: StudioSettings;
  sosActive: boolean;
  onActivateSos: () => void;
  onStopSos: () => void;
  gpsData: { lat: number; lng: number; acc: number; time: string } | null;
  gpsStatus: string;
  contacts: EmergencyContact[];
  onSaveContacts: (contacts: EmergencyContact[]) => void;
  customMessage: string;
  onCustomMessageChange: (msg: string) => void;
  broadcastToChat: boolean;
  onBroadcastToChatChange: (val: boolean) => void;
  onTestSos: () => void;
}

export const SosModule: React.FC<SosModuleProps> = ({
  settings,
  sosActive,
  onActivateSos,
  onStopSos,
  gpsData,
  gpsStatus,
  contacts,
  onSaveContacts,
  customMessage,
  onCustomMessageChange,
  broadcastToChat,
  onBroadcastToChatChange,
  onTestSos,
}) => {
  const [newContact, setNewContact] = useState({ name: '', number: '', description: '' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Mobile tab toggle: 'trigger' or 'contacts'
  const [mobileSubTab, setMobileSubTab] = useState<'trigger' | 'contacts'>('trigger');

  const theme = THEMES[settings.theme];

  const buildAlertMessage = () => {
    let msg = customMessage.trim() || 'Preciso de assistência imediata. Esta é uma transmissão de emergência.';
    if (gpsData) {
      msg += `\n\n📍 Minha Localização GPS Atual:\nhttps://www.google.com/maps/search/?api=1&query=${gpsData.lat},${gpsData.lng}\nLatitude: ${gpsData.lat.toFixed(6)}, Longitude: ${gpsData.lng.toFixed(6)}`;
    }
    return msg;
  };

  const handleSendWhatsApp = (number: string) => {
    playButtonClick(settings.soundEnabled);
    const digits = number.replace(/\D/g, '');
    if (!digits) return;
    const cleanNumber = (digits.length === 10 || digits.length === 11) ? '55' + digits : digits;
    const text = buildAlertMessage();
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSendSms = (number: string) => {
    playButtonClick(settings.soundEnabled);
    const cleanNumber = number.replace(/[^\d+]/g, '');
    if (!cleanNumber) return;
    const text = buildAlertMessage();
    window.open(`sms:${cleanNumber}?body=${encodeURIComponent(text)}`, '_self');
  };

  const handleCall = (number: string) => {
    playButtonClick(settings.soundEnabled);
    const cleanNumber = number.replace(/[^\d+]/g, '');
    if (!cleanNumber) return;
    window.location.href = `tel:${cleanNumber}`;
  };

  const handleCopyAlertMessage = () => {
    playButtonClick(settings.soundEnabled);
    const text = buildAlertMessage();
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleToggleSos = () => {
    if (sosActive) {
      onStopSos();
    } else {
      if (settings.soundEnabled) {
        playSosMorseCode(true);
      }
      onActivateSos();
    }
  };

  const handleAddOrEditContact = () => {
    if (!newContact.name || !newContact.number) return;
    playButtonClick(settings.soundEnabled);

    if (editingIndex !== null) {
      const updated = [...contacts];
      updated[editingIndex] = { ...updated[editingIndex], ...newContact };
      onSaveContacts(updated);
      setEditingIndex(null);
    } else {
      onSaveContacts([...contacts, { ...newContact, active: true }]);
    }
    setNewContact({ name: '', number: '', description: '' });
  };

  const handleRemoveContact = (index: number) => {
    playButtonClick(settings.soundEnabled);
    onSaveContacts(contacts.filter((_, i) => i !== index));
  };

  const handleToggleContactActive = (index: number) => {
    playButtonClick(settings.soundEnabled);
    const updated = [...contacts];
    updated[index].active = !updated[index].active;
    onSaveContacts(updated);
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden font-mono text-xs">
      {/* Mobile Sub-Navigation Header */}
      <div className="md:hidden flex items-center border-b p-1 bg-black/60 shrink-0" style={{ borderColor: theme.border }}>
        <button
          onClick={() => setMobileSubTab('trigger')}
          className={`flex-1 py-1.5 font-bold text-center rounded flex items-center justify-center gap-1.5 text-[11px] transition-all ${
            mobileSubTab === 'trigger'
              ? 'bg-red-500/25 text-red-300 border border-red-500/50'
              : 'opacity-60 text-white'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span>Ativar SOS & GPS</span>
        </button>

        <button
          onClick={() => setMobileSubTab('contacts')}
          className={`flex-1 py-1.5 font-bold text-center rounded flex items-center justify-center gap-1.5 text-[11px] transition-all ${
            mobileSubTab === 'contacts'
              ? 'bg-red-500/25 text-red-300 border border-red-500/50'
              : 'opacity-60 text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-red-400" />
          <span>Contatos ({contacts.length})</span>
        </button>
      </div>

      {/* Main SOS Trigger Center */}
      <section 
        className={`flex-1 p-3 sm:p-6 flex-col items-center border-r overflow-y-auto space-y-4 sm:space-y-6 h-full ${
          mobileSubTab === 'trigger' ? 'flex' : 'hidden md:flex'
        }`}
        style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}
      >
        <div className="text-center space-y-1.5 max-w-lg shrink-0 pt-1">
          <h2 className="text-lg sm:text-2xl font-bold text-red-500 tracking-wider uppercase flex items-center justify-center gap-2">
            <ShieldAlert className="w-5 h-5 sm:w-7 sm:h-7 animate-bounce shrink-0 text-red-500" />
            <span>Módulo de Emergência & SOS</span>
          </h2>
          <p className="text-[11px] sm:text-xs opacity-70">
            Transmissão de coordenadas geográficas via GPS para contatos salvos e rede local.
          </p>
        </div>

        {/* Big SOS Button */}
        <div className="flex flex-col items-center gap-3 my-2 shrink-0">
          <button
            onClick={handleToggleSos}
            className={`w-44 h-44 sm:w-60 sm:h-60 rounded-full border-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 shadow-2xl ${
              sosActive
                ? 'border-white bg-red-600 text-white animate-pulse shadow-red-500/80 ring-8 ring-red-500/30'
                : 'border-red-500 bg-red-500/10 hover:bg-red-500/20 text-red-500 shadow-red-500/20'
            }`}
          >
            <AlertTriangle className={`w-10 h-10 sm:w-12 sm:h-12 mb-1 sm:mb-2 ${sosActive ? 'animate-bounce' : ''}`} />
            <span className="text-xl sm:text-2xl font-bold tracking-wider">
              {sosActive ? 'CANCELAR SOS' : 'ATIVAR SOS'}
            </span>
            <span className="text-[9px] sm:text-[10px] opacity-80 mt-1">
              {sosActive ? 'Transmitindo Alerta...' : 'Toque para Ativar'}
            </span>
          </button>

          {/* Broadcast Option */}
          <label className="flex items-center gap-2 cursor-pointer opacity-90 hover:opacity-100 text-center text-[11px] sm:text-xs max-w-xs sm:max-w-none">
            <input 
              type="checkbox" 
              checked={broadcastToChat}
              onChange={(e) => onBroadcastToChatChange(e.target.checked)}
              className="accent-red-500 cursor-pointer w-4 h-4 shrink-0"
            />
            <span>Transmitir coordenadas para o Chat P2P Local durante SOS</span>
          </label>
        </div>

        {/* GPS Live Info Box */}
        <div 
          className="w-full max-w-lg p-3 sm:p-4 rounded border space-y-2 bg-black/40 shrink-0"
          style={{ borderColor: theme.border }}
        >
          <div className="flex justify-between items-center text-xs border-b pb-2 border-white/10">
            <span className="font-bold flex items-center gap-1.5 text-emerald-400">
              <MapPin className="w-4 h-4" /> Localização GPS
            </span>
            <span className="text-[10px] opacity-70 truncate">{gpsStatus}</span>
          </div>

          {gpsData ? (
            <div className="space-y-2 text-xs text-emerald-300 pt-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div>Latitude: <span className="font-bold text-white">{gpsData.lat.toFixed(6)}</span></div>
                <div>Longitude: <span className="font-bold text-white">{gpsData.lng.toFixed(6)}</span></div>
                <div>Data: <span className="font-bold text-white">{gpsData.date || new Date().toLocaleDateString('pt-BR')}</span></div>
                <div>Horário: <span className="font-bold text-white">{gpsData.time}</span></div>
                <div>Precisão: <span className="font-bold text-white">±{gpsData.acc.toFixed(0)}m</span></div>
              </div>

              <div className="pt-1">
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${gpsData.lat},${gpsData.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 rounded bg-emerald-500/20 border border-emerald-500 text-emerald-300 font-bold hover:bg-emerald-500/30 text-center block transition-all text-xs"
                >
                  📍 Abrir Minha Localização no Google Maps
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-3 opacity-50 text-[11px]">
              Aguardando ativação para obter coordenadas GPS...
            </div>
          )}
        </div>

        {/* Test Trigger */}
        <div className="w-full max-w-lg shrink-0 pb-4">
          <button
            onClick={onTestSos}
            className="w-full py-2 px-4 rounded border border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold transition-all cursor-pointer text-xs"
          >
            🧪 Testar Simulação de Envio de SOS
          </button>
        </div>
      </section>

      {/* Emergency Contacts Management Sidebar */}
      <aside 
        className={`w-full md:w-96 p-3 sm:p-4 flex-col border-t md:border-t-0 space-y-3 sm:space-y-4 overflow-y-auto shrink-0 h-full ${
          mobileSubTab === 'contacts' ? 'flex' : 'hidden md:flex'
        }`}
        style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}
      >
        <div className="flex justify-between items-center border-b pb-2.5 border-white/10 shrink-0">
          <span className="font-bold uppercase tracking-wider text-xs sm:text-sm text-red-400">
            Contatos de Emergência
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 font-bold">
            {contacts.length} Salvos
          </span>
        </div>

        {/* Custom Message Input */}
        <div className="space-y-1 shrink-0">
          <label className="text-[11px] opacity-80 block font-bold">Mensagem Personalizada de Alerta</label>
          <textarea 
            value={customMessage}
            onChange={(e) => onCustomMessageChange(e.target.value)}
            rows={2}
            className="w-full bg-black/40 border p-2 rounded text-white text-xs focus:outline-none focus:border-red-500 resize-none"
            style={{ borderColor: theme.border }}
          />
        </div>

        {/* Add/Edit Form */}
        <div className="space-y-2 p-2.5 sm:p-3 rounded border bg-black/30 shrink-0" style={{ borderColor: theme.border }}>
          <span className="font-bold text-[11px] block">
            {editingIndex !== null ? 'Editar Contato' : 'Adicionar Novo Contato'}
          </span>
          <input 
            type="text" 
            placeholder="Nome (Ex: Maria)"
            value={newContact.name}
            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
            className="w-full bg-black/50 border p-1.5 rounded text-white text-xs focus:outline-none focus:border-red-400"
            style={{ borderColor: theme.border }}
          />
          <input 
            type="tel" 
            placeholder="Número de Telefone (+55...)"
            value={newContact.number}
            onChange={(e) => setNewContact({ ...newContact, number: e.target.value })}
            className="w-full bg-black/50 border p-1.5 rounded text-white text-xs focus:outline-none focus:border-red-400"
            style={{ borderColor: theme.border }}
          />

          {/* Quick Presets Dropdown */}
          <details className="border rounded bg-black/50 text-[11px]" style={{ borderColor: theme.border }}>
            <summary className="p-2 cursor-pointer font-bold opacity-80 hover:opacity-100 select-none">
              Sugestões de Serviços Públicos (190, 192, 193...)
            </summary>
            <div className="max-h-40 overflow-y-auto p-2 space-y-1 border-t border-white/10 hide-scrollbar">
              {PUBLIC_AGENCIES.map((agency) => (
                <div 
                  key={agency.label}
                  onClick={() => setNewContact({ name: agency.label, number: agency.number, description: agency.desc })}
                  className="p-1.5 rounded hover:bg-white/10 cursor-pointer flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-red-300">{agency.label}</div>
                    <div className="text-[9px] opacity-70">{agency.desc}</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 shrink-0">Usar</span>
                </div>
              ))}
            </div>
          </details>

          <div className="flex gap-2 pt-1">
            <button 
              onClick={handleAddOrEditContact}
              className="flex-1 py-1.5 rounded bg-red-500 text-white font-bold hover:bg-red-600 transition-all cursor-pointer flex items-center justify-center gap-1 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              {editingIndex !== null ? 'Salvar Edição' : 'Adicionar Contato'}
            </button>
            {editingIndex !== null && (
              <button 
                onClick={() => setEditingIndex(null)}
                className="px-3 py-1.5 rounded border border-white/20 text-white hover:bg-white/10 text-xs cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Batch Actions for Selected Contacts */}
        {contacts.some(c => c.active) && (
          <div className="p-2.5 rounded border border-red-500/50 bg-red-950/40 space-y-2 shrink-0">
            <div className="flex justify-between items-center text-[11px] font-bold text-red-300">
              <span className="flex items-center gap-1">
                🚨 Disparar Alerta p/ {contacts.filter(c => c.active).length} Selecionado(s)
              </span>
              <button
                type="button"
                onClick={handleCopyAlertMessage}
                className="flex items-center gap-1 text-[10px] text-sky-300 hover:text-sky-200 cursor-pointer transition-colors"
                title="Copiar texto da mensagem + link GPS"
              >
                {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copySuccess ? 'Copiado!' : 'Copiar Texto + GPS'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const activeContacts = contacts.filter(c => c.active);
                  if (activeContacts.length > 0) {
                    handleSendWhatsApp(activeContacts[0].number);
                  }
                }}
                className="py-1.5 px-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow"
                title="Abrir WhatsApp com a mensagem de emergência preenchida"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Enviar WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const activeContacts = contacts.filter(c => c.active);
                  if (activeContacts.length > 0) {
                    handleSendSms(activeContacts[0].number);
                  }
                }}
                className="py-1.5 px-2 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow"
                title="Enviar SMS com o alerta de emergência"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar SMS</span>
              </button>
            </div>
          </div>
        )}

        {/* Contacts List */}
        <div className="space-y-2 flex-1 overflow-y-auto hide-scrollbar pb-4">
          {contacts.length === 0 && (
            <div className="text-center opacity-50 py-6 text-xs">Nenhum contato de emergência cadastrado.</div>
          )}

          {contacts.map((contact, idx) => (
            <div 
              key={idx}
              className={`p-2.5 rounded border flex flex-col gap-2 transition-all ${
                contact.active 
                  ? 'bg-red-950/25 border-red-500/50 shadow-sm' 
                  : 'bg-black/30 border-white/10 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-white text-xs select-none">
                  <input 
                    type="checkbox" 
                    checked={contact.active} 
                    onChange={() => handleToggleContactActive(idx)}
                    className="accent-red-500 cursor-pointer w-4 h-4 shrink-0"
                  />
                  <span className="truncate">{contact.name}</span>
                </label>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button 
                    type="button"
                    onClick={() => { setEditingIndex(idx); setNewContact(contact); }} 
                    className="p-1 text-sky-400 hover:text-sky-300 hover:bg-white/10 rounded cursor-pointer transition-colors"
                    title="Editar Contato"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleRemoveContact(idx)} 
                    className="p-1 text-red-400 hover:text-red-300 hover:bg-white/10 rounded cursor-pointer transition-colors"
                    title="Excluir Contato"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] font-mono pl-6">
                <span className="text-emerald-300 font-bold">{contact.number}</span>
              </div>

              {contact.description && (
                <div className="text-[10px] opacity-70 pl-6 line-clamp-2">{contact.description}</div>
              )}

              {/* Action Buttons for sending message / calling this specific contact */}
              <div className="flex items-center gap-1.5 pl-6 pt-1">
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(contact.number)}
                  className="flex-1 py-1.5 px-2 rounded bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                  title={`Enviar WhatsApp para ${contact.name}`}
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendSms(contact.number)}
                  className="flex-1 py-1.5 px-2 rounded bg-sky-600/90 hover:bg-sky-500 text-white font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                  title={`Enviar SMS para ${contact.name}`}
                >
                  <Send className="w-3 h-3" />
                  <span>SMS</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCall(contact.number)}
                  className="py-1.5 px-2.5 rounded bg-amber-600/90 hover:bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                  title={`Ligar para ${contact.name}`}
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>Ligar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};

