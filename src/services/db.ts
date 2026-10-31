import { Conversation, ChatMessage, ImageGenerationRecord, CodeArtifact } from '../types';

const DB_NAME = 'leovandyz_ai_db';
const DB_VERSION = 1;

class LocalDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase | null> | null = null;
  private isMemoryFallback = false;

  // In-memory fallbacks when IndexedDB is blocked or disabled in iframe/incognito
  private memConversations: Map<string, Conversation> = new Map();
  private memMessages: Map<string, ChatMessage> = new Map();
  private memImages: Map<string, ImageGenerationRecord> = new Map();
  private memArtifacts: Map<string, CodeArtifact> = new Map();

  private async open(): Promise<IDBDatabase | null> {
    if (this.isMemoryFallback) return null;
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve) => {
      try {
        if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
          this.isMemoryFallback = true;
          return resolve(null);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
          const db = request.result;

          if (!db.objectStoreNames.contains('conversations')) {
            const convStore = db.createObjectStore('conversations', { keyPath: 'id' });
            convStore.createIndex('updatedAt', 'updatedAt', { unique: false });
            convStore.createIndex('mode', 'mode', { unique: false });
          }

          if (!db.objectStoreNames.contains('messages')) {
            const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
            msgStore.createIndex('conversationId', 'conversationId', { unique: false });
            msgStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          if (!db.objectStoreNames.contains('images')) {
            const imgStore = db.createObjectStore('images', { keyPath: 'id' });
            imgStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          if (!db.objectStoreNames.contains('artifacts')) {
            const artStore = db.createObjectStore('artifacts', { keyPath: 'id' });
            artStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };

        request.onsuccess = () => {
          this.db = request.result;
          resolve(this.db);
        };

        request.onerror = () => {
          console.warn('IndexedDB open rejected, using in-memory store.');
          this.isMemoryFallback = true;
          resolve(null);
        };

        request.onblocked = () => {
          console.warn('IndexedDB blocked, using in-memory store.');
          this.isMemoryFallback = true;
          resolve(null);
        };
      } catch (err) {
        console.warn('IndexedDB threw error, using in-memory store:', err);
        this.isMemoryFallback = true;
        resolve(null);
      }
    });

    return this.initPromise;
  }

  // ===== CONVERSATIONS =====

  async getConversations(): Promise<Conversation[]> {
    const db = await this.open();
    if (!db) {
      const list = Array.from(this.memConversations.values());
      list.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.updatedAt - a.updatedAt;
      });
      return list;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('conversations', 'readonly');
        const store = tx.objectStore('conversations');
        const request = store.getAll();

        request.onsuccess = () => {
          const list = (request.result as Conversation[]) || [];
          list.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.updatedAt - a.updatedAt;
          });
          resolve(list);
        };
        request.onerror = () => resolve(Array.from(this.memConversations.values()));
      } catch {
        resolve(Array.from(this.memConversations.values()));
      }
    });
  }

  async getConversation(id: string): Promise<Conversation | null> {
    const db = await this.open();
    if (!db) return this.memConversations.get(id) || null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('conversations', 'readonly');
        const store = tx.objectStore('conversations');
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(this.memConversations.get(id) || null);
      } catch {
        resolve(this.memConversations.get(id) || null);
      }
    });
  }

  async saveConversation(conv: Conversation): Promise<void> {
    this.memConversations.set(conv.id, conv);
    const db = await this.open();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('conversations', 'readwrite');
        const store = tx.objectStore('conversations');
        const request = store.put(conv);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async renameConversation(id: string, title: string): Promise<void> {
    const conv = await this.getConversation(id);
    if (conv) {
      conv.title = title;
      conv.updatedAt = Date.now();
      await this.saveConversation(conv);
    }
  }

  async togglePinConversation(id: string): Promise<void> {
    const conv = await this.getConversation(id);
    if (conv) {
      conv.isPinned = !conv.isPinned;
      await this.saveConversation(conv);
    }
  }

  async deleteConversation(id: string): Promise<void> {
    this.memConversations.delete(id);
    for (const [msgId, msg] of this.memMessages.entries()) {
      if (msg.conversationId === id) this.memMessages.delete(msgId);
    }

    const db = await this.open();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(['conversations', 'messages'], 'readwrite');
        tx.objectStore('conversations').delete(id);

        const msgStore = tx.objectStore('messages');
        const index = msgStore.index('conversationId');
        const req = index.getAllKeys(id);
        req.onsuccess = () => {
          const keys = req.result;
          for (const k of keys) {
            msgStore.delete(k);
          }
        };

        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // ===== MESSAGES =====

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const db = await this.open();
    if (!db) {
      const list = Array.from(this.memMessages.values()).filter((m) => m.conversationId === conversationId);
      list.sort((a, b) => a.timestamp - b.timestamp);
      return list;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('messages', 'readonly');
        const store = tx.objectStore('messages');
        const index = store.index('conversationId');
        const request = index.getAll(conversationId);

        request.onsuccess = () => {
          const list = (request.result as ChatMessage[]) || [];
          list.sort((a, b) => a.timestamp - b.timestamp);
          resolve(list);
        };
        request.onerror = () => {
          const list = Array.from(this.memMessages.values()).filter((m) => m.conversationId === conversationId);
          resolve(list);
        };
      } catch {
        const list = Array.from(this.memMessages.values()).filter((m) => m.conversationId === conversationId);
        resolve(list);
      }
    });
  }

  async saveMessage(msg: ChatMessage): Promise<void> {
    this.memMessages.set(msg.id, msg);
    const db = await this.open();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(['messages', 'conversations'], 'readwrite');
        tx.objectStore('messages').put(msg);

        const convStore = tx.objectStore('conversations');
        const getReq = convStore.get(msg.conversationId);
        getReq.onsuccess = () => {
          const conv = getReq.result as Conversation | undefined;
          if (conv) {
            conv.updatedAt = Date.now();
            conv.messageCount = (conv.messageCount || 0) + 1;
            convStore.put(conv);
          }
        };

        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async deleteMessage(id: string): Promise<void> {
    this.memMessages.delete(id);
    const db = await this.open();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('messages', 'readwrite');
        tx.objectStore('messages').delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // ===== IMAGES =====

  async saveImage(record: ImageGenerationRecord): Promise<void> {
    this.memImages.set(record.id, record);
    const db = await this.open();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('images', 'readwrite');
        tx.objectStore('images').put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async getImages(): Promise<ImageGenerationRecord[]> {
    const db = await this.open();
    if (!db) {
      const list = Array.from(this.memImages.values());
      list.sort((a, b) => b.timestamp - a.timestamp);
      return list;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('images', 'readonly');
        const req = tx.objectStore('images').getAll();
        req.onsuccess = () => {
          const list = (req.result as ImageGenerationRecord[]) || [];
          list.sort((a, b) => b.timestamp - a.timestamp);
          resolve(list);
        };
        req.onerror = () => resolve(Array.from(this.memImages.values()));
      } catch {
        resolve(Array.from(this.memImages.values()));
      }
    });
  }

  async deleteImage(id: string): Promise<void> {
    this.memImages.delete(id);
    const db = await this.open();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('images', 'readwrite');
        tx.objectStore('images').delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // ===== ARTIFACTS =====

  async saveArtifact(artifact: CodeArtifact): Promise<void> {
    this.memArtifacts.set(artifact.id, artifact);
    const db = await this.open();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('artifacts', 'readwrite');
        tx.objectStore('artifacts').put(artifact);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async getArtifacts(): Promise<CodeArtifact[]> {
    const db = await this.open();
    if (!db) {
      const list = Array.from(this.memArtifacts.values());
      list.sort((a, b) => b.timestamp - a.timestamp);
      return list;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('artifacts', 'readonly');
        const req = tx.objectStore('artifacts').getAll();
        req.onsuccess = () => {
          const list = (req.result as CodeArtifact[]) || [];
          list.sort((a, b) => b.timestamp - a.timestamp);
          resolve(list);
        };
        req.onerror = () => resolve(Array.from(this.memArtifacts.values()));
      } catch {
        resolve(Array.from(this.memArtifacts.values()));
      }
    });
  }

  // ===== BACKUP & RESTORE =====

  async exportAllData(): Promise<string> {
    const [conversations, images, artifacts] = await Promise.all([
      this.getConversations(),
      this.getImages(),
      this.getArtifacts(),
    ]);

    const db = await this.open();
    let allMessages: ChatMessage[] = [];

    if (db) {
      allMessages = await new Promise((resolve) => {
        try {
          const tx = db.transaction('messages', 'readonly');
          const req = tx.objectStore('messages').getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve(Array.from(this.memMessages.values()));
        } catch {
          resolve(Array.from(this.memMessages.values()));
        }
      });
    } else {
      allMessages = Array.from(this.memMessages.values());
    }

    const backup = {
      app: 'LEOVANDYZ AI',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        conversations,
        messages: allMessages,
        images,
        artifacts,
      },
    };

    return JSON.stringify(backup, null, 2);
  }

  async importData(jsonContent: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed.data || !Array.isArray(parsed.data.conversations)) {
        return { success: false, count: 0, error: 'Format file cadangan tidak valid.' };
      }

      let count = 0;
      for (const conv of parsed.data.conversations) {
        this.memConversations.set(conv.id, conv);
        count++;
      }
      if (Array.isArray(parsed.data.messages)) {
        for (const msg of parsed.data.messages) {
          this.memMessages.set(msg.id, msg);
        }
      }
      if (Array.isArray(parsed.data.images)) {
        for (const img of parsed.data.images) {
          this.memImages.set(img.id, img);
        }
      }
      if (Array.isArray(parsed.data.artifacts)) {
        for (const art of parsed.data.artifacts) {
          this.memArtifacts.set(art.id, art);
        }
      }

      const db = await this.open();
      if (!db) {
        return { success: true, count };
      }

      return new Promise((resolve) => {
        try {
          const tx = db.transaction(['conversations', 'messages', 'images', 'artifacts'], 'readwrite');
          const convStore = tx.objectStore('conversations');
          const msgStore = tx.objectStore('messages');
          const imgStore = tx.objectStore('images');
          const artStore = tx.objectStore('artifacts');

          for (const conv of parsed.data.conversations) convStore.put(conv);
          if (Array.isArray(parsed.data.messages)) {
            for (const msg of parsed.data.messages) msgStore.put(msg);
          }
          if (Array.isArray(parsed.data.images)) {
            for (const img of parsed.data.images) imgStore.put(img);
          }
          if (Array.isArray(parsed.data.artifacts)) {
            for (const art of parsed.data.artifacts) artStore.put(art);
          }

          tx.oncomplete = () => resolve({ success: true, count });
          tx.onerror = () => resolve({ success: true, count });
        } catch {
          resolve({ success: true, count });
        }
      });
    } catch (e: any) {
      return { success: false, count: 0, error: e.message || 'File JSON rusak.' };
    }
  }

  async clearAllData(): Promise<void> {
    this.memConversations.clear();
    this.memMessages.clear();
    this.memImages.clear();
    this.memArtifacts.clear();

    const db = await this.open();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(['conversations', 'messages', 'images', 'artifacts'], 'readwrite');
        tx.objectStore('conversations').clear();
        tx.objectStore('messages').clear();
        tx.objectStore('images').clear();
        tx.objectStore('artifacts').clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async getStorageUsage(): Promise<{ conversationCount: number; messageCount: number; imageCount: number }> {
    const [convs, imgs] = await Promise.all([this.getConversations(), this.getImages()]);
    const db = await this.open();
    if (!db) {
      return {
        conversationCount: convs.length,
        messageCount: this.memMessages.size,
        imageCount: imgs.length,
      };
    }

    const msgCount: number = await new Promise((resolve) => {
      try {
        const tx = db.transaction('messages', 'readonly');
        const countReq = tx.objectStore('messages').count();
        countReq.onsuccess = () => resolve(countReq.result);
        countReq.onerror = () => resolve(this.memMessages.size);
      } catch {
        resolve(this.memMessages.size);
      }
    });

    return {
      conversationCount: convs.length,
      messageCount: msgCount,
      imageCount: imgs.length,
    };
  }
}

export const localDB = new LocalDB();
