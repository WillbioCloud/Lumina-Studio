import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShinyText } from './ShinyText';

describe('ShinyText', () => {
  it('varre as letras com a keyframe shiny-sweep na paleta clara/azul', () => {
    render(
      <ShinyText
        text="Sintetizando Narração"
        color="#475569"
        shineColor="#2563eb"
        speed={1.8}
      />
    );

    const el = screen.getByText('Sintetizando Narração');
    const style = el.getAttribute('style') ?? '';

    expect(el.style.animation).toBe('shiny-sweep 1.8s linear infinite');
    // jsdom normaliza hex para rgb
    expect(style).toContain('rgb(71, 85, 105)'); // #475569 — slate
    expect(style).toContain('rgb(37, 99, 235)'); // #2563eb — azul do tema
    expect(style).toContain('background-clip: text');
    expect(style).toContain('-webkit-text-fill-color: transparent');
  });

  it('respeita a velocidade padrão de 2s', () => {
    render(<ShinyText text="Roteirizando Cena 2/6" />);
    expect(screen.getByText('Roteirizando Cena 2/6').style.animation).toBe(
      'shiny-sweep 2s linear infinite'
    );
  });

  it('desligado, rende texto sólido sem animação', () => {
    render(<ShinyText text="Vídeo renderizado e catalogado" disabled color="#334155" />);

    const el = screen.getByText('Vídeo renderizado e catalogado');
    expect(el.style.animation).toBe('');
    expect(el.style.color).toBe('rgb(51, 65, 85)');
  });
});
