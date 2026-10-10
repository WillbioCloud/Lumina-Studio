import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CognitiveMonitor } from './CognitiveMonitor';
import type { CognitiveActivity } from './CognitiveMonitor';
import { MICRO_TASK_INTERVAL_MS } from '../lib/pipeline';

const STARTED_AT = new Date('2026-10-10T10:00:00Z').getTime();

const streamEvents: CognitiveActivity[] = [
  {
    id: 'sse-1',
    at: STARTED_AT + 1000,
    timestamp: '10:00:01',
    step: 1,
    message: 'Dossiê de pesquisa estruturado',
    source: 'sse',
  },
];

function renderMonitor(overrides: Partial<Parameters<typeof CognitiveMonitor>[0]> = {}) {
  return render(
    <CognitiveMonitor
      active
      mode="synthetic"
      currentStep={1}
      statusMessage="Iniciando geração sintética..."
      activities={streamEvents}
      startedAt={STARTED_AT}
      stepStartedAt={STARTED_AT}
      {...overrides}
    />
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-10T10:00:00Z'));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('CognitiveMonitor', () => {
  it('mostra o cérebro pulsante e o status varrido pelo ShinyText', () => {
    const { container } = renderMonitor();

    const brain = container.querySelector('svg.lucide-brain');
    expect(brain).not.toBeNull();
    expect(brain?.classList.contains('animate-pulse')).toBe(true);

    const status = screen.getByText('Iniciando geração sintética...');
    expect(status.style.animation).toBe('shiny-sweep 1.8s linear infinite');

    expect(screen.getByText('Etapa 1 de 5')).toBeTruthy();
    expect(screen.getByText('Dossiê de Pesquisa Estruturado')).toBeTruthy();
  });

  it('alimenta o feed com o detalhe granular da etapa corrente', async () => {
    renderMonitor();

    expect(screen.getAllByText(/Compilando dossiê de pesquisa estruturado/).length).toBeGreaterThan(
      0
    );
    // ainda sem padrão "n/m": o chip de cena só nasce quando surge uma cena
    expect(screen.queryByText('Cena 1/6')).toBeNull();

    await act(async () => {
      // o relógio interno pula de 500 em 500 ms; 4 intervalos cravam o tick 3
      await vi.advanceTimersByTimeAsync(MICRO_TASK_INTERVAL_MS * 4);
    });

    // a projeção avança até "cena 2/6" e o chip de cena acompanha
    expect(screen.getAllByText(/Roteirizando cena 2\/6/).length).toBeGreaterThan(0);
    expect(screen.getByText('Cena 2/6')).toBeTruthy();
  });

  it('separa evento real do stream de projeção local no contador do feed', () => {
    const { container } = renderMonitor();

    expect(container.textContent).toContain('1 do stream');
    expect(screen.getAllByText('Dossiê de pesquisa estruturado').length).toBeGreaterThan(0);
    // marcador azul (stream) e marcador cinza (projeção) convivem no feed
    expect(container.querySelectorAll('span.bg-blue-500').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('span.bg-slate-300').length).toBeGreaterThan(0);
  });

  it('marca a esteira como simulação quando o backend não é usado', () => {
    renderMonitor({ simulation: true });
    expect(screen.getByText('Simulação')).toBeTruthy();
  });

  it('no modo vitrine, troca a esteira e os artefatos pelos de venda', async () => {
    const { container } = renderMonitor({
      mode: 'shop',
      currentStep: 2,
      statusMessage: 'Roteirizando o vídeo de venda...',
    });

    expect(container.textContent).toContain('vitrine TikTok Shop');
    expect(screen.getByText('Dossiê do Produto')).toBeTruthy();
    expect(screen.getByText('Ficha TikTok Shop')).toBeTruthy();
    expect(screen.getByText(/Vitrine TikTok Shop \(Product-to-Video\)/)).toBeTruthy();
    expect(screen.queryByText('Render Ken Burns 2.5D')).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(MICRO_TASK_INTERVAL_MS * 4);
    });

    expect(screen.getAllByText(/Roteirizando cena 3\/5/).length).toBeGreaterThan(0);
    expect(screen.getByText('Cena 3/5')).toBeTruthy();
  });

  it('concluído, troca o cérebro pelo selo verde e fecha a barra em 100%', () => {
    const { container } = renderMonitor({
      active: false,
      currentStep: 0,
      statusMessage: 'Vídeo renderizado e catalogado',
      activities: [
        ...streamEvents,
        {
          id: 'sse-5',
          at: STARTED_AT + 12000,
          timestamp: '10:00:12',
          step: 5,
          message: 'MP4 9:16 exportado',
          source: 'sse',
        },
      ],
    });

    expect(container.querySelector('svg.lucide-brain')).toBeNull();
    expect(container.querySelector('svg.lucide-check-circle-2')).not.toBeNull();
    expect(screen.getByText('Concluído')).toBeTruthy();

    const bar = container.querySelector('.bg-blue-500.h-full') as HTMLElement | null;
    expect(bar?.style.width).toBe('100%');

    // o histórico da corrida continua visível para auditoria
    expect(screen.getAllByText('MP4 9:16 exportado').length).toBeGreaterThan(0);
    expect(container.textContent).toContain('2 eventos');
  });
});
