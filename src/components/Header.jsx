import React from 'react';
import { Settings, FileText, Search, Globe } from 'lucide-react';
import { LANGUAGES, getTranslation } from '../i18n';

export default function Header({
  searchTerm,
  setSearchTerm,
  onOpenSettings,
  onOpenTemplates,
  currentLang = 'uz_lat',
  onChangeLang
}) {
  const t = (k) => getTranslation(currentLang, k);

  return (
    <header className="border-b border-[#E5E7EB] bg-white/95 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand with Official Everest Logo */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Everest LC"
                className="h-10 w-auto object-contain max-w-[140px]"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-[#1C2329]">Everest LC</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#DCE8FF] text-[#0154F8] border border-[#0154F8]/20">
                  {t('app_badge')}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{t('app_subtitle')}</p>
            </div>
          </div>

          {/* Mobile Language & Settings */}
          <div className="md:hidden flex items-center gap-1.5">
            <select
              value={currentLang}
              onChange={(e) => onChangeLang(e.target.value)}
              className="bg-[#F5F7FA] text-xs font-semibold text-[#1C2329] border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
            <button
              onClick={onOpenSettings}
              className="p-2 bg-[#EBEDF0] text-[#1C2329] rounded-xl hover:bg-[#DEE1E6] transition"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80 lg:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full pl-10 pr-4 py-2 bg-[#F5F7FA] hover:bg-white focus:bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#1C2329] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0154F8]/20 focus:border-[#0154F8] transition shadow-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-2">
          
          {/* Language Selector Dropdown */}
          <div className="relative flex items-center">
            <Globe className="w-3.5 h-3.5 text-slate-500 absolute left-3 pointer-events-none" />
            <select
              value={currentLang}
              onChange={(e) => onChangeLang(e.target.value)}
              className="pl-8 pr-3 py-2 bg-[#F5F7FA] hover:bg-[#EBEDF0] text-[#1C2329] border border-[#E5E7EB] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0154F8]/20 focus:border-[#0154F8] transition cursor-pointer"
              title={t('site_language')}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenTemplates}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#EBEDF0] hover:bg-[#DEE1E6] text-[#1C2329] rounded-xl text-xs font-bold transition"
            title={t('templates')}
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>{t('templates')}</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2.5 bg-[#EBEDF0] hover:bg-[#DEE1E6] text-[#1C2329] rounded-xl transition"
            title={t('settings')}
          >
            <Settings className="w-4 h-4 text-slate-700" />
          </button>

        </div>

      </div>
    </header>
  );
}
