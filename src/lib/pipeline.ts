import type { StudioMode } from '../types';

/**
 * Definição declarativa da esteira de produção.
 *
 * Fica fora dos componentes por dois motivos: (1) `App.tsx` e o
 * `CognitiveMonitor` consomem a mesma fonte de verdade e (2) manter dados puros
 * longe de arquivos que exportam componentes preserva o Fast Refresh do Vite.
 */

export const SYNTHETIC_STEPS = [
  'Roteirização e Cenas com IA (Gemini / Groq)',
  'Síntese de Voz e Sincronização (ElevenLabs / Edge-TTS)',
  'Geração de Imagens Fidedignas (FLUX 1 Schnell)',
  'Renderização Ken Burns 2.5D Estabilizado (FFmpeg)',
  'Exportação e Catálogo Final em 9:16',
];

export const CLIPPING_STEPS = [
  'Extração e Compressão Radical de Áudio (16kHz Mono)',
  'Análise de Ganchos e Clímax com Gemini Flash',
  'Corte Sem Perdas (Lossless Stream Copy no FFmpeg)',
  'Enquadramento 9:16 + Ducking de Trilha Sonora',
  'Geração de Legendas Dinâmicas e Vídeo Final',
];

export const SHOP_STEPS = [
  'Dossiê do Produto e Ângulo de Venda (Gemini / Groq)',
  'Roteiro de Conversão com Gancho de 3s (Hook + CTA)',
  'Voz Vendedora e Legendas Queimadas (TTS + Karaoke)',
  'Cenas Verticais do Produto + B-Roll (FLUX / Assets)',
  'Render 9:16, Thumbnail e Ficha TikTok Shop',
];

export const PIPELINE_STEPS: Record<StudioMode, string[]> = {
  synthetic: SYNTHETIC_STEPS,
  clipping: CLIPPING_STEPS,
  shop: SHOP_STEPS,
};

/**
 * Micro-tarefas de cada etapa: o detalhe granular exibido no feed do
 * Monitor Cognitivo ("Roteirizando cena 2/6", "Sintetizando narração"...).
 * Quando o lumina-backend passar a emitir eventos por cena/por bloco, basta
 * trocar esta projeção local pelos eventos reais do stream — o feed já sabe
 * diferenciar as duas origens.
 */
export const MICRO_TASKS: Record<StudioMode, string[][]> = {
  synthetic: [
    [
      'Compilando dossiê de pesquisa estruturado',
      'Extraindo arco narrativo e ganchos de retenção',
      'Roteirizando cena 1/6',
      'Roteirizando cena 2/6',
      'Roteirizando cena 3/6',
      'Roteirizando cena 4/6',
      'Roteirizando cena 5/6',
      'Roteirizando cena 6/6',
      'Revisando ritmo, CTA e fechamento',
    ],
    [
      'Selecionando timbre e prosódia da voz',
      'Sintetizando narração (bloco 1/3)',
      'Sintetizando narração (bloco 2/3)',
      'Sintetizando narração (bloco 3/3)',
      'Alinhando timestamps fonéticos por cena',
    ],
    [
      'Desenhando prompts visuais por cena',
      'Renderizando keyframe da cena 1/6',
      'Renderizando keyframe da cena 2/6',
      'Renderizando keyframe da cena 3/6',
      'Renderizando keyframe da cena 4/6',
      'Renderizando keyframe da cena 5/6',
      'Renderizando keyframe da cena 6/6',
      'Harmonizando paleta e consistência visual',
    ],
    [
      'Aplicando movimento Ken Burns 2.5D',
      'Estabilizando transições entre cenas',
      'Mixando ducking de trilha sonora',
      'Sincronizando áudio quadro a quadro',
    ],
    [
      'Empacotando MP4 vertical 9:16',
      'Gerando thumbnail de alto contraste',
      'Registrando metadados no catálogo',
    ],
  ],
  clipping: [
    [
      'Extraindo faixa de áudio do bruto',
      'Reamostrando para 16 kHz mono',
      'Normalizando loudness e ruído de fundo',
    ],
    [
      'Transcrevendo e marcando timestamps',
      'Pontuando ganchos e momentos de clímax',
      'Selecionando trechos com maior retenção',
    ],
    ['Definindo pontos de corte sem perdas', 'Stream copy dos segmentos selecionados'],
    [
      'Reenquadrando para 9:16 com tracking de sujeito',
      'Aplicando ducking na trilha sonora',
    ],
    [
      'Queimando legendas dinâmicas',
      'Empacotando short final e publicando no catálogo',
    ],
  ],
  shop: [
    [
      'Lendo ficha, reviews e dúvidas do produto',
      'Extraindo benefícios e objeções de compra',
      'Definindo promessa central e prova de credibilidade',
      'Montando dossiê de venda estruturado',
    ],
    [
      'Escrevendo gancho de 3 segundos',
      'Roteirizando cena 1/5 — problema e tensão',
      'Roteirizando cena 2/5 — demonstração do produto',
      'Roteirizando cena 3/5 — prova social',
      'Roteirizando cena 4/5 — oferta e ancoragem de preço',
      'Roteirizando cena 5/5 — CTA para a vitrine',
      'Revisando conformidade (sem alegação de saúde ou resultado garantido)',
    ],
    [
      'Sintetizando narração vendedora',
      'Sincronizando legendas palavra a palavra',
      'Ajustando ritmo para segurar retenção até o CTA',
    ],
    [
      'Gerando close-up do produto em fundo limpo',
      'Gerando cena de uso em contexto real',
      'Compondo b-roll e overlay de preço',
      'Harmonizando cores e identidade da marca',
    ],
    [
      'Empacotando MP4 vertical 9:16',
      'Gerando thumbnail com selo de oferta',
      'Montando ficha do produto (título, tags e preço)',
    ],
  ],
};

/** Ritmo da projeção de micro-tarefas (uma linha nova no feed a cada X ms). */
export const MICRO_TASK_INTERVAL_MS = 2200;
