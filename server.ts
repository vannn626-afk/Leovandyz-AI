import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Parse JSON with 15MB limit for attachments/images
app.use(express.json({ limit: '15mb' }));

// Initialize GoogleGenAI SDK server-side
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Cache whether the paid image model has 0 free-tier quota on this key to skip wasted roundtrips
let isPaidImageModelZeroQuota = false;

// Simple in-memory rate limiter per IP to protect public access without login
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const ipLimits = new Map<string, RateLimitRecord>();

function checkRateLimit(ip: string, maxRequests = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const record = ipLimits.get(ip);
  if (!record || now > record.resetTime) {
    ipLimits.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) {
    return false;
  }
  record.count++;
  return true;
}

// Clean up stale rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipLimits.entries()) {
    if (now > record.resetTime) {
      ipLimits.delete(ip);
    }
  }
}, 300000);

// Helper: Normalize errors for client
function getSafeErrorMessage(error: any): string {
  const msg = error?.message || String(error);
  if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
    return 'Kunci Gemini API di server tidak valid. Pastikan variabel GEMINI_API_KEY terkonfigurasi dengan benar di panel Secrets.';
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') || msg.includes('Quota exceeded')) {
    if (msg.includes('image') || msg.includes('gemini-3.1-flash-lite-image') || msg.includes('limit: 0')) {
      return 'Batas kuota model gambar tercapai (Free Tier limit: 0). Pembuatan & pengeditan gambar memerlukan API key Google AI Studio dengan penagihan aktif (Pay-as-you-go).';
    }
    return 'Batas kuota Gemini API tercapai (Rate Limit). Silakan tunggu beberapa detik lalu coba lagi.';
  }
  if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
    return 'Server AI sedang sibuk. Silakan coba kirim ulang beberapa saat lagi.';
  }
  if (msg.includes('PERMISSION_DENIED') || msg.includes('403')) {
    return 'Izin ditolak untuk model yang diminta.';
  }
  if (msg.includes('NOT_FOUND') || msg.includes('404')) {
    return 'Model yang diminta tidak ditemukan atau tidak didukung pada versi API saat ini.';
  }
  return msg || 'Terjadi kesalahan sistem saat memproses permintaan.';
}

// API Routes

// 1. Status & Health
app.get('/api/status', (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const record = ipLimits.get(clientIp);
  const remaining = record ? Math.max(0, 60 - record.count) : 60;

  res.json({
    online: true,
    hasApiKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
    models: [
      {
        id: 'gemini-3.1-flash-lite',
        name: 'Gemini 3.1 Flash Lite',
        description: 'Model paling stabil, latensi super rendah (<1 detik), dan bebas batas kuota untuk percakapan, analisis, dan koding cepat.',
        badge: 'Super Cepat',
        capabilities: { text: true, coding: true, vision: true, tools: true },
      },
      {
        id: 'gemini-3.8-flash',
        name: 'Gemini 3.8 Flash',
        description: 'Model cerdas dengan kemampuan reasoning andal untuk pemecahan masalah rumit.',
        badge: 'Penalaran Lanjut',
        capabilities: { text: true, coding: true, vision: true, tools: true, thinking: true },
      },
    ],
    rateLimit: {
      limitPerMinute: 60,
      remaining,
    },
  });
});

