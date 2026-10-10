import type { VideoItem } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface GeneratePayload {
  referenceText: string;
  voice: string;
  niche: string;
}

export async function generateVideo(
  payload: GeneratePayload,
  onProgress?: (step: number, message: string) => void
): Promise<VideoItem> {
  const response = await fetch(`${API_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = 'Falha na comunicação com o backend.';
    try {
      const err = await response.json();
      if (err.detail) errorMsg = err.detail;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let completedVideo: VideoItem | null = null;

  if (!reader) throw new Error('Não foi possível ler o fluxo de dados da resposta.');

  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const cleanLine = line.replace(/^data:\s*/, '').trim();
      if (!cleanLine) continue;

      const event = JSON.parse(cleanLine);
      if (event.step === -1) {
        throw new Error(event.message || 'Erro durante a renderização no backend.');
      }

      if (onProgress) {
        onProgress(event.step, event.message);
      }

      if (event.step === 5 && event.videoItem) {
        completedVideo = event.videoItem;
      }
    }
  }

  if (!completedVideo) {
    throw new Error('O pipeline finalizou sem retornar os metadados do vídeo.');
  }

  return completedVideo;
}

export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function clipVideo(
  payload: { videoFile: File; audioTrack?: File; niche: string },
  onProgress?: (step: number, message: string) => void
): Promise<VideoItem> {
  const formData = new FormData();
  formData.append('video', payload.videoFile);
  if (payload.audioTrack) formData.append('audio', payload.audioTrack);
  formData.append('niche', payload.niche);

  const response = await fetch(`${API_BASE_URL}/api/clip`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = 'Falha ao processar corte do vídeo.';
    try {
      const err = await response.json();
      if (err.detail) errorMsg = err.detail;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let completedVideo: VideoItem | null = null;

  if (!reader) throw new Error('Não foi possível ler o fluxo da resposta.');

  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const cleanLine = line.replace(/^data:\s*/, '').trim();
      if (!cleanLine) continue;

      const event = JSON.parse(cleanLine);
      if (event.step === -1) throw new Error(event.message || 'Erro durante o corte.');
      if (onProgress) onProgress(event.step, event.message);
      if (event.step === 5 && event.videoItem) completedVideo = event.videoItem;
    }
  }

  if (!completedVideo) throw new Error('O corte finalizou sem metadados do vídeo.');
  return completedVideo;
}

