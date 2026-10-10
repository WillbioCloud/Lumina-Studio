import type { HookStyle, Niche, StudioMode, VideoItem } from '../types';

/**
 * Esteira simulada (offline).
 *
 * Existe por um único motivo: permitir evoluir e revisar o front-end — em
 * especial o Monitor Cognitivo e o ShinyText — sem depender do lumina-backend
 * estar de pé. Ela reproduz o MESMO contrato de eventos do stream SSE real
 * (`onProgress(step, message)` com etapas 1..5) e devolve um `VideoItem`,
 * então o caminho de estado no `App.tsx` é idêntico ao da API.
 *
 * Nada aqui toca a rede: quando o backend estiver disponível, basta desligar
 * o modo simulação.
 */

export interface DemoPipelineOptions {
  mode: StudioMode;
  prompt: string;
  niche: Niche;
  fileName?: string;
  /** modo TikTok Shop */
  offer?: string;
  hookStyle?: HookStyle;
}

interface DemoEvent {
  step: number;
  message: string;
  waitMs: number;
}

const SYNTHETIC_EVENTS: DemoEvent[] = [
  { step: 1, message: 'Dossiê de pesquisa estruturado (fontes cruzadas + recorte de nicho)', waitMs: 1500 },
  { step: 1, message: 'Roteirizando cena 2/6 — gancho de abertura calibrado para retenção', waitMs: 1700 },
  { step: 1, message: 'Roteiro fechado: 6 cenas, 48s estimados', waitMs: 1200 },
  { step: 2, message: 'Sintetizando narração e alinhando timestamps por cena', waitMs: 2200 },
  { step: 3, message: 'Renderizando keyframes 9:16 (consistência de personagem ativada)', waitMs: 2600 },
  { step: 4, message: 'Aplicando Ken Burns 2.5D + ducking de trilha sonora', waitMs: 2200 },
  { step: 5, message: 'MP4 9:16 exportado, thumbnail gerada e vídeo catalogado', waitMs: 1400 },
];

const CLIPPING_EVENTS: DemoEvent[] = [
  { step: 1, message: 'Áudio extraído e reamostrado para 16 kHz mono', waitMs: 1800 },
  { step: 2, message: 'Ganchos pontuados: 3 clímax candidatos acima de 0.82', waitMs: 2200 },
  { step: 3, message: 'Corte sem perdas aplicado no segmento de maior retenção', waitMs: 1800 },
  { step: 4, message: 'Reenquadramento 9:16 com tracking + ducking da trilha', waitMs: 2000 },
  { step: 5, message: 'Legendas dinâmicas queimadas e short final catalogado', waitMs: 1500 },
];

const SHOP_EVENTS: DemoEvent[] = [
  { step: 1, message: 'Dossiê do produto pronto: 4 benefícios e 2 objeções mapeadas', waitMs: 1700 },
  { step: 2, message: 'Escrevendo gancho de 3 segundos no estilo selecionado', waitMs: 1500 },
  { step: 2, message: 'Roteirizando cena 2/5 — demonstração com prova visual', waitMs: 1800 },
  { step: 2, message: 'Roteiro de conversão fechado: hook + oferta + CTA para a vitrine', waitMs: 1300 },
  { step: 3, message: 'Sintetizando narração vendedora e legendas palavra a palavra', waitMs: 2200 },
  { step: 4, message: 'Renderizando close-ups, b-roll e overlay de preço', waitMs: 2400 },
  { step: 5, message: 'MP4 9:16 + ficha do produto (título, tags e preço) catalogados', waitMs: 1500 },
];

const HOOK_LABELS: Record<HookStyle, string> = {
  review: 'Review honesto',
  'antes-depois': 'Antes / Depois',
  unboxing: 'Unboxing',
  'problema-solucao': 'Problema → Solução',
  'tres-motivos': '3 motivos para comprar',
};

const NICHE_LABELS: Record<string, string> = {
  biblico: 'Devocional Bíblico',
  curiosidades: 'Curiosidades & Ciência',
  historia: 'História & Civilizações',
  filosofia: 'Filosofia & Estoicismo',
  cinema: 'Cinema & Séries',
  universal: 'Universal',
};

function buildTitle(prompt: string): string {
  const clean = prompt.replace(/\s+/g, ' ').trim();
  const words = clean.split(' ').slice(0, 7);
  const base = words.join(' ');
  const titled = base.charAt(0).toUpperCase() + base.slice(1);
  return clean.length > base.length ? `${titled}…` : titled;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function runSimulatedPipeline(
  options: DemoPipelineOptions,
  onProgress?: (step: number, message: string) => void
): Promise<VideoItem> {
  const { mode, prompt, niche, fileName, offer, hookStyle } = options;
  const events =
    mode === 'synthetic' ? SYNTHETIC_EVENTS : mode === 'shop' ? SHOP_EVENTS : CLIPPING_EVENTS;

  for (const event of events) {
    await wait(event.waitMs);
    onProgress?.(event.step, event.message);
  }

  const now = new Date();
  const title =
    mode === 'synthetic'
      ? buildTitle(prompt || 'Vídeo sem título')
      : mode === 'shop'
        ? buildTitle(prompt || 'Produto sem nome')
        : `Melhores momentos — ${fileName || 'bruto'}`;

  return {
    id: `demo-${now.getTime()}`,
    title,
    referenceText:
      mode === 'synthetic' ? 'SIMULAÇÃO' : mode === 'shop' ? offer?.trim() || 'TIKTOK SHOP' : 'CLIPPING',
    niche,
    script: `[SIMULAÇÃO LOCAL] ${
      mode === 'synthetic'
        ? `Roteiro em 6 cenas gerado a partir do tema "${prompt}" para o nicho ${
            NICHE_LABELS[niche] ?? 'Universal'
          }. Conecte o lumina-backend para receber o roteiro, a narração e o render reais.`
        : mode === 'shop'
          ? `Roteiro de conversão em 5 cenas para "${prompt}" no formato ${
              HOOK_LABELS[hookStyle ?? 'review']
            }${offer ? `, com oferta "${offer}"` : ''}. Gancho de 3s, prova social e CTA para a vitrine. Conecte o lumina-backend para receber o vídeo de venda real.`
          : `Corte vertical derivado de "${fileName ?? 'vídeo bruto'}" com os trechos de maior retenção. Conecte o lumina-backend para processar o arquivo de verdade.`
    }`,
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    durationSeconds: mode === 'synthetic' ? 48 : mode === 'shop' ? 32 : 37,
    scheduledDate: now.toISOString().split('T')[0],
    publications: [
      { platform: 'youtube', status: 'scheduled' },
      { platform: 'tiktok', status: 'scheduled' },
    ],
    createdAt: now.toISOString(),
  };
}
