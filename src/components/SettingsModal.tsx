import React, { useRef, useState, useEffect } from 'react';
import {
  Settings,
  X,
  Globe,
  Palette,
  Cpu,
  HardDrive,
  Download,
  Upload,
  Trash2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { AppTheme, Language, UserSettings } from '../types';
import { AVAILABLE_MODELS, THEME_DEFINITIONS, translations } from '../services/translations';
import { localDB } from '../services/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onRefreshData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onRefreshData,
}) => {
  const t = translations[settings.language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState({ conversationCount: 0, messageCount: 0, imageCount: 0 });
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      localDB.getStorageUsage().then(setStats);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExport = async () => {
    const jsonStr = await localDB.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leovandyz_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const text = reader.result as string;
      const res = await localDB.importData(text);
      if (res.success) {
        setImportStatus(`Berhasil memulihkan ${res.count} percakapan.`);
        const newStats = await localDB.getStorageUsage();
        setStats(newStats);
        onRefreshData();
      } else {
        setImportStatus(`Gagal impor: ${res.error}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearAll = async () => {
    await localDB.clearAllData();
    setShowClearConfirm(false);
    const newStats = await localDB.getStorageUsage();
    setStats(newStats);
    onRefreshData();
    setImportStatus('Seluruh data lokal berhasil dibersihkan.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4">
      <div className="theme-surface-elevated relative w-full max-w-xl p-5 sm:p-6 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 theme-border-b">
          <div className="flex items-center gap-2 font-bold text-base theme-text">
            <Settings className="h-5 w-5" />
            <span>{t.settingsTitle}</span>
          </div>
          <button
            onClick={onClose}
            className="theme-btn-ghost p-1"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Setting Items */}
        <div className="space-y-6">
          {/* 1. Theme Selector (8 Bespoke Themes) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider theme-text">
                <Palette className="h-4 w-4" />
                <span>{t.themeLabel}</span>
              </label>
              <span className="text-[11px] theme-text-muted">
                {settings.theme === 'monokrom-neobrutalism' ? 'Default' : ''}
              </span>
            </div>
            <p className="text-xs theme-text-muted leading-relaxed">
              {t.themeDesc}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {THEME_DEFINITIONS.map((th) => {
                const isSelected = settings.theme === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => onUpdateSettings({ theme: th.id })}
                    className={`flex flex-col justify-between p-3 text-left transition-all theme-radius cursor-pointer ${
                      isSelected
                        ? 'theme-btn-primary'
                        : 'theme-btn-secondary hover:bg-[var(--bg-surface-subtle)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold">
                          {settings.language === 'id' ? th.name : th.nameEn}
                        </span>
                        {isSelected ? (
                          <Check className="h-3.5 w-3.5 shrink-0" />
                        ) : th.badge ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase opacity-80 theme-badge">
                            {settings.language === 'id' ? th.badge : th.badgeEn}
                          </span>
                        ) : null}
                      </div>
                      <p className={`text-[11px] line-clamp-2 leading-relaxed ${isSelected ? 'opacity-90' : 'theme-text-muted'}`}>
                        {settings.language === 'id' ? th.tagline : th.taglineEn}
                      </p>
                    </div>

                    {/* Palette swatches preview */}
                    <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-current/20">
                      <span
                        className="h-3 w-5 rounded-xs border border-black/20"
                        style={{ backgroundColor: th.palette.bg }}
                        title="Canvas"
                      />
                      <span
                        className="h-3 w-5 rounded-xs border border-black/20"
                        style={{ backgroundColor: th.palette.surface }}
                        title="Surface"
                      />
                      <span
                        className="h-3 w-5 rounded-xs border border-black/20"
                        style={{ backgroundColor: th.palette.border }}
                        title="Border"
                      />
                      <span
                        className="h-3 w-5 rounded-xs border border-black/20"
                        style={{ backgroundColor: th.palette.accent }}
                        title="Accent"
                      />
                      <span className="ml-auto text-[10px] font-mono opacity-80">
                        {th.isDark ? 'Dark' : 'Light'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Language Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider theme-text">
              <Globe className="h-4 w-4" />
              <span>{t.languageLabel}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ language: 'id' })}
                className={`py-2 px-3 text-xs font-semibold theme-radius transition-all ${
                  settings.language === 'id' ? 'theme-btn-primary' : 'theme-btn-secondary'
                }`}
              >
                Bahasa Indonesia
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ language: 'en' })}
                className={`py-2 px-3 text-xs font-semibold theme-radius transition-all ${
                  settings.language === 'en' ? 'theme-btn-primary' : 'theme-btn-secondary'
                }`}
              >
                English (US)
              </button>
            </div>
          </div>

          {/* 3. Default AI Model */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider theme-text">
              <Cpu className="h-4 w-4" />
              <span>{t.defaultModelLabel}</span>
            </label>
            <div className="space-y-2">
              {AVAILABLE_MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onUpdateSettings({ defaultModel: m.id })}
                  className={`w-full flex items-center justify-between p-3 text-left theme-radius transition-all ${
                    settings.defaultModel === m.id ? 'theme-btn-primary' : 'theme-btn-secondary'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">{m.name}</span>
                    <span className={`text-[11px] ${settings.defaultModel === m.id ? 'opacity-90' : 'theme-text-muted'}`}>
                      {m.description}
                    </span>
                  </div>
                  {settings.defaultModel === m.id && (
                    <Check className="h-4 w-4 shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Local Storage Stats & Backup Actions */}
          <div className="space-y-3 pt-2 theme-border-t">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider theme-text">
              <HardDrive className="h-4 w-4" />
              <span>{t.storageStats}</span>
            </label>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="theme-surface-subtle p-2">
                <span className="text-xs theme-text-muted block">{t.totalConversations}</span>
                <span className="text-sm font-mono font-bold theme-text">{stats.conversationCount}</span>
              </div>
              <div className="theme-surface-subtle p-2">
                <span className="text-xs theme-text-muted block">{t.totalMessages}</span>
                <span className="text-sm font-mono font-bold theme-text">{stats.messageCount}</span>
              </div>
              <div className="theme-surface-subtle p-2">
                <span className="text-xs theme-text-muted block">{t.totalImages}</span>
                <span className="text-sm font-mono font-bold theme-text">{stats.imageCount}</span>
              </div>
            </div>

            {/* Export & Import Backup */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleExport}
                className="theme-btn-secondary flex items-center justify-center gap-1.5 py-2 px-3 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{t.exportBackup}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="theme-btn-secondary flex items-center justify-center gap-1.5 py-2 px-3 text-xs"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{t.importBackup}</span>
              </button>
            </div>

            {importStatus && (
              <p className="text-xs font-semibold theme-text text-center">{importStatus}</p>
            )}

            {/* Clear All Data */}
            <div className="pt-2">
              {showClearConfirm ? (
                <div className="p-3 border border-rose-500/40 bg-rose-500/10 theme-radius space-y-2">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-300 font-bold text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{t.clearAllConfirmTitle}</span>
                  </div>
                  <p className="text-[11px] text-rose-700 dark:text-rose-200">
                    {t.clearAllConfirmDesc}
                  </p>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="theme-btn-ghost px-2.5 py-1 text-xs"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="px-3 py-1 text-xs font-bold rounded bg-rose-600 text-white hover:bg-rose-700"
                    >
                      {t.confirm}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-rose-600 hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{t.clearAll}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
