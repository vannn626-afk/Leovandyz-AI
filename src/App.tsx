import React, { useState, useEffect, useRef } from 'react';
import {
  AppMode,
  ChatMessage,
  Conversation,
  FileAttachment,
  ImageGenerationRecord,
  UserSettings,
} from './types';
import { localDB } from './services/db';
import { checkServerStatus, streamChat } from './services/api';
import { translations } from './services/translations';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatWorkspace } from './components/ChatWorkspace';
import { Composer } from './components/Composer';
import { CodingStudio } from './components/CodingStudio';
import { ImageStudio } from './components/ImageStudio';
import { DocumentStudio } from './components/DocumentStudio';
import { ProductivityStudio } from './components/ProductivityStudio';
import { SettingsModal } from './components/SettingsModal';
import { PrivacyModal } from './components/PrivacyModal';

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'monokrom-neobrutalism',
  language: 'id',
  themeAccent: 'cyan',
  defaultModel: 'gemini-3.1-flash-lite',
  webSearchEnabled: false,
  streamResponses: true,
  fontSize: 'md',
};

function safeGetStorage(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (e) {
    console.warn('localStorage read prevented:', e);
  }
  return null;
}

function safeSetStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn('localStorage write prevented:', e);
  }
}

export default function App() {
  // Load settings safely without throwing on blocked storage
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = safeGetStorage('leovandyz_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.defaultModel === 'gemini-4-argon') {
          parsed.defaultModel = 'gemini-3.1-flash-lite';
        }
        if (!parsed.theme) {
          parsed.theme = 'monokrom-neobrutalism';
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to parse saved settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Synchronize active theme attribute on document root
  useEffect(() => {
    const activeTheme = settings.theme || 'monokrom-neobrutalism';
    document.documentElement.setAttribute('data-theme', activeTheme);
  }, [settings.theme]);

  // Current active mode
  const [currentMode, setCurrentMode] = useState<AppMode>('chat');

  // Active AI Model
  const [selectedModel, setSelectedModel] = useState<string>(settings.defaultModel);

  // Conversations & Messages state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Composer state
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [webSearchActive, setWebSearchActive] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Gallery state for Image Studio
  const [gallery, setGallery] = useState<ImageGenerationRecord[]>([]);

  // Studio bridge state
  const [codingInitialCode, setCodingInitialCode] = useState<string | undefined>();
  const [codingInitialLang, setCodingInitialLang] = useState<string | undefined>();

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);

  // Server health state
  const [isApiKeyConfigured, setIsApiKeyConfigured] = useState(true);

  // Streaming abort controller
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initial load
  useEffect(() => {
    // Check server status
    checkServerStatus().then((status) => {
      if (status) {
        setIsApiKeyConfigured(status.hasApiKey);
      }
    });

    // Load conversations from IndexedDB
    refreshConversations();

    // Load image gallery
    refreshGallery();
  }, []);

  // Save settings to localStorage
  const handleUpdateSettings = (partial: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      safeSetStorage('leovandyz_settings', JSON.stringify(updated));
      return updated;
    });

    if (partial.defaultModel) {
      const valid = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'].includes(partial.defaultModel)
        ? partial.defaultModel
        : 'gemini-3.1-flash-lite';
      setSelectedModel(valid);
    }
  };

  const refreshConversations = async () => {
    const list = await localDB.getConversations();
    setConversations(list);
  };

  const refreshGallery = async () => {
    const imgs = await localDB.getImages();
    setGallery(imgs);
  };

  // Handle Select Conversation
  const handleSelectConversation = async (id: string) => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
    setActiveConversationId(id);
    setCurrentMode('chat');
    const loaded = await localDB.getMessages(id);
    setMessages(loaded);
  };

  // Handle New Chat
  const handleNewChat = () => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
    setActiveConversationId(null);
    setMessages([]);
    setInput('');
    setAttachments([]);
    setCurrentMode('chat');
  };

  // Handle Delete Conversation
  const handleDeleteConversation = async (id: string) => {
    await localDB.deleteConversation(id);
    if (activeConversationId === id) {
      handleNewChat();
    }
    await refreshConversations();
  };

  // Handle Rename Conversation
  const handleRenameConversation = async (id: string, newTitle: string) => {
    await localDB.renameConversation(id, newTitle);
    await refreshConversations();
  };

  // Handle Toggle Pin Conversation
  const handleTogglePinConversation = async (id: string) => {
    await localDB.togglePinConversation(id);
    await refreshConversations();
  };

  // Handle Send Message in Chat
  const handleSendMessage = async (
    overridePrompt?: string,
    overrideAttachments?: FileAttachment[],
    baseMessagesOverride?: ChatMessage[]
  ) => {
    const textToSend = overridePrompt !== undefined ? overridePrompt : input;
    const attsToSend = overrideAttachments !== undefined ? overrideAttachments : attachments;

    if (!textToSend.trim() && attsToSend.length === 0) return;
    if (isStreaming) return;

    // Reset composer immediately for snappy UX
    if (overridePrompt === undefined) {
      setInput('');
    }
    if (overrideAttachments === undefined) {
      setAttachments([]);
    }

    let convId = activeConversationId;
    const baseMessages = baseMessagesOverride !== undefined ? baseMessagesOverride : messages;

    // Create new conversation if none active
    if (!convId) {
      const newTitle = textToSend.trim().slice(0, 36) || 'Percakapan Baru';
      convId = `conv_${Date.now()}`;
      const newConv: Conversation = {
        id: convId,
        title: newTitle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: selectedModel,
        mode: currentMode,
        messageCount: 0,
      };
      setActiveConversationId(convId);
      localDB.saveConversation(newConv).then(() => refreshConversations());
    }

    // 1. Create User Message & Assistant Placeholder immediately in UI state
    const nowTs = Date.now();
    const userMessage: ChatMessage = {
      id: `msg_u_${nowTs}`,
      conversationId: convId,
      role: 'user',
      content: textToSend.trim(),
      timestamp: nowTs,
      attachments: attsToSend,
    };

    const assistantMessageId = `msg_a_${nowTs + 1}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantMessageId,
      conversationId: convId,
      role: 'assistant',
      content: '',
      timestamp: nowTs + 1,
      model: selectedModel,
      isStreaming: true,
    };

    const updatedMessages = [...baseMessages, userMessage];
    setMessages([...updatedMessages, assistantPlaceholder]);
    setIsStreaming(true);

    // Save user message in background without blocking UI render
    localDB.saveMessage(userMessage).then(() => refreshConversations());

    // Set up abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Build context messages for API
    const apiMessages = updatedMessages.map((m) => ({
      role: m.role,
      content: m.content,
      attachments: m.attachments,
    }));

    // Mode-specific system instructions
    let systemInstruction =
      'You are LEOVANDYZ AI, an intelligent, fast, helpful, and versatile AI assistant. Answer accurately, clearly, and directly in the user language (Indonesian or English).';

    if (currentMode === 'coding') {
      systemInstruction =
        'You are an expert full-stack software engineer and architect inside the LEOVANDYZ Coding Studio. Provide production-grade, well-documented, clean code solutions with best practices. Always wrap code in markdown code blocks with correct language identifiers.';
    } else if (currentMode === 'study') {
      systemInstruction =
        'You are an expert tutor and academic mentor in LEOVANDYZ AI. Explain concepts step-by-step, use intuitive analogies, clarify tricky points, and encourage critical thinking.';
    }

    let accumulatedText = '';
    let accumulatedSources: any[] = [];

    const updateAssistantInList = (
      prev: ChatMessage[],
      patch: Partial<ChatMessage>
    ): ChatMessage[] => {
      const exists = prev.some((m) => m.id === assistantMessageId);
      if (exists) {
        return prev.map((m) => (m.id === assistantMessageId ? { ...m, ...patch } : m));
      }
      return [...prev, { ...assistantPlaceholder, ...patch }];
    };

    await streamChat({
      messages: apiMessages,
      model: selectedModel,
      systemInstruction,
      webSearch: webSearchActive,
      signal: abortController.signal,
      onChunk: (text) => {
        accumulatedText += text;
        setMessages((prev) =>
          updateAssistantInList(prev, {
            content: accumulatedText,
            isStreaming: true,
          })
        );
      },
      onGrounding: (sources) => {
        accumulatedSources = sources;
        setMessages((prev) =>
          updateAssistantInList(prev, {
            groundingSources: accumulatedSources,
          })
        );
      },
      onError: async (errorMsg) => {
        const finalMsg: ChatMessage = {
          id: assistantMessageId,
          conversationId: convId!,
          role: 'assistant',
          content: accumulatedText,
          timestamp: Date.now(),
          model: selectedModel,
          error: errorMsg,
          isStreaming: false,
        };
        setMessages((prev) => updateAssistantInList(prev, finalMsg));
        setIsStreaming(false);
        abortControllerRef.current = null;
        await localDB.saveMessage(finalMsg);
      },
      onDone: async () => {
        const finalMsg: ChatMessage = {
          id: assistantMessageId,
          conversationId: convId!,
          role: 'assistant',
          content: accumulatedText,
          timestamp: Date.now(),
          model: selectedModel,
          groundingSources: accumulatedSources.length > 0 ? accumulatedSources : undefined,
          isStreaming: false,
        };
        setMessages((prev) => updateAssistantInList(prev, finalMsg));
        setIsStreaming(false);
        abortControllerRef.current = null;
        await localDB.saveMessage(finalMsg);
        await refreshConversations();
      },
    });
  };

  // Handle Stop Streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  // Handle Regenerate Last Response
  const handleRegenerate = async () => {
    if (isStreaming || messages.length === 0) return;

    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }
    if (lastUserIndex === -1) return;

    const userMsg = messages[lastUserIndex];
    const messagesToDelete = messages.slice(lastUserIndex);
    for (const m of messagesToDelete) {
      await localDB.deleteMessage(m.id);
    }

    const pruned = messages.slice(0, lastUserIndex);
    setMessages(pruned);

    handleSendMessage(userMsg.content, userMsg.attachments, pruned);
  };

  // Handle Edit User Message
  const handleEditMessage = async (msgId: string, newContent: string) => {
    const msgIndex = messages.findIndex((m) => m.id === msgId);
    if (msgIndex === -1) return;

    const messagesToDelete = messages.slice(msgIndex);
    for (const m of messagesToDelete) {
      await localDB.deleteMessage(m.id);
    }

    const pruned = messages.slice(0, msgIndex);
    setMessages(pruned);

    handleSendMessage(newContent, undefined, pruned);
  };

  // Handle Delete Single Message
  const handleDeleteMessage = async (msgId: string) => {
    await localDB.deleteMessage(msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  // Bridge: Open Code block in Coding Studio
  const handleOpenInCodingStudio = (code: string, language: string) => {
    setCodingInitialCode(code);
    setCodingInitialLang(language);
    setCurrentMode('coding');
  };

  // Bridge: Ask AI from Coding Studio
  const handleAskAiFromCodingStudio = (instruction: string) => {
    setCurrentMode('chat');
    handleSendMessage(instruction);
  };

  // Bridge: Document analysis execution
  const handleStartAnalysisWithFile = (files: FileAttachment[], prompt: string) => {
    setCurrentMode('chat');
    handleSendMessage(prompt, files);
  };

  // Bridge: Template prompt selection
  const handleSelectTemplate = (templatePrompt: string) => {
    setCurrentMode('chat');
    setInput(templatePrompt);
  };

  return (
    <div className="theme-app-canvas relative flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden antialiased">
      {/* Sidebar (Desktop and Mobile Drawer) */}
      <Sidebar
        currentMode={currentMode}
        onSelectMode={(mode) => setCurrentMode(mode)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePinConversation={handleTogglePinConversation}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        lang={settings.language}
        isOpenMobile={isOpenMobileSidebar}
        onCloseMobile={() => setIsOpenMobileSidebar(false)}
        isApiKeyConfigured={isApiKeyConfigured}
      />

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-1 flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          currentMode={currentMode}
          selectedModel={selectedModel}
          onSelectModel={(id) => setSelectedModel(id)}
          webSearchActive={webSearchActive}
          onToggleWebSearch={() => setWebSearchActive(!webSearchActive)}
          lang={settings.language}
          onToggleLanguage={() =>
            handleUpdateSettings({ language: settings.language === 'id' ? 'en' : 'id' })
          }
          theme={settings.theme}
          onSelectTheme={(theme) => handleUpdateSettings({ theme })}
          onOpenMobileSidebar={() => setIsOpenMobileSidebar(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Center Workspace per Mode */}
        <main className="flex-1 overflow-hidden flex flex-col relative">
          {currentMode === 'coding' && (
            <CodingStudio
              initialCode={codingInitialCode}
              initialLanguage={codingInitialLang}
              onAskAiToAssist={handleAskAiFromCodingStudio}
              lang={settings.language}
            />
          )}

          {currentMode === 'images' && (
            <ImageStudio
              gallery={gallery}
              onRefreshGallery={refreshGallery}
              lang={settings.language}
            />
          )}

          {currentMode === 'documents' && (
            <DocumentStudio
              onStartAnalysisWithFile={handleStartAnalysisWithFile}
              lang={settings.language}
            />
          )}

          {currentMode === 'study' && (
            <ProductivityStudio
              onSelectTemplate={handleSelectTemplate}
              lang={settings.language}
            />
          )}

          {currentMode === 'chat' && (
            <>
              {messages.length === 0 ? (
                <div className="flex-1 overflow-y-auto flex flex-col">
                  <WelcomeScreen
                    onSelectPrompt={(p) => handleSendMessage(p)}
                    lang={settings.language}
                  />
                </div>
              ) : (
                <ChatWorkspace
                  messages={messages}
                  isStreaming={isStreaming}
                  onRegenerate={handleRegenerate}
                  onEditMessage={handleEditMessage}
                  onDeleteMessage={handleDeleteMessage}
                  onOpenInCodingStudio={handleOpenInCodingStudio}
                  lang={settings.language}
                />
              )}

              {/* Chat Composer */}
              <Composer
                input={input}
                onChangeInput={setInput}
                onSend={() => handleSendMessage()}
                onStop={handleStopStreaming}
                isStreaming={isStreaming}
                attachments={attachments}
                onAddAttachments={(newAtts) => setAttachments((prev) => [...prev, ...newAtts])}
                onRemoveAttachment={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
                webSearchActive={webSearchActive}
                onToggleWebSearch={() => setWebSearchActive(!webSearchActive)}
                lang={settings.language}
              />
            </>
          )}
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onRefreshData={() => {
          refreshConversations();
          refreshGallery();
        }}
      />

      {/* Privacy Modal */}
      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        lang={settings.language}
      />
    </div>
  );
}
