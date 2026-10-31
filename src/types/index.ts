export type AppMode = 'chat' | 'coding' | 'images' | 'documents' | 'study';

export type Language = 'id' | 'en';

export type ThemeAccent = 'cyan' | 'indigo' | 'emerald' | 'rose';

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  badge?: string;
  isPaid?: boolean;
  capabilities: {
    text: boolean;
    coding: boolean;
    vision: boolean;
    tools: boolean;
    thinking?: boolean;
    images?: boolean;
  };
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  dataUrl?: string; // For previews in browser
  base64Data?: string; // Clean base64 for API transmission
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  attachments?: FileAttachment[];
  groundingSources?: GroundingSource[];
  isStreaming?: boolean;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model: string;
  mode: AppMode;
  isPinned?: boolean;
  messageCount?: number;
}

export interface ImageGenerationRecord {
  id: string;
  prompt: string;
  resultUrl: string;
  originalUrl?: string;
  aspectRatio: string;
  model: string;
  timestamp: number;
  isEdit?: boolean;
}

export interface CodeArtifact {
  id: string;
  title: string;
  language: string;
  code: string;
  timestamp: number;
  description?: string;
}

export type AppTheme =
  | 'monokrom-neobrutalism'
  | 'pinky-neobrutalism'
  | 'glassmorphism-white-blue'
  | 'blue-sea'
  | 'green-forest'
  | 'pinky-cute'
  | 'white-casual'
  | 'dark-casual';

export interface UserSettings {
  theme: AppTheme;
  language: Language;
  themeAccent?: ThemeAccent;
  defaultModel: string;
  webSearchEnabled: boolean;
  streamResponses: boolean;
  fontSize: 'sm' | 'md' | 'lg';
}

export interface ServerStatusResponse {
  online: boolean;
  hasApiKey: boolean;
  models: ModelOption[];
  rateLimit: {
    limitPerMinute: number;
    remaining: number;
  };
}
