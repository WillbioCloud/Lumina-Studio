import { useEffect, useState } from 'react';
import type { ComponentType, SVGProps } from 'react';
import {
  Activity,
  AudioLines,
  Brain,
  Captions,
  CheckCircle2,
  CloudUpload,
  FileSearch,
  Film,
  Images,
  ListChecks,
  Mic,
  PenLine,
  Scissors,
  ShoppingBag,
  Terminal,
  Timer,
} from 'lucide-react';
import { ShinyText } from './ShinyText';
import {
  MICRO_TASKS,
  MICRO_TASK_INTERVAL_MS,
  PIPELINE_STEPS,
  SYNTHETIC_STEPS,
} from '../lib/pipeline';
import type { StudioMode } from '../types';

/* ------------------------------------------------------------------ */
/* Tipos do feed                                                       */
/* ------------------------------------------------------------------ */

export type ActivitySource = 'sse' | 'estimated';

export interface CognitiveActivity {
  id: string;
  /** epoch ms — ordena eventos reais e projeções dentro da mesma etapa */
  at: number;
  timestamp: string;
  step: number;
  message: string;
  source: ActivitySource;
}

export interface CognitiveMonitorProps {
  active: boolean;
  mode: StudioMode;
  currentStep: number;
  statusMessage: string;
  /** eventos que vieram do stream (SSE) ou da simulação local */
  activities: CognitiveActivity[];
  /** epoch ms do início da corrida atual (0 quando não há corrida) */
  startedAt: number;
  /** epoch ms do início da etapa corrente */
  stepStartedAt: number;
  /** true quando a esteira é a simulação local (backend offline) */
  simulation?: boolean;
}

interface Artifact {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
}

const ARTIFACTS: Record<StudioMode, Artifact[]> = {
  synthetic: [
    { icon: FileSearch, label: 'Dossiê de Pesquisa Estruturado' },
    { icon: Mic, label: 'Narração Sintetizada' },
    { icon: Images, label: 'Keyframes 9:16' },
    { icon: Film, label: 'Render Ken Burns 2.5D' },
    { icon: CloudUpload, label: 'MP4 no Cofre + Catálogo' },
  ],
  clipping: [
    { icon: AudioLines, label: 'Áudio 16 kHz Mono' },
    { icon: Activity, label: 'Mapa de Ganchos & Clímax' },
    { icon: Scissors, label: 'Corte Sem Perdas' },
    { icon: Film, label: 'Enquadramento 9:16 + Ducking' },
    { icon: ListChecks, label: 'Legendas Dinâmicas' },
  ],
  shop: [
    { icon: FileSearch, label: 'Dossiê do Produto' },
    { icon: PenLine, label: 'Roteiro de Conversão' },
    { icon: Captions, label: 'Voz + Legendas' },
    { icon: Images, label: 'Cenas do Produto' },
    { icon: ShoppingBag, label: 'Ficha TikTok Shop' },
  ],
};

const MODE_LABELS: Record<StudioMode, string> = {
  synthetic: 'pipeline sintético',
  clipping: 'motor de cortes',
  shop: 'vitrine TikTok Shop',
};

const CLOCK_TICK_MS = 500;

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Projeção determinística das micro-tarefas: deriva do relógio da corrida,
 * sem acumular estado. Enquanto a etapa avança, novas linhas entram no feed;
 * ao concluir, o feed permanece com o histórico da corrida.
 */
function buildProjections(
  mode: StudioMode,
  limitStep: number,
  tick: number,
  startedAt: number
): CognitiveActivity[] {
  const steps = MICRO_TASKS[mode] ?? MICRO_TASKS.synthetic;
  const projections: CognitiveActivity[] = [];
  let cursor = 0;

  for (let stepIndex = 0; stepIndex < steps.length; stepIndex += 1) {
    const step = stepIndex + 1;
    if (step > limitStep) break;

    const tasks = steps[stepIndex];
    for (let taskIndex = 0; taskIndex < tasks.length; taskIndex += 1) {
      if (step === limitStep && taskIndex > tick) break;
      const at = startedAt + cursor * MICRO_TASK_INTERVAL_MS;
      projections.push({
        id: `projection-${step}-${taskIndex}`,
        at,
        timestamp: new Date(at).toLocaleTimeString(),
        step,
        message: tasks[taskIndex],
        source: 'estimated',
      });
      cursor += 1;
    }
  }

  return projections;
}

