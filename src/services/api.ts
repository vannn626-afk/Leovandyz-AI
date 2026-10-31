import { FileAttachment, GroundingSource, ServerStatusResponse } from '../types';

export interface StreamChatParams {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachments?: FileAttachment[];
  }>;
  model: string;
  systemInstruction?: string;
  webSearch?: boolean;
  onChunk: (text: string) => void;
  onGrounding?: (sources: GroundingSource[]) => void;
  onError: (error: string) => void;
  onDone: () => void;
  signal?: AbortSignal;
}

export async function checkServerStatus(): Promise<ServerStatusResponse | null> {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function streamChat(params: StreamChatParams): Promise<void> {
  const {
    messages,
    model,
    systemInstruction,
    webSearch,
    onChunk,
    onGrounding,
    onError,
    onDone,
    signal,
  } = params;

  let finished = false;
  let pendingChunkBuffer = '';
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  const flushPendingChunks = () => {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (pendingChunkBuffer) {
      const textToEmit = pendingChunkBuffer;
      pendingChunkBuffer = '';
      onChunk(textToEmit);
    }
  };

  const queueChunk = (text: string) => {
    pendingChunkBuffer += text;
    if (!flushTimer) {
      flushTimer = setTimeout(flushPendingChunks, 28);
    }
  };

  const safeDone = () => {
    flushPendingChunks();
    if (!finished) {
      finished = true;
      onDone();
    }
  };

  const safeError = (msg: string) => {
    flushPendingChunks();
    if (!finished) {
      finished = true;
      onError(msg);
    }
  };

  try {
    const res = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model,
        systemInstruction,
        webSearch,
      }),
      signal,
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      safeError(errorJson.error || `Server HTTP Error: ${res.status}`);
      return;
    }

    if (!res.body) {
      safeError('Respons stream tidak tersedia dari server.');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    const processLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) return;
      if (trimmed.startsWith('data:')) {
        const jsonPart = trimmed.slice(5).trim();
        if (!jsonPart) return;
        try {
          const data = JSON.parse(jsonPart);
          if (data.type === 'chunk' && data.text) {
            queueChunk(data.text);
          } else if (data.type === 'grounding' && data.sources && onGrounding) {
            onGrounding(data.sources);
          } else if (data.type === 'error') {
            safeError(data.message || 'Terjadi kesalahan pemrosesan AI.');
          } else if (data.type === 'done') {
            safeDone();
          }
        } catch (e) {
          console.warn('Failed to parse SSE JSON:', jsonPart, e);
        }
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';

      for (const line of lines) {
        processLine(line);
        if (finished) return;
      }
    }

    if (buffer.trim()) {
      processLine(buffer);
    }

    safeDone();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      safeDone();
      return;
    }
    console.warn('streamChat connection issue:', err);
    safeError(err.message || 'Koneksi ke server terputus. Silakan coba lagi.');
  }
}

export async function generateImage(params: {
  prompt: string;
  aspectRatio?: string;
}): Promise<{ success: boolean; imageUrl?: string; error?: string; isQuotaError?: boolean }> {
  try {
    const res = await fetch('/api/image/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${res.status}`,
        isQuotaError: Boolean(data.isQuotaError || res.status === 429),
      };
    }
    return { success: true, imageUrl: data.imageUrl };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal memanggil API gambar.' };
  }
}

export async function editImage(params: {
  prompt: string;
  imageBase64: string;
  mimeType?: string;
}): Promise<{ success: boolean; imageUrl?: string; error?: string; isQuotaError?: boolean }> {
  try {
    const res = await fetch('/api/image/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${res.status}`,
        isQuotaError: Boolean(data.isQuotaError || res.status === 429),
      };
    }
    return { success: true, imageUrl: data.imageUrl };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mengubah gambar.' };
  }
}
