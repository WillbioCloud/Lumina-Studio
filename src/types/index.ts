export type TabType = 'studio' | 'calendar' | 'library' | 'distribution' | 'settings';

export type StudioMode = 'synthetic' | 'clipping' | 'shop';

/** Estilo de gancho de venda usado no modo TikTok Shop */
export type HookStyle = 'review' | 'antes-depois' | 'unboxing' | 'problema-solucao' | 'tres-motivos';

export interface ShopPayload {
  /** briefing do produto: nome, benefício principal, público */
  product: string;
  /** oferta/preço exibido na tela (ex: "R$ 39,90 com cupom") */
  offer?: string;
  /** link do produto na vitrine (TikTok Shop / afiliado) */
  productUrl?: string;
  hookStyle: HookStyle;
  voice: string;
  niche: string;
}

export type Niche = 'biblico' | 'curiosidades' | 'historia' | 'filosofia' | 'cinema' | 'universal';

export interface ClipPayload {
  videoFile: File;
  audioTrack?: File;
  niche: string;
  maxDurationSeconds?: number;
}

export type Platform = 'youtube' | 'tiktok';

export type PublicationStatus = 'scheduled' | 'publishing' | 'published' | 'failed';

export interface Publication {
  platform: Platform;
  status: PublicationStatus;
  publishedAt?: string;
  externalUrl?: string;
  errorMessage?: string;
}

export interface VideoItem {
  id: string;
  title: string;
  referenceText: string; // Ex: "Mateus 5:14-15"
  niche: Niche;
  script: string;
  videoUrl: string; // URL do vídeo no Drive/Storage
  thumbnailUrl: string;
  durationSeconds: number;
  scheduledDate: string; // YYYY-MM-DD
  publications: Publication[];
  createdAt: string;
}

export type GenerationStep =
  | 'idle' 
  | 'generating_script' 
  | 'generating_voice' 
  | 'generating_images' 
  | 'rendering_ffmpeg' 
  | 'uploading_drive' 
  | 'completed' 
  | 'failed';