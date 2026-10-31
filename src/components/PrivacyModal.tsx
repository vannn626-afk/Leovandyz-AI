import React from 'react';
import { ShieldCheck, HardDrive, Cpu, UserCheck, X } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../services/translations';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;
  const t = translations[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="theme-surface-elevated relative w-full max-w-lg p-6 space-y-5 max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 theme-border-b">
          <div className="flex items-center gap-2 font-bold text-base theme-text">
            <ShieldCheck className="h-5 w-5" />
            <span>{t.privacyTitle}</span>
          </div>
          <button
            onClick={onClose}
            className="theme-btn-ghost p-1"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs theme-text leading-relaxed">
          <div className="theme-surface-subtle p-3.5 space-y-1">
            <h2 className="font-bold theme-text flex items-center gap-1.5 text-sm">
              <UserCheck className="h-4 w-4" />
              <span>{t.privacySection1Title}</span>
            </h2>
            <p className="theme-text-secondary">{t.privacySection1Desc}</p>
          </div>

          <div className="theme-surface-subtle p-3.5 space-y-1">
            <h2 className="font-bold theme-text flex items-center gap-1.5 text-sm">
              <HardDrive className="h-4 w-4" />
              <span>{t.privacySection2Title}</span>
            </h2>
            <p className="theme-text-secondary">{t.privacySection2Desc}</p>
          </div>

          <div className="theme-surface-subtle p-3.5 space-y-1">
            <h2 className="font-bold theme-text flex items-center gap-1.5 text-sm">
              <Cpu className="h-4 w-4" />
              <span>{t.privacySection3Title}</span>
            </h2>
            <p className="theme-text-secondary">{t.privacySection3Desc}</p>
          </div>

          <div className="theme-surface-subtle p-3.5 space-y-1">
            <h2 className="font-bold theme-text flex items-center gap-1.5 text-sm">
              <ShieldCheck className="h-4 w-4" />
              <span>{t.privacySection4Title}</span>
            </h2>
            <p className="theme-text-secondary">{t.privacySection4Desc}</p>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="theme-btn-primary w-full py-2.5 text-xs font-bold"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
