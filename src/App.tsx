import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Calendar as CalendarIcon, 
  Settings2, 
  Video, 
  CheckCircle2, 
  Clock, 
  Film, 
  Share2, 
  Menu,
  Scissors,
  Upload
} from 'lucide-react';
import type { VideoItem, TabType, StudioMode, Niche } from './types';
import { MOCK_VIDEOS } from './mocks/videos';
import { generateVideo, clipVideo, checkHealth } from './services/api';

const SYNTHETIC_STEPS = [
  'Roteirização e Cenas com IA (Gemini / Groq)',
  'Síntese de Voz e Sincronização (ElevenLabs / Edge-TTS)',
  'Geração de Imagens Fidedignas (FLUX 1 Schnell)',
  'Renderização Ken Burns 2.5D Estabilizado (FFmpeg)',
  'Exportação e Catálogo Final em 9:16'
];

const CLIPPING_STEPS = [
  'Extração e Compressão Radical de Áudio (16kHz Mono)',
  'Análise de Ganchos e Clímax com Gemini Flash',
  'Corte Sem Perdas (Lossless Stream Copy no FFmpeg)',
  'Enquadramento 9:16 + Ducking de Trilha Sonora',
  'Geração de Legendas Dinâmicas e Vídeo Final'
];

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('studio');
  const [studioMode, setStudioMode] = useState<StudioMode>('synthetic');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [videos, setVideos] = useState<VideoItem[]>(MOCK_VIDEOS);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  // Estados da LUI (Language User Interface) & Omnibar
  const [referenceInput, setReferenceInput] = useState('');
  const [nicheInput, setNicheInput] = useState<Niche>('universal');
  const [voiceInput, setVoiceInput] = useState('pt-BR-AntonioNeural');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backgroundAudioFile, setBackgroundAudioFile] = useState<File | null>(null);

  // Histórico de mensagens do Copiloto / Diretor de IA (CUI)
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    sender: 'ai' | 'user';
    text: string;
    chips?: string[];
  }>>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Olá! Sou o seu Diretor de Produção IA. O que vamos produzir hoje? Digite o tema desejado ou anexe um vídeo para clipping inteligente.',
      chips: [
        '🏛️ Pirâmides de Gizé (História factual)',
        '⚔️ A Queda do Império Romano',
        '🌌 Mistérios dos Buracos Negros',
        '✝️ Salmo 23 (Reflexão devocional)'
      ]
    }
  ]);

  // Logs ao vivo da esteira de produção
  const [productionLogs, setProductionLogs] = useState<Array<{
    timestamp: string;
    step: number;
    message: string;
  }>>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Aguardando comando');
  
  const [isSpaceOnline, setIsSpaceOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const verifyHealth = async () => {
      const online = await checkHealth();
      setIsSpaceOnline(online);
    };
    verifyHealth();
    const interval = setInterval(verifyHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStartGeneration = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || referenceInput;
    if (isGenerating) return;
    if (studioMode === 'synthetic' && !finalPrompt.trim()) return;
    if (studioMode === 'clipping' && !selectedFile) return;

    // Registra a mensagem do usuário no fluxo CUI
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'user',
        text: studioMode === 'synthetic' 
          ? finalPrompt 
          : `Extrair melhores momentos em 9:16 do vídeo: ${selectedFile?.name || 'arquivo bruto'}`
      }
    ]);
    
    setIsGenerating(true);
    setCurrentStep(1);
    const initialStatus = studioMode === 'synthetic' ? 'Iniciando geração sintética...' : 'Comprimindo e analisando filme...';
    setStatusMessage(initialStatus);
    setProductionLogs([
      { timestamp: new Date().toLocaleTimeString(), step: 1, message: initialStatus }
    ]);

    try {
      let newVideo: VideoItem;

      if (studioMode === 'synthetic') {
        newVideo = await generateVideo(
          {
            referenceText: finalPrompt,
            voice: voiceInput,
            niche: nicheInput
          },
          (step, message) => {
            setCurrentStep(step);
            setStatusMessage(message);
            setProductionLogs((prev) => [
              ...prev,
              { timestamp: new Date().toLocaleTimeString(), step, message }
            ]);
          }
        );
      } else {
        newVideo = await clipVideo(
          {
            videoFile: selectedFile!,
            audioTrack: backgroundAudioFile || undefined,
            niche: nicheInput
          },
          (step, message) => {
            setCurrentStep(step);
            setStatusMessage(message);
            setProductionLogs((prev) => [
              ...prev,
              { timestamp: new Date().toLocaleTimeString(), step, message }
            ]);
          }
        );
      }

      setTimeout(() => {
        setVideos((prev) => [newVideo, ...prev]);
        setIsGenerating(false);
        setCurrentStep(0);
        setReferenceInput('');
        setSelectedFile(null);
        setBackgroundAudioFile(null);
        setStatusMessage('Aguardando comando');
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'ai',
            text: `🎬 Vídeo "${newVideo.title}" (${newVideo.referenceText}) gerado com sucesso! Já está disponível na Biblioteca e no Calendário.`
          }
        ]);
        setActiveTab('calendar');
      }, 1200);

    } catch (error: any) {
      console.error(error);
      const errMsg = error.message || 'Erro durante o processamento.';
      alert(errMsg);
      setStatusMessage('Falha na execução');
      setProductionLogs((prev) => [
        ...prev,
        { timestamp: new Date().toLocaleTimeString(), step: -1, message: `Erro: ${errMsg}` }
      ]);
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'ai',
          text: `❌ Falha ao processar vídeo: ${errMsg}`
        }
      ]);
      setIsGenerating(false);
      setCurrentStep(0);
    }
  };

  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'studio', label: 'Estúdio de Criação', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'calendar', label: 'Calendário Notion', icon: <CalendarIcon className="w-4 h-4" /> },
    { id: 'library', label: 'Biblioteca de Vídeos', icon: <Film className="w-4 h-4" />, badge: `${videos.length}` },
    { id: 'distribution', label: 'Canais & Distribuição', icon: <Share2 className="w-4 h-4" /> },
    { id: 'settings', label: 'Configurações', icon: <Settings2 className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-slate-700 flex antialiased">
      {/* SIDEBAR NEUMÓRFICA SOFT UI */}
      <aside className={`bg-[#f0f4f8] border-r border-slate-200/60 shadow-[4px_0_16px_#d8e2ee] flex flex-col sticky top-0 h-screen transition-all duration-300 z-40 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        {/* Brand / Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/50 shrink-0">
          <div className={`flex items-center gap-3 overflow-hidden ${!isSidebarOpen && 'justify-center w-full'}`}>
            <div className="w-8 h-8 shrink-0 rounded-xl neu-blue-accent flex items-center justify-center font-bold text-white text-xs">
              ✝
            </div>
            {isSidebarOpen && (
              <div className="whitespace-nowrap flex flex-col">
                <h1 className="text-sm font-bold tracking-tight text-slate-800 leading-tight">Lumina Studio</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isSpaceOnline ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : isSpaceOnline === false ? 'bg-red-400' : 'bg-blue-400 animate-pulse'}`} />
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                    {isSpaceOnline ? 'HF Space Ativo' : isSpaceOnline === false ? 'HF Space Offline' : 'Conectando...'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? 'neu-pressed text-blue-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 hover:shadow-[3px_3px_8px_#d1dce8,-3px_-3px_8px_#ffffff]'
              }`}
              title={!isSidebarOpen ? item.label : undefined}
            >
              <div className={`${activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}`}>
                {item.icon}
              </div>
              {isSidebarOpen && (
                <div className="flex flex-1 items-center justify-between overflow-hidden">
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.badge && (
                    <span className="neu-pressed text-blue-600 text-[10px] py-0.5 px-2 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Toggle Footer */}
        <div className="p-4 border-t border-slate-200/50">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors ${!isSidebarOpen ? 'justify-center w-full' : ''}`}
            title="Alternar Sidebar"
          >
            <Menu className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="text-sm font-medium">Recolher</span>}
          </button>
        </div>
      </aside>

      {/* Área Central / Conteúdo das Abas */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* ABA 1: LUI (Language User Interface) - Prompt-Driven Studio */}
        {activeTab === 'studio' && (
          <section className="neu-flat rounded-3xl p-6 border border-white/90 flex flex-col h-[calc(100vh-6.5rem)] max-h-[880px]">
            {/* Header da LUI */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl neu-blue-accent flex items-center justify-center text-white font-bold text-sm shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Lumina Copilot • Prompt-to-Video</h2>
                  <p className="text-[11px] text-slate-500">Interface em linguagem natural para geração e recorte por IA.</p>
                </div>
              </div>

              {/* Seletor Rápido de Modo */}
              <div className="neu-pressed p-1 rounded-2xl flex items-center gap-1 border border-white/70">
                <button
                  type="button"
                  onClick={() => setStudioMode('synthetic')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    studioMode === 'synthetic'
                      ? 'neu-flat text-blue-600 shadow-[2px_2px_5px_#cad6e4,-2px_-2px_5px_#ffffff]'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Texto para Vídeo
                </button>
                <button
                  type="button"
                  onClick={() => setStudioMode('clipping')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    studioMode === 'clipping'
                      ? 'neu-flat text-blue-600 shadow-[2px_2px_5px_#cad6e4,-2px_-2px_5px_#ffffff]'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Scissors className="w-3.5 h-3.5" />
                  Clipping Inteligente
                </button>
              </div>
            </div>

            {/* Canvas de Conversação (CUI Feed) */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-7 h-7 rounded-xl neu-flat-sm flex items-center justify-center text-blue-600 text-xs font-bold shrink-0 mt-0.5">
                      IA
                    </div>
                  )}

                  <div className="max-w-[75%] space-y-2">
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'neu-blue-accent text-white font-medium rounded-tr-none'
                          : 'neu-pressed text-slate-700 rounded-tl-none border border-white/60'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Chips de Sugestão de Prompt */}
                    {msg.chips && !isGenerating && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.chips.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => {
                              setReferenceInput(chip.replace(/^[^\s]+\s/, ''));
                              handleStartGeneration(chip.replace(/^[^\s]+\s/, ''));
                            }}
                            className="neu-flat-sm text-[11px] font-semibold text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-xl active:neu-pressed transition-all cursor-pointer border border-white/70"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Status ao Vivo do Pipeline e Logs Embutidos na Conversa */}
              {(isGenerating || productionLogs.length > 0) && (
                <div className="neu-pressed rounded-2xl p-4 border border-white/80 space-y-3.5">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-600">
                    <span className="flex items-center gap-2">
                      {isGenerating ? (
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                      {statusMessage}
                    </span>
                    <span className="neu-flat-sm text-[10px] px-2.5 py-1 rounded-md text-slate-600 border border-white/60 font-semibold">
                      {isGenerating ? `Etapa ${currentStep} de 5` : 'Concluído'}
                    </span>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="w-full neu-flat-sm h-2 rounded-full overflow-hidden p-0.5">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${isGenerating ? (currentStep / 5) * 100 : 100}%` }}
                    />
                  </div>

                  {/* Lista das 5 Etapas da Esteira de Produção */}
                  <div className="pt-2 border-t border-slate-200/50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Esteira: {studioMode === 'synthetic' ? 'Pipeline Sintético' : 'Motor de Cortes (Long-to-Shorts)'}
                    </span>
                    <ul className="space-y-2">
                      {(studioMode === 'synthetic' ? SYNTHETIC_STEPS : CLIPPING_STEPS).map((stepLabel, idx) => {
                        const stepNum = idx + 1;
                        const isActive = isGenerating && currentStep === stepNum;
                        const isPast = !isGenerating || currentStep > stepNum;
                        
                        return (
                          <li
                            key={stepNum}
                            className={`flex items-center gap-2.5 text-xs transition-colors ${
                              isActive
                                ? 'text-blue-600 font-bold'
                                : isPast
                                ? 'text-emerald-600 font-medium'
                                : 'text-slate-400'
                            }`}
                          >
                            {isPast ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] shrink-0 transition-all ${
                                  isActive
                                    ? 'neu-pressed text-blue-600 font-bold border border-blue-400/40'
                                    : 'neu-flat-sm text-slate-400'
                                }`}
                              >
                                {stepNum}
                              </span>
                            )}
                            <span className={isActive ? 'font-semibold' : ''}>{stepLabel}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Terminal de Logs ao Vivo da Geração */}
                  {productionLogs.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200/50">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isGenerating ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
                          Logs de Produção (SSE Stream)
                        </span>
                        <span className="text-[9px] font-normal text-slate-400 lowercase">{productionLogs.length} eventos</span>
                      </div>
                      <div className="bg-slate-900 text-slate-200 rounded-xl p-3 font-mono text-[10px] max-h-32 overflow-y-auto space-y-1 select-text shadow-inner">
                        {productionLogs.map((log, i) => (
                          <div key={i} className="flex items-start gap-2 leading-relaxed">
                            <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                            {log.step > 0 && (
                              <span className="text-blue-400 shrink-0 font-semibold">Etapa {log.step}:</span>
                            )}
                            <span className={log.step === -1 ? 'text-red-400' : 'text-slate-200'}>{log.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* OMNIBAR / PROMPT BOX CENTRAL (Componente Visual de Entrada) */}
            <div className="shrink-0 neu-pressed rounded-3xl p-3 border border-white/80 space-y-2.5">
              {/* Arquivo Anexado (Se houver) */}
              {selectedFile && (
                <div className="flex items-center justify-between neu-flat-sm px-3 py-1.5 rounded-xl text-xs">
                  <span className="font-semibold text-slate-700 truncate max-w-xs">
                    📹 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-slate-400 hover:text-red-500 font-bold ml-2 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Input Textarea Multi-linha */}
              <textarea
                rows={2}
                value={referenceInput}
                onChange={(e) => setReferenceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleStartGeneration();
                  }
                }}
                disabled={isGenerating}
                placeholder={
                  studioMode === 'synthetic'
                    ? "Descreva seu vídeo... (Ex: As Pirâmides de Gizé, explorando a época e os mistérios de construção)"
                    : "Digite instruções adicionais para o recorte ou anexe o vídeo abaixo..."
                }
                className="w-full bg-transparent border-0 outline-none text-xs text-slate-800 placeholder-slate-400 resize-none px-1"
              />

              {/* Barra de Ações e Configurações Inline da Omnibar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/50">
                <div className="flex items-center gap-1.5">
                  {/* Botão de Anexo para Vídeo / Áudio (Modo Clipping) */}
                  <label
                    title="Anexar vídeo para corte"
                    className="neu-flat-sm p-2 rounded-xl text-slate-500 hover:text-blue-600 cursor-pointer active:neu-pressed transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      disabled={isGenerating}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          setStudioMode('clipping');
                        }
                      }}
                    />
                  </label>

                  {/* Chip de Nicho */}
                  <select
                    value={nicheInput}
                    onChange={(e) => setNicheInput(e.target.value as Niche)}
                    disabled={isGenerating}
                    className="neu-flat-sm text-[11px] font-semibold text-slate-600 px-2.5 py-1.5 rounded-xl border border-white/60 outline-none cursor-pointer"
                  >
                    <option value="universal">Nicho: Universal / Geral</option>
                    <option value="historia">Nicho: História & Civilizações</option>
                    <option value="curiosidades">Nicho: Curiosidades & Ciência</option>
                    <option value="filosofia">Nicho: Filosofia & Estoicismo</option>
                    <option value="cinema">Nicho: Cinema & Séries</option>
                    <option value="biblico">Nicho: Devocional Bíblico</option>
                  </select>

                  {/* Chip de Voz (Para Modo Sintético) */}
                  {studioMode === 'synthetic' && (
                    <select
                      value={voiceInput}
                      onChange={(e) => setVoiceInput(e.target.value)}
                      disabled={isGenerating}
                      className="neu-flat-sm text-[11px] font-semibold text-slate-600 px-2.5 py-1.5 rounded-xl border border-white/60 outline-none cursor-pointer"
                    >
                      <option value="pt-BR-AntonioNeural">Voz: Antônio (Grave / Sóbrio)</option>
                      <option value="pt-BR-FranciscaNeural">Voz: Francisca (Suave / Narrativa)</option>
                      <option value="pt-BR-ThalitaNeural">Voz: Thalita (Dinâmica / Jovem)</option>
                    </select>
                  )}
                </div>

                {/* Botão de Ação / Envio da Omnibar */}
                <button
                  type="button"
                  onClick={() => handleStartGeneration()}
                  disabled={
                    isGenerating ||
                    (studioMode === 'synthetic' ? !referenceInput.trim() : !selectedFile)
                  }
                  className="neu-blue-accent px-4 py-2 rounded-2xl text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md"
                >
                  {isGenerating ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Enviar Prompt
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ABA 2: Calendário de Postagens (Estilo Notion) */}
        {activeTab === 'calendar' && (
          <section className="neu-flat rounded-2xl p-6 border border-white/80">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-800">Cronograma de Conteúdo</h2>
                <p className="text-xs text-slate-500">Vídeos sincronizados e prontos para distribuição.</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-600 neu-pressed px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-blue-500" />
                  {videos.length} Vídeos Produzidos
                </span>
              </div>
            </div>

            {/* Grid de Vídeos / Cards Neumórficos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {videos.map((vid) => (
                <article
                  key={vid.id}
                  onClick={() => setSelectedVideo(vid)}
                  className="neu-flat rounded-2xl overflow-hidden cursor-pointer transition-all hover:translate-y-[-2px] border border-white/60 group"
                >
                  {/* Thumbnail / Header do Card */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-200">
                    <img
                      src={vid.thumbnailUrl}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-80" />
                    <span className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur text-[11px] font-mono px-2 py-0.5 rounded text-white font-medium">
                      0:{vid.durationSeconds.toString().padStart(2, '0')}
                    </span>
                    <span className="absolute top-2 left-2 neu-flat-sm text-[10px] text-blue-600 font-bold px-2 py-0.5 rounded-lg border border-white/70">
                      {vid.referenceText}
                    </span>
                  </div>

                  {/* Informações */}
                  <div className="p-4 space-y-3">
                    <h3 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {vid.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {vid.script}
                    </p>

                    {/* Badges de Publicação */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/60 text-xs">
                      <div className="flex items-center gap-1.5">
                        {vid.publications.map((pub) => (
                          <span
                            key={pub.platform}
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 ${
                              pub.status === 'published'
                                ? 'bg-emerald-50 text-emerald-600 shadow-[inset_1px_1px_3px_#c2edd6]'
                                : 'neu-pressed text-slate-500'
                            }`}
                          >
                            {pub.platform === 'youtube' ? 'YouTube' : 'TikTok'}
                            {pub.status === 'published' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          </span>
                        ))}
                      </div>

                      <span className="text-[11px] text-slate-400 font-mono">
                        {vid.scheduledDate}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ABA: Biblioteca de Vídeos */}
        {activeTab === 'library' && (
          <section className="neu-flat rounded-2xl p-6 border border-white/80 overflow-hidden flex flex-col h-full max-h-[80vh]">
            <div className="flex items-center justify-between mb-5 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-800">Biblioteca Completa</h2>
                <p className="text-xs text-slate-500">Todos os vídeos já gerados e armazenados.</p>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-2xl neu-pressed p-2 border border-white/70">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-[#f0f4f8]/95 sticky top-0 z-10 text-xs uppercase text-slate-500 border-b border-slate-200/60 backdrop-blur-sm">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Título</th>
                    <th className="px-4 py-3 font-semibold">Referência</th>
                    <th className="px-4 py-3 font-semibold text-center">Duração</th>
                    <th className="px-4 py-3 font-semibold">Data</th>
                    <th className="px-4 py-3 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50">
                  {videos.map(vid => (
                    <tr key={vid.id} className="hover:bg-white/60 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={vid.thumbnailUrl} alt="Thumb" className="w-10 h-10 rounded-lg object-cover neu-flat-sm border border-white/60" />
                          <span className="font-semibold text-slate-800 line-clamp-1">{vid.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="neu-flat-sm text-[10px] px-2.5 py-1 rounded-md text-blue-600 font-bold whitespace-nowrap">
                          {vid.referenceText}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-mono text-slate-500">
                        0:{vid.durationSeconds.toString().padStart(2, '0')}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {vid.scheduledDate}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => setSelectedVideo(vid)}
                          className="text-xs neu-flat-sm text-blue-600 font-semibold px-3 py-1.5 rounded-lg active:neu-pressed transition-all cursor-pointer"
                        >
                          Inspecionar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {videos.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">
                        Nenhum vídeo na biblioteca.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ABA: Canais & Distribuição */}
        {activeTab === 'distribution' && (
          <section className="neu-flat rounded-2xl p-6 border border-white/80">
            <h2 className="text-base font-bold text-slate-800 mb-1">Gestão de Canais</h2>
            <p className="text-xs text-slate-500 mb-6">Status das conexões de publicação externa.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 rounded-2xl neu-flat border border-white/80">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl neu-flat-sm flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">YouTube Shorts</h3>
                      <span className="text-[10px] text-slate-400">OAuth 2.0 (Autenticado)</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 shadow-[inset_1px_1px_3px_#c2edd6] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Conectado
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Conexão direta configurada para publicação de Shorts. O upload é feito via API oficial com privacidade configurada como Público.
                </p>
                <div className="flex justify-end">
                  <button className="text-xs text-slate-700 font-medium neu-flat-sm px-3.5 py-1.5 rounded-lg active:neu-pressed transition-all">
                    Reautenticar
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-2xl neu-flat border border-white/80">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl neu-flat-sm flex items-center justify-center">
                      <svg className="w-5 h-5 text-cyan-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v8.12c-.01 2.64-1.12 5.25-3.1 7.02-2.12 1.9-5.18 2.63-8.01 1.96-2.88-.68-5.32-2.85-6.3-5.63-1.01-2.91-.32-6.27 1.83-8.52 2.02-2.11 5.06-3.08 7.89-2.52v4.06c-1.18-.32-2.48-.12-3.48.58-.96.67-1.56 1.8-1.59 2.99-.02 1.19.53 2.34 1.45 3.05 1.05.8 2.51.98 3.75.52 1.25-.47 2.14-1.62 2.29-2.92.1-1.02.04-2.05.04-3.07V.02z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">TikTok</h3>
                      <span className="text-[10px] text-slate-400">Ponte via Buffer + Sheets</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 shadow-[inset_1px_1px_3px_#c2edd6] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ativo
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Sistema de esteira híbrida: O Google Sheets atua como webhook que dispara o Buffer para publicar na conta do TikTok vinculada.
                </p>
                <div className="flex justify-end">
                  <button className="text-xs text-slate-700 font-medium neu-flat-sm px-3.5 py-1.5 rounded-lg active:neu-pressed transition-all">
                    Testar Webhook
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ABA 3: Conexões e Monitoramento */}
        {activeTab === 'settings' && (
          <section className="neu-flat rounded-2xl p-6 border border-white/80">
            <h2 className="text-base font-bold text-slate-800 mb-1">Status das Conexões e Limites</h2>
            <p className="text-xs text-slate-500 mb-6">Monitore quotas diárias e serviços intermediários.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl neu-flat border border-white/80">
                <span className="text-xs font-semibold text-slate-500 block mb-1">YouTube Data API v3</span>
                <p className="text-lg font-bold text-slate-800 mb-2">4 / 6 Vídeos</p>
                <div className="w-full neu-pressed h-2 rounded-full overflow-hidden p-0.5">
                  <div className="bg-red-400 h-full rounded-full w-[66%]" />
                </div>
                <span className="text-[11px] text-slate-400 mt-2 block font-medium">Quota: 6.400 / 10.000 pts</span>
              </div>

              <div className="p-5 rounded-2xl neu-flat border border-white/80">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Google Drive (Cofre MP4)</span>
                <p className="text-lg font-bold text-slate-800 mb-2">2.4 GB / 15 GB</p>
                <div className="w-full neu-pressed h-2 rounded-full overflow-hidden p-0.5">
                  <div className="bg-blue-500 h-full rounded-full w-[16%]" />
                </div>
                <span className="text-[11px] text-slate-400 mt-2 block font-medium">16% de armazenamento usado</span>
              </div>

              <div className="p-5 rounded-2xl neu-flat border border-white/80">
                <span className="text-xs font-semibold text-slate-500 block mb-1">TikTok / Buffer / Zapier</span>
                <p className="text-lg font-bold text-emerald-600 mb-2">Conectado</p>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  Esteira via Planilha Google Sheets ativa.
                </span>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Modal de Inspeção e Player 9:16 (Neumorphism Branco e Azul) */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="neu-flat rounded-3xl max-w-3xl w-full overflow-hidden border border-white/90 shadow-[14px_14px_30px_#cad6e4,-14px_-14px_30px_#ffffff] flex flex-col md:flex-row">
            {/* Player Vertical 9:16 */}
            <div className="w-full md:w-5/12 bg-slate-900 flex items-center justify-center p-4">
              <div className="w-full aspect-[9/16] rounded-2xl overflow-hidden shadow-inner">
                <video
                  src={selectedVideo.videoUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Metadados e Ações */}
            <div className="w-full md:w-7/12 p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-3 py-1 rounded-full neu-flat-sm text-blue-600">
                    {selectedVideo.referenceText}
                  </span>
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="text-xs text-slate-400 hover:text-slate-800 cursor-pointer px-2 py-1 rounded-lg transition-colors"
                  >
                    Fechar ✕
                  </button>
                </div>

                <h3 className="text-base font-bold text-slate-800">
                  {selectedVideo.title}
                </h3>

                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Roteiro e Narração
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed neu-pressed p-3.5 rounded-xl border border-white/60 max-h-36 overflow-y-auto">
                    {selectedVideo.script}
                  </p>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Destinos de Publicação
                  </h4>
                  <div className="space-y-2">
                    {selectedVideo.publications.map((p) => (
                      <div
                        key={p.platform}
                        className="flex items-center justify-between text-xs neu-flat-sm p-3 rounded-xl border border-white/70"
                      >
                        <span className="capitalize font-semibold text-slate-700">
                          {p.platform}
                        </span>
                        {p.externalUrl ? (
                          <a
                            href={p.externalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 font-bold hover:underline text-[11px]"
                          >
                            Assistir no App ↗
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-medium">Agendado</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedVideo(null)}
                  className="px-5 py-2.5 rounded-xl neu-blue-accent text-xs font-bold text-white transition-all active:scale-[0.98] cursor-pointer"
                >
                  Concluído
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;