import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const app = express();

// Parse JSON with 15MB limit for attachments/images
app.use(express.json({ limit: '15mb' }));

function getActiveApiKey(): string {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.API_KEY ||
    ''
  ).trim();
}

function createGenAIClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

let isPaidImageModelZeroQuota = false;
let cachedWorkingTextModel: string | null = null;

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

function getSafeErrorMessage(error: any): string {
  const msg = error?.message || String(error);
  if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
    return 'Kunci Gemini API tidak valid. Pastikan variabel GEMINI_API_KEY di Environment Variables telah diisi dengan benar.';
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') || msg.includes('Quota exceeded')) {
    if (msg.includes('image') || msg.includes('gemini-3.1-flash-lite-image') || msg.includes('limit: 0')) {
      return 'Batas kuota model gambar tercapai (Free Tier limit: 0). Pembuatan & pengeditan gambar menggunakan mode vektor gratis.';
    }
    return 'Batas kuota Gemini API tercapai (Rate Limit). Silakan tunggu beberapa detik lalu coba lagi.';
  }
  if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
    return 'Server AI sedang sibuk. Silakan coba kirim ulang beberapa saat lagi.';
  }
  if (msg.includes('PERMISSION_DENIED') || msg.includes('403')) {
    return 'Izin ditolak untuk kunci API atau model yang diminta.';
  }
  if (msg.includes('NOT_FOUND') || msg.includes('404')) {
    return 'Model atau endpoint tidak ditemukan pada konfigurasi API saat ini.';
  }
  return msg || 'Terjadi kesalahan sistem saat memproses permintaan.';
}

function getCandidateTextModels(requestedModel: string): string[] {
  const primary =
    requestedModel === 'gemini-3.8-flash' ? 'gemini-3.8-flash' : 'gemini-3.1-flash-lite';
  const list = [
    ...(cachedWorkingTextModel ? [cachedWorkingTextModel] : []),
    primary,
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ];
  return Array.from(new Set(list));
}

