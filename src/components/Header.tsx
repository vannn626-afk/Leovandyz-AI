import React, { useState } from 'react';
import {
  Menu,
  ChevronDown,
  Globe,
  Settings,
  Zap,
  Code2,
  FileText,
  Image as ImageIcon,
  GraduationCap,
  MessageSquare,
  Palette,
  Check,
} from 'lucide-react';
import { AppMode, AppTheme, Language } from '../types';
import { AVAILABLE_MODELS, THEME_DEFINITIONS, translations } from '../services/translations';

interface HeaderProps {
  currentMode: AppMode;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  webSearchActive: boolean;
  onToggleWebSearch: () => void;
  lang: Language;
  onToggleLanguage: () => void;
  theme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
  onOpenMobileSidebar: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  selectedModel,
  onSelectModel,
  webSearchActive,
  onToggleWebSearch,
  lang,
  onToggleLanguage,
  theme,
  onSelectTheme,
  onOpenMobileSidebar,
  onOpenSettings,
}) => {
  const t = translations[lang];
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  const getModeInfo = (mode: AppMode) => {
    switch (mode) {
      case 'coding':
        return { label: t.codingTab, icon: <Code2 className="h-3.5 w-3.5 shrink-0" /> };
      case 'images':
        return { label: t.imagesTab, icon: <ImageIcon className="h-3.5 w-3.5 shrink-0" /> };
      case 'documents':
        return { label: t.documentsTab, icon: <FileText className="h-3.5 w-3.5 shrink-0" /> };
      case 'study':
        return { label: t.studyTab, icon: <GraduationCap className="h-3.5 w-3.5 shrink-0" /> };
      default:
        return { label: t.chatTab, icon: <MessageSquare className="h-3.5 w-3.5 shrink-0" /> };
    }
  };

  const currentModeInfo = getModeInfo(currentMode);
  const activeModelObj = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];
  const activeThemeObj = THEME_DEFINITIONS.find((th) => th.id === theme) || THEME_DEFINITIONS[0];

  return (
    <header className="theme-header relative z-30 flex h-12 shrink-0 items-center justify-between px-2.5 sm:px-4">
      {/* Left zone: Drawer Hamburger & Mode Title */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="theme-btn-secondary flex h-8 w-8 shrink-0 items-center justify-center lg:hidden"
          title="Buka Menu"
          aria-label="Buka Menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="theme-surface-subtle flex h-7 w-7 shrink-0 items-center justify-center">
            {currentModeInfo.icon}
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-tight theme-text truncate max-w-[85px] xs:max-w-[120px] sm:max-w-none">
            {currentModeInfo.label}
          </span>
        </div>
      </div>

      {/* Right zone: Model Selector, Theme Selector, Search, Lang, Settings */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Model Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setModelDropdownOpen(!modelDropdownOpen);
              setThemeDropdownOpen(false);
            }}
            className="theme-btn-secondary flex h-8 items-center gap-1 px-2 sm:px-2.5 text-xs font-semibold cursor-pointer"
            title="Pilih Model AI"
          >
            <Zap className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span className="max-w-[70px] xs:max-w-[90px] sm:max-w-[110px] truncate">
              {activeModelObj.name.replace('Gemini ', '')}
            </span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
          </button>

          {modelDropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs"
                onClick={() => setModelDropdownOpen(false)}
              />
              {/* Responsive Dropdown: Constrained on mobile, right-aligned on desktop */}
              <div className="theme-surface-elevated fixed sm:absolute top-13 sm:top-full left-2 right-2 sm:left-auto sm:right-0 max-w-sm sm:w-72 mx-auto sm:mx-0 sm:mt-1.5 z-50 p-2 max-h-[75vh] overflow-y-auto">
                <div className="flex items-center justify-between px-2 py-1 border-b theme-border mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider theme-text-muted">
                    Pilih Model Gemini
                  </span>
                  <span className="text-[10px] font-mono theme-text-muted">v2.4 SDK</span>
                </div>
                <div className="space-y-1">
                  {AVAILABLE_MODELS.map((model) => {
                    const isSelected = model.id === selectedModel;
                    return (
                      <button
                        key={model.id}
                        onClick={() => {
                          onSelectModel(model.id);
                          setModelDropdownOpen(false);
                        }}
                        className={`flex w-full flex-col p-2 text-left transition-colors theme-radius cursor-pointer ${
                          isSelected
                            ? 'theme-btn-primary'
                            : 'hover:bg-[var(--bg-surface-subtle)] theme-text'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{model.name}</span>
                          {model.badge && (
                            <span className="theme-badge text-[9px] py-0 px-1.5">
                              {model.badge}
                            </span>
                          )}
                        </div>
                        <p className={`mt-0.5 text-[11px] leading-snug ${isSelected ? 'opacity-90' : 'theme-text-muted'}`}>
                          {model.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Theme Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setThemeDropdownOpen(!themeDropdownOpen);
              setModelDropdownOpen(false);
            }}
            className="theme-btn-secondary flex h-8 items-center gap-1 px-2 sm:px-2.5 text-xs font-medium cursor-pointer"
            title="Ganti Tema (8 Pilihan)"
          >
            <Palette className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden md:inline max-w-[95px] truncate">
              {lang === 'id' ? activeThemeObj.name.split('. ')[1] : activeThemeObj.nameEn.split('. ')[1]}
            </span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
          </button>

          {themeDropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs"
                onClick={() => setThemeDropdownOpen(false)}
              />
              {/* Responsive Dropdown */}
              <div className="theme-surface-elevated fixed sm:absolute top-13 sm:top-full left-2 right-2 sm:left-auto sm:right-0 max-w-sm sm:w-72 mx-auto sm:mx-0 sm:mt-1.5 z-50 p-2 max-h-[75vh] overflow-y-auto">
                <div className="flex items-center justify-between px-2 py-1 border-b theme-border mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider theme-text-muted">
                    {t.themeLabel}
                  </span>
                  <span className="text-[10px] theme-text-muted">8 Tema Visual</span>
                </div>
                <div className="space-y-1">
                  {THEME_DEFINITIONS.map((th) => {
                    const isSelected = th.id === theme;
                    return (
                      <button
                        key={th.id}
                        onClick={() => {
                          onSelectTheme(th.id);
                          setThemeDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between p-2 text-left transition-colors theme-radius cursor-pointer ${
                          isSelected
                            ? 'theme-btn-primary'
                            : 'hover:bg-[var(--bg-surface-subtle)] theme-text'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="inline-block h-3.5 w-3.5 rounded-sm border shrink-0"
                            style={{
                              backgroundColor: th.palette.accent,
                              borderColor: th.palette.border,
                            }}
                          />
                          <span className="text-xs font-semibold truncate">
                            {lang === 'id' ? th.name : th.nameEn}
                          </span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Web Search Grounding Toggle (Desktop only in header, mobile has it in Composer) */}
        <button
          onClick={onToggleWebSearch}
          className={`hidden md:flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium cursor-pointer transition-colors ${
            webSearchActive ? 'theme-btn-primary' : 'theme-btn-secondary'
          }`}
          title={webSearchActive ? t.webSearchActive : t.webSearch}
        >
          <Globe className="h-3.5 w-3.5 shrink-0" />
          <span>Web Search</span>
        </button>

        {/* Language Switcher (Visible on sm+ screens, available in Settings for all) */}
        <button
          onClick={onToggleLanguage}
          className="hidden sm:flex theme-btn-secondary h-8 items-center px-2 text-xs font-bold cursor-pointer"
          title="Ganti Bahasa (ID/EN)"
        >
          {lang.toUpperCase()}
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="theme-btn-secondary flex h-8 w-8 shrink-0 items-center justify-center cursor-pointer"
          title={t.settings}
          aria-label={t.settings}
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