// 2. Chat Streaming Endpoint (SSE)
app.post('/api/chat/stream', async (req: Request, res: Response): Promise<void> => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp, 60, 60000)) {
    res.status(429).json({ error: 'Terlalu banyak permintaan. Silakan tunggu beberapa detik.' });
    return;
  }

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    res.status(500).json({
      error: 'GEMINI_API_KEY belum dikonfigurasi di server. Silakan atur di panel Secrets.',
    });
    return;
  }

  const {
    messages = [],
    model = 'gemini-3.1-flash-lite',
    systemInstruction,
    webSearch = false,
  } = req.body;

  // Safely map model to active fast models
  const selectedModel = model === 'gemini-3.8-flash' ? 'gemini-3.8-flash' : 'gemini-3.1-flash-lite';

  // Set up SSE headers and flush immediately to prevent proxy buffering
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }
  // Immediate ping so client fetch resolves headers right away
  res.write(': connected\n\n');

  const sendEvent = (type: string, data: any) => {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
    }
  };

  try {
    // Keep only the last 12 messages for fast context processing
    const recentMessages = Array.isArray(messages) ? messages.slice(-12) : [];
    const rawContents: Array<{ role: 'user' | 'model'; parts: any[] }> = [];

    for (let i = 0; i < recentMessages.length; i++) {
      const msg = recentMessages[i];
      const isRecentTurn = i >= recentMessages.length - 2;
      const parts: any[] = [];

      // Attach binary inlineData only for the latest 2 turns to avoid re-uploading multi-MB payloads
      if (Array.isArray(msg.attachments)) {
        for (const att of msg.attachments) {
          if (isRecentTurn && att.base64Data && att.mimeType) {
            parts.push({
              inlineData: {
                data: att.base64Data,
                mimeType: att.mimeType,
              },
            });
          } else if (att.name) {
            parts.push({ text: `[Lampiran: ${att.name}]` });
          }
        }
      }

      if (msg.content && typeof msg.content === 'string' && msg.content.trim()) {
        parts.push({ text: msg.content.trim() });
      }

      if (parts.length > 0) {
        const role: 'user' | 'model' = msg.role === 'assistant' ? 'model' : 'user';
        // Merge consecutive turns of the same role to satisfy Gemini strict alternating turn rules
        if (rawContents.length > 0 && rawContents[rawContents.length - 1].role === role) {
          rawContents[rawContents.length - 1].parts.push(...parts);
        } else {
          rawContents.push({ role, parts });
        }
      }
    }

    // Ensure conversation starts with a 'user' turn
    while (rawContents.length > 0 && rawContents[0].role !== 'user') {
      rawContents.shift();
    }

    if (rawContents.length === 0) {
      sendEvent('error', { message: 'Konten pesan tidak boleh kosong.' });
      res.end();
      return;
    }

    // Build model configuration
    const buildConfig = (targetModel: string, withSearch: boolean) => {
      const cfg: any = {};
      if (systemInstruction) {
        cfg.systemInstruction = systemInstruction;
      }
      if (targetModel === 'gemini-3.8-flash') {
        // Low thinking level ensures fast time-to-first-token without multi-second stalls
        cfg.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }
      if (withSearch) {
        cfg.tools = [{ googleSearch: {} }];
      }
      return cfg;
    };

    const isRecoverableModelError = (err: any) => {
      const msg = String(err?.message || err);
      return (
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('Quota exceeded') ||
        msg.includes('503') ||
        msg.includes('high demand') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('PERMISSION_DENIED') ||
        msg.includes('403') ||
        msg.includes('400')
      );
    };

    let responseStream: any;
    let activeModelUsed = selectedModel;

    try {
      responseStream = await ai.models.generateContentStream({
        model: activeModelUsed,
        contents: rawContents,
        config: buildConfig(activeModelUsed, Boolean(webSearch)),
      });
    } catch (firstErr: any) {
      // Immediate fallback to gemini-3.1-flash-lite without tools if primary model or search tool fails
      if (isRecoverableModelError(firstErr)) {
        activeModelUsed = 'gemini-3.1-flash-lite';
        responseStream = await ai.models.generateContentStream({
          model: activeModelUsed,
          contents: rawContents,
          config: buildConfig(activeModelUsed, false),
        });
      } else {
        throw firstErr;
      }
    }

    let collectedGroundingSources: Array<{ title: string; url: string }> = [];
    let totalCharactersSent = 0;

    try {
      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          totalCharactersSent += text.length;
          sendEvent('chunk', { text });
        }

        const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (Array.isArray(chunks)) {
          for (const item of chunks) {
            if (item?.web?.uri) {
              collectedGroundingSources.push({
                title: item.web.title || item.web.uri,
                url: item.web.uri,
              });
            }
          }
        }
      }
    } catch (streamIterErr: any) {
      if (totalCharactersSent === 0 && isRecoverableModelError(streamIterErr)) {
        const fallbackStream = await ai.models.generateContentStream({
          model: 'gemini-3.1-flash-lite',
          contents: rawContents,
          config: buildConfig('gemini-3.1-flash-lite', false),
        });
        for await (const fallbackChunk of fallbackStream) {
          if (fallbackChunk.text) {
            totalCharactersSent += fallbackChunk.text.length;
            sendEvent('chunk', { text: fallbackChunk.text });
          }
        }
      } else if (totalCharactersSent === 0) {
        throw streamIterErr;
      }
    }

    // Safety net: if stream finished with 0 characters, perform a fast direct generateContent call
    if (totalCharactersSent === 0) {
      const directResp = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: rawContents,
        config: buildConfig('gemini-3.1-flash-lite', false),
      });
      const fallbackText =
        directResp.text ||
        'Halo! Saya siap membantu Anda. Silakan tuliskan detail pertanyaan atau instruksi yang ingin Anda kerjakan.';
      sendEvent('chunk', { text: fallbackText });
    }

    if (collectedGroundingSources.length > 0) {
      const uniqueSources = Array.from(
        new Map(collectedGroundingSources.map((s) => [s.url, s])).values()
      );
      sendEvent('grounding', { sources: uniqueSources });
    }

    sendEvent('done', {});
    res.end();
  } catch (err: any) {
    const isQuota =
      String(err?.message || err).includes('429') ||
      String(err?.message || err).includes('RESOURCE_EXHAUSTED') ||
      String(err?.message || err).includes('Quota exceeded');
    if (isQuota) {
      console.warn('Chat stream rate limit notice:', String(err?.message || err).slice(0, 150));
    } else {
      console.error('Chat stream error:', err?.message || String(err));
    }
    sendEvent('error', { message: getSafeErrorMessage(err) });
    res.end();
  }
});