// 1. Status & Health Endpoint (handles both /api/status and /status for Vercel rewrites)
app.get(['/api/status', '/status'], (req: Request, res: Response) => {
  const apiKey = getActiveApiKey();
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
  const record = ipLimits.get(clientIp);
  const remaining = record ? Math.max(0, 60 - record.count) : 60;

  res.json({
    online: true,
    hasApiKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
    models: [
      {
        id: 'gemini-3.1-flash-lite',
        name: 'Gemini 3.1 Flash Lite',
        description:
          'Model paling stabil, latensi super rendah (<1 detik), dan bebas batas kuota untuk percakapan, analisis, dan koding cepat.',
        badge: 'Super Cepat',
        capabilities: { text: true, coding: true, vision: true, tools: true },
      },
      {
        id: 'gemini-3.8-flash',
        name: 'Gemini 3.8 Flash',
        description:
          'Model cerdas dengan kemampuan reasoning andal untuk pemecahan masalah rumit.',
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
app.post(['/api/chat/stream', '/chat/stream'], async (req: Request, res: Response): Promise<void> => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
  if (!checkRateLimit(clientIp, 60, 60000)) {
    res.status(429).json({ error: 'Terlalu banyak permintaan. Silakan tunggu beberapa detik.' });
    return;
  }

  const apiKey = getActiveApiKey();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    res.status(500).json({
      error:
        'GEMINI_API_KEY belum ditemukan di server. Pastikan Anda sudah menambahkan GEMINI_API_KEY di Environment Variables (Vercel Settings > Environment Variables) lalu lakukan Redeploy.',
    });
    return;
  }

  const ai = createGenAIClient(apiKey);

  const {
    messages = [],
    model = 'gemini-3.1-flash-lite',
    systemInstruction,
    webSearch = false,
  } = req.body || {};

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }
  res.write(': connected\n\n');

  const sendEvent = (type: string, data: any) => {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
    }
  };

  try {
    const recentMessages = Array.isArray(messages) ? messages.slice(-12) : [];
    const rawContents: Array<{ role: 'user' | 'model'; parts: any[] }> = [];

    for (let i = 0; i < recentMessages.length; i++) {
      const msg = recentMessages[i];
      const isRecentTurn = i >= recentMessages.length - 2;
      const parts: any[] = [];

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
        if (rawContents.length > 0 && rawContents[rawContents.length - 1].role === role) {
          rawContents[rawContents.length - 1].parts.push(...parts);
        } else {
          rawContents.push({ role, parts });
        }
      }
    }

    while (rawContents.length > 0 && rawContents[0].role !== 'user') {
      rawContents.shift();
    }

    if (rawContents.length === 0) {
      sendEvent('error', { message: 'Konten pesan tidak boleh kosong.' });
      res.end();
      return;
    }

    const buildConfig = (targetModel: string, withSearch: boolean) => {
      const cfg: any = {};
      if (systemInstruction) {
        cfg.systemInstruction = systemInstruction;
      }
      if (targetModel === 'gemini-3.8-flash') {
        cfg.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }
      if (withSearch) {
        cfg.tools = [{ googleSearch: {} }];
      }
      return cfg;
    };

    const candidateModels = getCandidateTextModels(model);
    let responseStream: any = null;
    let lastError: any = null;
    let usedModel = candidateModels[0];

    // Try candidate models with automatic fallback if a model returns 404/429/503 on public or proxy endpoints
    for (const candidate of candidateModels) {
      try {
        responseStream = await ai.models.generateContentStream({
          model: candidate,
          contents: rawContents,
          config: buildConfig(candidate, Boolean(webSearch)),
        });
        usedModel = candidate;
        cachedWorkingTextModel = candidate;
        break;
      } catch (err: any) {
        lastError = err;
        // If webSearch caused the error, try same candidate without webSearch first
        if (webSearch) {
          try {
            responseStream = await ai.models.generateContentStream({
              model: candidate,
              contents: rawContents,
              config: buildConfig(candidate, false),
            });
            usedModel = candidate;
            cachedWorkingTextModel = candidate;
            break;
          } catch (innerErr: any) {
            lastError = innerErr;
          }
        }
      }
    }

    if (!responseStream) {
      throw lastError || new Error('Gagal menghubungkan ke model Gemini.');
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
      if (totalCharactersSent === 0) {
        // Fallback to another candidate model if stream failed mid-flight before emitting tokens
        for (const backupModel of candidateModels.filter((m) => m !== usedModel)) {
          try {
            const backupStream = await ai.models.generateContentStream({
              model: backupModel,
              contents: rawContents,
              config: buildConfig(backupModel, false),
            });
            for await (const bChunk of backupStream) {
              if (bChunk.text) {
                totalCharactersSent += bChunk.text.length;
                sendEvent('chunk', { text: bChunk.text });
              }
            }
            if (totalCharactersSent > 0) {
              cachedWorkingTextModel = backupModel;
              break;
            }
          } catch {
            // continue to next backup model
          }
        }
      }
      if (totalCharactersSent === 0) {
        throw streamIterErr;
      }
    }

    if (totalCharactersSent === 0) {
      const directResp = await ai.models.generateContent({
        model: usedModel,
        contents: rawContents,
        config: buildConfig(usedModel, false),
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
    console.warn('Chat stream error:', err?.message || String(err));
    sendEvent('error', { message: getSafeErrorMessage(err) });
    res.end();
  }
});

async function generateFreeTierSvgArtwork(
  ai: GoogleGenAI,
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

  let rawText = '';
  const candidateModels = getCandidateTextModels('gemini-3.1-flash-lite');
  for (const candidate of candidateModels) {
    try {
      const res = await ai.models.generateContent({
        model: candidate,
        contents: { parts },
        config: {
          systemInstruction: svgInstruction,
        },
      });
      rawText = res.text || '';
      if (rawText) break;
    } catch {
      // try next candidate
    }
  }

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
app.post(['/api/image/generate', '/image/generate'], async (req: Request, res: Response): Promise<void> => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
  if (!checkRateLimit(clientIp, 20, 60000)) {
    res.status(429).json({ error: 'Batas pembuatan gambar per menit tercapai. Silakan tunggu.' });
    return;
  }

  const apiKey = getActiveApiKey();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi di server.' });
    return;
  }

  const ai = createGenAIClient(apiKey);
  const { prompt, aspectRatio = '1:1' } = req.body || {};

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ error: 'Prompt gambar wajib diisi.' });
    return;
  }

  const validRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
  const chosenRatio = validRatios.includes(aspectRatio) ? aspectRatio : '1:1';

  if (isPaidImageModelZeroQuota) {
    try {
      const svgDataUrl = await generateFreeTierSvgArtwork(ai, prompt.trim(), chosenRatio);
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
      const svgDataUrl = await generateFreeTierSvgArtwork(ai, prompt.trim(), chosenRatio);
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
    if (errMsg.includes('limit: 0') || errMsg.includes('404') || errMsg.includes('NOT_FOUND')) {
      isPaidImageModelZeroQuota = true;
    }
    try {
      const svgDataUrl = await generateFreeTierSvgArtwork(ai, prompt.trim(), chosenRatio);
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
      console.warn('SVG fallback failed:', fallbackErr?.message || String(fallbackErr));
    }

    res.status(500).json({ error: getSafeErrorMessage(err) });
  }
});

// 4. Image Editing Endpoint
app.post(['/api/image/edit', '/image/edit'], async (req: Request, res: Response): Promise<void> => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
  if (!checkRateLimit(clientIp, 20, 60000)) {
    res.status(429).json({ error: 'Batas pengeditan gambar per menit tercapai. Silakan tunggu.' });
    return;
  }

  const apiKey = getActiveApiKey();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi di server.' });
    return;
  }

  const ai = createGenAIClient(apiKey);
  const { prompt, imageBase64, mimeType = 'image/png' } = req.body || {};

  if (!prompt || !imageBase64) {
    res.status(400).json({ error: 'Prompt modifikasi dan gambar dasar wajib disertakan.' });
    return;
  }

  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

  if (isPaidImageModelZeroQuota) {
    try {
      const svgDataUrl = await generateFreeTierSvgArtwork(ai, prompt.trim(), '1:1', {
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
      const svgDataUrl = await generateFreeTierSvgArtwork(ai, prompt.trim(), '1:1', {
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
    if (errMsg.includes('limit: 0') || errMsg.includes('404') || errMsg.includes('NOT_FOUND')) {
      isPaidImageModelZeroQuota = true;
    }
    try {
      const svgDataUrl = await generateFreeTierSvgArtwork(ai, prompt.trim(), '1:1', {
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
      console.warn('SVG edit fallback failed:', fallbackErr?.message || String(fallbackErr));
    }

    res.status(500).json({ error: getSafeErrorMessage(err) });
  }
});

export default app;
