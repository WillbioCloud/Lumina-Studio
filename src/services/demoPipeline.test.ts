import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runSimulatedPipeline } from './demoPipeline';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-10T10:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('runSimulatedPipeline', () => {
  it('emite as 5 etapas no mesmo contrato do stream SSE', async () => {
    const events: Array<{ step: number; message: string }> = [];

    const pipeline = runSimulatedPipeline(
      { mode: 'synthetic', prompt: 'As pirâmides de Gizé', niche: 'historia' },
      (step, message) => events.push({ step, message })
    );

    await vi.runAllTimersAsync();
    const video = await pipeline;

    const steps = events.map((event) => event.step);
    expect(steps[0]).toBe(1);
    expect(steps.at(-1)).toBe(5);
    expect(new Set(steps).size).toBe(5);
    expect(events.every((event) => event.message.length > 0)).toBe(true);

    expect(video.title).toContain('As pirâmides de Gizé');
    expect(video.niche).toBe('historia');
    expect(video.referenceText).toBe('SIMULAÇÃO');
    expect(video.publications.map((publication) => publication.platform)).toEqual([
      'youtube',
      'tiktok',
    ]);
  });

  it('no modo TikTok Shop, ancora o vídeo na oferta e no gancho escolhidos', async () => {
    const events: Array<{ step: number; message: string }> = [];

    const pipeline = runSimulatedPipeline(
      {
        mode: 'shop',
        prompt: 'Garrafa térmica 1L que gela em 6h',
        niche: 'universal',
        offer: 'R$ 39,90 com cupom',
        hookStyle: 'problema-solucao',
      },
      (step, message) => events.push({ step, message })
    );

    await vi.runAllTimersAsync();
    const video = await pipeline;

    expect(events.map((event) => event.step).at(-1)).toBe(5);
    expect(video.title).toContain('Garrafa térmica 1L');
    expect(video.referenceText).toBe('R$ 39,90 com cupom');
    expect(video.script).toContain('Problema → Solução');
    expect(video.script).toContain('R$ 39,90 com cupom');
  });

  it('no modo clipping, usa o nome do arquivo bruto no título', async () => {
    const pipeline = runSimulatedPipeline({
      mode: 'clipping',
      prompt: '',
      niche: 'universal',
      fileName: 'podcast-raw.mp4',
    });

    await vi.runAllTimersAsync();
    const video = await pipeline;

    expect(video.title).toContain('podcast-raw.mp4');
    expect(video.referenceText).toBe('CLIPPING');
  });
});