/**
 * Monitor Cognitivo Neumórfico.
 *
 * Substitui o spinner genérico de carregamento: o "cérebro" do agente pulsa em
 * alto-relevo, o status é varrido pelo ShinyText e o feed mostra o detalhe
 * granular do que a IA está montando naquele instante.
 *
 * Nada aqui inventa dado do backend: eventos do stream entram com marcador azul
 * e contam como "stream"; as micro-tarefas derivadas do relógio local são
 * marcadas como "projeção".
 */
export function CognitiveMonitor({
  active,
  mode,
  currentStep,
  statusMessage,
  activities,
  startedAt,
  stepStartedAt,
  simulation = false,
}: CognitiveMonitorProps) {
  const stepLabels = PIPELINE_STEPS[mode] ?? SYNTHETIC_STEPS;
  const artifacts = ARTIFACTS[mode] ?? ARTIFACTS.synthetic;
  const totalSteps = stepLabels.length;

  // Único relógio do componente: congelado quando a esteira não está ativa
  const [now, setNow] = useState(() => new Date().getTime());

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(new Date().getTime()), CLOCK_TICK_MS);
    return () => window.clearInterval(id);
  }, [active, startedAt]);

  const elapsed = startedAt > 0 ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
  const tick =
    stepStartedAt > 0 ? Math.floor(Math.max(0, now - stepStartedAt) / MICRO_TASK_INTERVAL_MS) : 0;

  // Etapa mais avançada relatada pelo stream (sobrevive ao reset pós-conclusão)
  const peakStep = activities.reduce((max, activity) => Math.max(max, activity.step), 0);
  const limitStep = active ? Math.max(currentStep, 1) : peakStep;

  const projections = buildProjections(mode, limitStep, tick, startedAt);
  const traces = [...activities, ...projections].sort((a, b) => {
    const stepA = a.step === -1 ? Number.MAX_SAFE_INTEGER : a.step;
    const stepB = b.step === -1 ? Number.MAX_SAFE_INTEGER : b.step;
    if (stepA !== stepB) return stepA - stepB;
    return a.at - b.at;
  });

  const microTasks = MICRO_TASKS[mode]?.[Math.max(currentStep, 1) - 1] ?? [];
  const activeMicroTask =
    active && microTasks.length > 0
      ? microTasks[Math.min(tick, microTasks.length - 1)]
      : null;

  const subProgress = microTasks.length > 1 ? Math.min(tick / (microTasks.length - 1), 1) : 1;
  const percent = active
    ? Math.min(96, Math.round((((Math.max(currentStep, 1) - 1 + subProgress) / totalSteps) * 100)))
    : 100;

  let sceneInfo: { current: number; total: number } | null = null;
  for (let i = traces.length - 1; i >= 0; i -= 1) {
    const match = traces[i].message.match(/(\d+)\s*\/\s*(\d+)/);
    if (match && Number(match[2]) >= 2) {
      sceneInfo = { current: Number(match[1]), total: Number(match[2]) };
      break;
    }
  }

  const streamCount = activities.filter((activity) => activity.step > 0).length;

  return (
    <section
      aria-live="polite"
      className="neu-pressed rounded-2xl p-4 border border-white/80 space-y-3.5"
    >
      {/* 1. Cabeçalho: cérebro pulsante + status com brilho */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`neu-flat-sm w-11 h-11 rounded-2xl flex items-center justify-center border border-white/70 shrink-0 ${
              active ? 'neu-cognitive' : ''
            }`}
          >
            {active ? (
              <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            )}
          </div>

          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {active
                ? `Monitor cognitivo • ${MODE_LABELS[mode] ?? MODE_LABELS.synthetic}`
                : 'Pipeline concluído'}
            </span>
            <div className="mt-0.5 leading-tight min-w-0 break-words">
              <ShinyText
                text={statusMessage}
                disabled={!active}
                color="#475569"
                shineColor="#2563eb"
                speed={1.8}
                className="text-sm"
              />
            </div>
            {activeMicroTask && (
              <div className="mt-1 flex items-center gap-1.5 min-w-0 break-words">
                <Activity className="w-3 h-3 text-blue-500 shrink-0" />
                <ShinyText
                  text={activeMicroTask}
                  color="#64748b"
                  shineColor="#2563eb"
                  speed={2.6}
                  className="text-[11px] font-medium"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="neu-flat-sm text-[10px] px-2.5 py-1 rounded-md text-slate-600 border border-white/60 font-semibold">
            {active ? `Etapa ${currentStep} de ${totalSteps}` : 'Concluído'}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
            <Timer className="w-3 h-3" />
            {formatElapsed(elapsed)}
          </span>
          {simulation && (
            <span className="neu-pressed text-[9px] px-2 py-0.5 rounded-md text-amber-600 font-bold uppercase tracking-wide border border-white/60">
              Simulação
            </span>
          )}
        </div>
      </div>

      {/* 2. Barra de progresso com brilho percorrendo */}
      <div className="w-full neu-flat-sm h-2 rounded-full overflow-hidden p-0.5">
        <div className="relative h-full overflow-hidden rounded-full">
          <div
            className="bg-blue-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
          {active && (
            <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent cognitive-bar-sheen" />
          )}
        </div>
      </div>

      {/* 3. Cadeia de artefatos que a IA está montando */}
      <div className="flex flex-wrap items-center gap-1.5">
        {artifacts.map((artifact, idx) => {
          const stepNum = idx + 1;
          const done = !active || currentStep > stepNum;
          const isCurrent = active && currentStep === stepNum;
          const Icon = artifact.icon;

          return (
            <span
              key={artifact.label}
              title={artifact.label}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors max-w-full ${
                isCurrent
                  ? 'neu-flat-sm text-blue-600 border-blue-300/60'
                  : done
                    ? 'neu-pressed text-emerald-600 border-white/60'
                    : 'neu-pressed text-slate-400 border-white/60'
              }`}
            >
              <Icon className="w-3 h-3 shrink-0" />
              {artifact.label}
              {done && <CheckCircle2 className="w-3 h-3 shrink-0" />}
            </span>
          );
        })}

        {sceneInfo && (
          <span className="neu-flat-sm text-[10px] font-mono text-blue-600 px-2.5 py-1 rounded-lg border border-white/60">
            Cena {sceneInfo.current}/{sceneInfo.total}
          </span>
        )}
      </div>

      {/* 4. Feed do raciocínio do agente */}
      {traces.length > 0 && (
        <div className="pt-2 border-t border-slate-200/50">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  active ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'
                }`}
              />
              Feed cognitivo
            </span>
            <span className="text-[9px] font-normal normal-case tracking-normal text-slate-400">
              {streamCount} do stream • {traces.length - streamCount} projeç
              {traces.length - streamCount === 1 ? 'ão' : 'ões'}
            </span>
          </div>

          <div className="neu-pressed rounded-xl p-3 max-h-36 overflow-y-auto space-y-1.5 border border-white/60 flex flex-col-reverse">
            {traces
              .slice()
              .reverse()
              .map((trace) => (
                <div
                  key={trace.id}
                  className="cognitive-feed-item flex items-start gap-2 text-[11px] leading-relaxed min-w-0"
                >
                  <span className="text-slate-400 font-mono shrink-0">[{trace.timestamp}]</span>
                  <span
                    className={`mt-[5px] w-1.5 h-1.5 rounded-full shrink-0 ${
                      trace.step === -1
                        ? 'bg-red-500'
                        : trace.source === 'sse'
                          ? 'bg-blue-500'
                          : 'bg-slate-300'
                    }`}
                  />
                  {trace.step > 0 && (
                    <span className="text-blue-600 font-bold shrink-0">Etapa {trace.step}:</span>
                  )}
                  <span
                    className={`min-w-0 break-words ${
                      trace.step === -1
                        ? 'text-red-500 font-medium'
                        : trace.source === 'sse'
                          ? 'text-slate-700 font-medium'
                          : 'text-slate-500'
                    }`}
                  >
                    {trace.message}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 5. Esteira: as 5 etapas do pipeline */}
      <div className="pt-2 border-t border-slate-200/50">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Esteira:{' '}
          {mode === 'synthetic'
            ? 'Pipeline Sintético'
            : mode === 'clipping'
              ? 'Motor de Cortes (Long-to-Shorts)'
              : 'Vitrine TikTok Shop (Product-to-Video)'}
        </span>
        <ul className="space-y-2">
          {stepLabels.map((stepLabel, idx) => {
            const stepNum = idx + 1;
            const isActive = active && currentStep === stepNum;
            const isPast = !active || currentStep > stepNum;

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

      {/* 6. Terminal cru do stream (preservado) */}
      {activities.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-200/50">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3 h-3" />
              Logs de Produção (SSE Stream)
            </span>
            <span className="text-[9px] font-normal text-slate-400 lowercase">
              {activities.length} eventos
            </span>
          </div>
          <div className="bg-slate-900 text-slate-200 rounded-xl p-3 font-mono text-[10px] max-h-32 overflow-y-auto space-y-1 select-text shadow-inner">
            {activities.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed min-w-0">
                <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                {log.step > 0 && (
                  <span className="text-blue-400 shrink-0 font-semibold">Etapa {log.step}:</span>
                )}
                <span
                  className={`min-w-0 break-words ${log.step === -1 ? 'text-red-400' : 'text-slate-200'}`}
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default CognitiveMonitor;
