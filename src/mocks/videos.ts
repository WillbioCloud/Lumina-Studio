import type { VideoItem } from '../types';

export const MOCK_VIDEOS: VideoItem[] = [
  {
    id: 'vid-1',
    title: 'Vós Sois a Luz do Mundo',
    referenceText: 'Mateus 5:14-15',
    niche: 'biblico',
    script: 'Você já se sentiu invisível? Em Mateus 5:14, Jesus declara: Vós sois a luz do mundo...',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=800&auto=format&fit=crop&q=80',
    durationSeconds: 42,
    scheduledDate: new Date().toISOString().split('T')[0], // Hoje
    publications: [
      { platform: 'youtube', status: 'published', externalUrl: 'https://youtube.com/shorts/exemplo' },
      { platform: 'tiktok', status: 'published', externalUrl: 'https://tiktok.com/@exemplo/video/1' }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'vid-2',
    title: 'O Senhor é Meu Pastor',
    referenceText: 'Salmos 23:1-3',
    niche: 'biblico',
    script: 'O Senhor é o meu pastor e nada me faltará. Em verdes pastagens ele me faz repousar...',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&auto=format&fit=crop&q=80',
    durationSeconds: 48,
    scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Amanhã
    publications: [
      { platform: 'youtube', status: 'scheduled' },
      { platform: 'tiktok', status: 'scheduled' }
    ],
    createdAt: new Date().toISOString()
  }
];