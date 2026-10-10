import React from 'react';

export interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  color?: string;
  shineColor?: string;
}

/**
 * ShinyText — efeito "brilho varrendo as letras" (estilo React Bits),
 * adaptado para a paleta clara Neumórfica do Lumina Studio (branco-gelo + azul).
 *
 * Sem dependências externas: a varredura usa `background-clip: text` puro
 * e a keyframe `shiny-sweep` declarada em `src/index.css`.
 */
export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 2,
  className = '',
  color = '#475569',
  shineColor = '#2563eb',
}) => {
  if (disabled) {
    return (
      <span className={className} style={{ color }}>
        {text}
      </span>
    );
  }

  return (
    <span
      className={`inline-block font-semibold bg-clip-text text-transparent select-none ${className}`}
      style={{
        backgroundImage: `linear-gradient(120deg, ${color} 0%, ${color} 38%, ${shineColor} 50%, ${color} 62%, ${color} 100%)`,
        backgroundSize: '200% 100%',
        animation: `shiny-sweep ${speed}s linear infinite`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      {text}
    </span>
  );
};

export default ShinyText;
