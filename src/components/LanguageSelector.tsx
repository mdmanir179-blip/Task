import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { Language, SUPPORTED_LANGUAGES } from '../utils/i18n';

interface LanguageSelectorProps {
  currentLang: Language;
  onSelectLanguage: (lang: Language) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLang,
  onSelectLanguage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeOption =
    SUPPORTED_LANGUAGES.find((opt) => opt.code === currentLang) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer border border-slate-200 dark:border-slate-700"
        title="Select Language / ভাষা নির্বাচন / भाषा चुनें"
      >
        <span className="text-sm leading-none">{activeOption.flag}</span>
        <span className="font-semibold text-[11px] hidden sm:inline">{activeOption.nativeLabel}</span>
        <span className="font-semibold text-[11px] sm:hidden uppercase">{activeOption.code}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-fade-in">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-indigo-500" />
            <span>Select Language</span>
          </div>

          <div className="py-1">
            {SUPPORTED_LANGUAGES.map((item) => {
              const isSelected = item.code === currentLang;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    onSelectLanguage(item.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{item.flag}</span>
                    <div>
                      <div className="text-xs font-semibold leading-tight">{item.nativeLabel}</div>
                      <div className="text-[10px] text-slate-400 leading-none">{item.label}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
