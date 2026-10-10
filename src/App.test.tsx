import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-10T10:00:00Z'));
  // backend fora do ar: o health check e o /api/generate devem falhar de forma controlada
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new Error('network down');
    })
  );
  vi.stubGlobal('alert', vi.fn());
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function click(target: HTMLElement) {
  await act(async () => {
    fireEvent.click(target);
  });
}

describe('App • Estúdio de Criação', () => {
  it('liga o Monitor Cognitivo e leva o vídeo ao calendário no modo simulação', async () => {
    render(<App />);

    await click(screen.getByRole('button', { name: /Simulação: off/i }));
    expect(screen.getByRole('button', { name: /Simulação: on/i })).toBeTruthy();

    await click(screen.getByRole('button', { name: /Pirâmides de Gizé/ }));

    // cérebro pulsante + feed cognitivo no lugar do spinner genérico
    const brain = document.querySelector('svg.lucide-brain');
    expect(brain).not.toBeNull();
    expect(brain?.classList.contains('animate-pulse')).toBe(true);
    expect(screen.getByText(/Monitor cognitivo/i)).toBeTruthy();
    // selo "Simulação" do monitor (o toggle da omnibar também leva a palavra)
    expect(screen.getAllByText('Simulação').length).toBeGreaterThan(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });

    // esteira concluída: a aba muda para o calendário com o vídeo novo
    expect(vi.mocked(alert)).not.toHaveBeenCalled();
    expect(screen.getByText('3 Vídeos Produzidos')).toBeTruthy();
    expect(screen.getAllByText('Pirâmides de Gizé (História factual)').length).toBeGreaterThan(0);

    // e o CUI registra a conclusão da corrida
    await click(screen.getByRole('button', { name: /Estúdio de Criação/ }));
    expect(screen.getByText(/gerado com sucesso/i)).toBeTruthy();
    expect(screen.getByText(/Pipeline concluído/i)).toBeTruthy();
  });

  it('no modo TikTok Shop, monta a esteira de venda e leva o vídeo ao calendário', async () => {
    render(<App />);

    await click(screen.getByRole('button', { name: /Simulação: off/i }));
    await click(screen.getByRole('button', { name: /TikTok Shop/ }));

    fireEvent.change(screen.getByPlaceholderText(/Descreva o produto/), {
      target: { value: 'Garrafa térmica 1L que gela em 6h' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Oferta:/), {
      target: { value: 'R$ 39,90 com cupom' },
    });

    await click(screen.getByRole('button', { name: /Enviar Prompt/ }));

    expect(document.querySelector('svg.lucide-brain')).not.toBeNull();
    expect(screen.getAllByText(/vitrine TikTok Shop/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Ficha TikTok Shop')).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });

    expect(vi.mocked(alert)).not.toHaveBeenCalled();
    expect(screen.getByText('3 Vídeos Produzidos')).toBeTruthy();
    expect(screen.getByText('R$ 39,90 com cupom')).toBeTruthy();

    await click(screen.getByRole('button', { name: /Estúdio de Criação/ }));
    expect(screen.getByText(/Criar vídeo de venda para/)).toBeTruthy();
    expect(screen.getByText(/Vídeo de venda pronto para a vitrine/)).toBeTruthy();
  });

  it('com o modo simulação desligado, segue falando com o lumina-backend', async () => {
    render(<App />);

    await click(screen.getByRole('button', { name: /Pirâmides de Gizé/ }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('/api/generate'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(screen.getByText(/Falha ao processar vídeo/i)).toBeTruthy();
  });

  it('no modo TikTok Shop real, chama a rota /api/shop com o payload de venda', async () => {
    render(<App />);

    await click(screen.getByRole('button', { name: /TikTok Shop/ }));
    fireEvent.change(screen.getByPlaceholderText(/Descreva o produto/), {
      target: { value: 'Garrafa térmica 1L que gela em 6h' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Oferta:/), {
      target: { value: 'R$ 39,90 com cupom' },
    });

    await click(screen.getByRole('button', { name: /Enviar Prompt/ }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    const shopCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).endsWith('/api/shop'));
    expect(shopCall).toBeTruthy();

    const body = JSON.parse(String((shopCall?.[1] as RequestInit).body));
    expect(body).toMatchObject({
      product: 'Garrafa térmica 1L que gela em 6h',
      offer: 'R$ 39,90 com cupom',
      hookStyle: 'problema-solucao',
    });
  });
});