// Helper: Free Tier AI SVG Artwork Generator using gemini-3.1-flash-lite when paid image model quota is 0
async function generateFreeTierSvgArtwork(
  prompt: string,
  aspectRatio = '1:1',
  baseImagePart?: { inlineData: { data: string; mimeType: string } }
): Promise<string> {
  const dimensions: Record<string, { w: number; h: number }> = {
    '1:1': { w: 800, h: 800 },
    '16:9': { w: 960, h: 540 },
    '9:16': { w: 540, h: 960 },
    '4:3': { w: 800, h: 600 },
    '3:4': { w: 600, h: 800 },
  };
  const { w, h } = dimensions[aspectRatio] || dimensions['1:1'];

  const svgInstruction = `You are a master digital illustrator and SVG vector artist.
Create a rich, detailed, visually stunning, multi-layered SVG artwork (${w}x${h}) based on the user's prompt.
Requirements:
- Return ONLY raw valid <svg>...</svg> code. Do not wrap in markdown explanations.
- Use <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">.
- Include rich <defs> with linearGradient, radialGradient, filter (glow/shadow), and layered shapes, paths, lighting, and atmosphere.
- Make the illustration artistic, modern, and faithful to the subject described.`;

  const parts: any[] = [];
  if (baseImagePart) {
    parts.push(baseImagePart);
    parts.push({
      text: `Analyze this reference image and create an updated, stylized SVG vector artwork (${w}x${h}) applying this modification instruction: "${prompt}". Return ONLY the <svg>...</svg> code.`,
    });
  } else {
    parts.push({
      text: `Create a detailed, artistic SVG illustration (${w}x${h}) for: "${prompt}". Return ONLY the <svg>...</svg> code.`,
    });
  }

  const res = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: { parts },
    config: {
      systemInstruction: svgInstruction,
    },
  });

  const rawText = res.text || '';
  const svgMatch = rawText.match(/<svg[\s\S]*?<\/svg>/i);
  let svgCode = svgMatch ? svgMatch[0] : '';

  if (!svgCode) {
    svgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="50%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#311042"/>
        </linearGradient>
        <radialGradient id="orb" cx="50%" cy="45%" r="40%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.7"/>
          <stop offset="60%" stop-color="#818cf8" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <circle cx="${w / 2}" cy="${h * 0.45}" r="${Math.min(w, h) * 0.35}" fill="url(#orb)"/>
      <text x="50%" y="88%" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-size="18" font-weight="bold">${prompt.slice(0, 48).replace(/[<>&"']/g, '')}</text>
    </svg>`;
  } else if (!svgCode.includes('xmlns=')) {
    svgCode = svgCode.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const base64Svg = Buffer.from(svgCode, 'utf-8').toString('base64');
  return `data:image/svg+xml;base64,${base64Svg}`;
}

// 3. Image Generation Endpoint
app.post('/api/image/generate', async (req: Request, res: Response): Promise<void> => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp, 20, 60000)) {
    res.status(429).json({ error: 'Batas pembuatan gambar per menit tercapai. Silakan tunggu.' });
    return;
  }

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi di server.' });
    return;
  }

  const { prompt, aspectRatio = '1:1' } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ error: 'Prompt gambar wajib diisi.' });
    return;
  }

  const validRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
  const chosenRatio = validRatios.includes(aspectRatio) ? aspectRatio : '1:1';

  // If we already know the paid image model has 0 free tier quota, skip straight to fast Free Tier SVG generation
  if (isPaidImageModelZeroQuota) {
    try {
      const svgDataUrl = await generateFreeTierSvgArtwork(prompt.trim(), chosenRatio);
      res.json({
        success: true,
        imageUrl: svgDataUrl,
        prompt,
        aspectRatio: chosenRatio,
        model: 'gemini-3.1-flash-lite (Free Tier Vector)',
        timestamp: Date.now(),
      });
      return;
    } catch (err: any) {
      res.status(500).json({ error: getSafeErrorMessage(err) });
      return;
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: prompt.trim() }],
      },
      config: {
        imageConfig: {
          aspectRatio: chosenRatio as any,
        },
      },
    });

    let imageUrl = '';
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      const svgDataUrl = await generateFreeTierSvgArtwork(prompt.trim(), chosenRatio);
      res.json({
        success: true,
        imageUrl: svgDataUrl,
        prompt,
        aspectRatio: chosenRatio,
        model: 'gemini-3.1-flash-lite (Free Tier Vector)',
        timestamp: Date.now(),
      });
      return;
    }

    res.json({
      success: true,
      imageUrl,
      prompt,
      aspectRatio: chosenRatio,
      model: 'gemini-3.1-flash-lite-image',
      timestamp: Date.now(),
    });
  } catch (err: any) {
    const errMsg = String(err?.message || err);
    if (errMsg.includes('limit: 0')) {
      isPaidImageModelZeroQuota = true;
    }
    const isQuotaOrPermission =
      errMsg.includes('429') ||
      errMsg.includes('RESOURCE_EXHAUSTED') ||
      errMsg.includes('Quota exceeded') ||
      errMsg.includes('403') ||
      errMsg.includes('PERMISSION_DENIED');

    if (isQuotaOrPermission) {
      try {
        const svgDataUrl = await generateFreeTierSvgArtwork(prompt.trim(), chosenRatio);
        res.json({
          success: true,
          imageUrl: svgDataUrl,
          prompt,
          aspectRatio: chosenRatio,
          model: 'gemini-3.1-flash-lite (Free Tier Vector)',
          timestamp: Date.now(),
        });
        return;
      } catch (fallbackErr: any) {
        console.warn('SVG fallback also failed:', fallbackErr?.message || String(fallbackErr));
      }
    }

    console.warn('Image generate error:', errMsg.slice(0, 160));
    res.status(500).json({ error: getSafeErrorMessage(err) });
  }
});

// 4. Image Editing Endpoint
app.post('/api/image/edit', async (req: Request, res: Response): Promise<void> => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp, 20, 60000)) {
    res.status(429).json({ error: 'Batas pengeditan gambar per menit tercapai. Silakan tunggu.' });
    return;
  }

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi di server.' });
    return;
  }

  const { prompt, imageBase64, mimeType = 'image/png' } = req.body;

  if (!prompt || !imageBase64) {
    res.status(400).json({ error: 'Prompt modifikasi dan gambar dasar wajib disertakan.' });
    return;
  }

  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

  if (isPaidImageModelZeroQuota) {
    try {
      const svgDataUrl = await generateFreeTierSvgArtwork(prompt.trim(), '1:1', {
        inlineData: { data: cleanBase64, mimeType },
      });
      res.json({
        success: true,
        imageUrl: svgDataUrl,
        prompt,
        model: 'gemini-3.1-flash-lite (Free Tier Vector)',
        timestamp: Date.now(),
      });
      return;
    } catch (err: any) {
      res.status(500).json({ error: getSafeErrorMessage(err) });
      return;
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType,
            },
          },
          {
            text: prompt.trim(),
          },
        ],
      },
    });

    let imageUrl = '';
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      const svgDataUrl = await generateFreeTierSvgArtwork(prompt.trim(), '1:1', {
        inlineData: { data: cleanBase64, mimeType },
      });
      res.json({
        success: true,
        imageUrl: svgDataUrl,
        prompt,
        model: 'gemini-3.1-flash-lite (Free Tier Vector)',
        timestamp: Date.now(),
      });
      return;
    }

    res.json({
      success: true,
      imageUrl,
      prompt,
      model: 'gemini-3.1-flash-lite-image',
      timestamp: Date.now(),
    });
  } catch (err: any) {
    const errMsg = String(err?.message || err);
    if (errMsg.includes('limit: 0')) {
      isPaidImageModelZeroQuota = true;
    }
    const isQuotaOrPermission =
      errMsg.includes('429') ||
      errMsg.includes('RESOURCE_EXHAUSTED') ||
      errMsg.includes('Quota exceeded') ||
      errMsg.includes('403') ||
      errMsg.includes('PERMISSION_DENIED');

    if (isQuotaOrPermission) {
      try {
        const svgDataUrl = await generateFreeTierSvgArtwork(prompt.trim(), '1:1', {
          inlineData: { data: cleanBase64, mimeType },
        });
        res.json({
          success: true,
          imageUrl: svgDataUrl,
          prompt,
          model: 'gemini-3.1-flash-lite (Free Tier Vector)',
          timestamp: Date.now(),
        });
        return;
      } catch (fallbackErr: any) {
        console.warn('SVG edit fallback also failed:', fallbackErr?.message || String(fallbackErr));
      }
    }

    console.warn('Image edit error:', errMsg.slice(0, 160));
    res.status(500).json({ error: getSafeErrorMessage(err) });
  }
});

// Vite middleware integration (Dev vs Production)
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in development mode');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log(`Static files served from ${distPath}`);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LEOVANDYZ AI server running at http://0.0.0.0:${PORT}`);
  });
}

setupViteOrStatic().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
