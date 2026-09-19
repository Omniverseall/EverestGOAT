import React, { useState, useEffect } from 'react';
import { X, FileText, Check, Save, Sparkles, Globe } from 'lucide-react';
import { LANGUAGES, getTranslation } from '../i18n';
import { getActiveTemplates, saveActiveTemplates } from '../storage';

export default function TemplatesModal({
  isOpen,
  onClose,
  currentLang = 'uz_lat',
  templateLang = 'uz_lat',
  onChangeTemplateLang
}) {
  const [selectedLang, setSelectedLang] = useState(templateLang);
  const [templates, setTemplates] = useState([]);
  const [savedId, setSavedId] = useState(null);

  const t = (k) => getTranslation(currentLang, k);

  useEffect(() => {
    if (isOpen) {
      setSelectedLang(templateLang);
      setTemplates(getActiveTemplates(templateLang));
    }
  }, [isOpen, templateLang]);

  useEffect(() => {
    setTemplates(getActiveTemplates(selectedLang));
  }, [selectedLang]);

  if (!isOpen) return null;

  const handleTextChange = (id, newText) => {
    setTemplates(templates.map((tpl) => (tpl.id === id ? { ...tpl, template: newText } : tpl)));
  };

  const handleSave = (tpl) => {
    const updated = templates.map((item) => (item.id === tpl.id ? tpl : item));
    saveActiveTemplates(selectedLang, updated);
    setSavedId(tpl.id);
    setTimeout(() => setSavedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-[#E5E7EB] w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] bg-[#F5F7FA] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#DCE8FF] text-[#0154F8] flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#1C2329]">{t('templates_title')}</h2>
              <p className="text-xs text-slate-500 font-medium">{t('templates_subtitle')}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-[#1C2329] p-1.5 rounded-xl hover:bg-[#EBEDF0] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language selector for templates */}
        <div className="px-6 py-3 bg-[#F5F7FA] border-b border-[#E5E7EB] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1C2329]">
            <Globe className="w-4 h-4 text-[#0154F8]" />
            <span>{t('template_language')}</span>
          </div>

          <select
            value={selectedLang}
            onChange={(e) => {
              setSelectedLang(e.target.value);
              onChangeTemplateLang(e.target.value);
            }}
            className="px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#0154F8] focus:outline-none focus:ring-2 focus:ring-[#0154F8]/20 focus:border-[#0154F8] cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* Variables banner */}
        <div className="px-6 py-2.5 bg-[#DCE8FF]/50 border-b border-[#E5E7EB] text-[11px] text-[#0154F8] flex flex-wrap items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="font-bold">{t('available_vars')}</span>
          <code className="px-1.5 py-0.5 rounded-md bg-white text-[#0154F8] border border-[#0154F8]/20 font-mono text-[10px] font-bold">{'{ученик}'}</code>
          <code className="px-1.5 py-0.5 rounded-md bg-white text-[#0154F8] border border-[#0154F8]/20 font-mono text-[10px] font-bold">{'{родственник}'}</code>
          <code className="px-1.5 py-0.5 rounded-md bg-white text-[#0154F8] border border-[#0154F8]/20 font-mono text-[10px] font-bold">{'{группа}'}</code>
          <code className="px-1.5 py-0.5 rounded-md bg-white text-[#0154F8] border border-[#0154F8]/20 font-mono text-[10px] font-bold">{'{дни}'}</code>
          <code className="px-1.5 py-0.5 rounded-md bg-white text-[#0154F8] border border-[#0154F8]/20 font-mono text-[10px] font-bold">{'{расписание}'}</code>
          <code className="px-1.5 py-0.5 rounded-md bg-white text-[#0154F8] border border-[#0154F8]/20 font-mono text-[10px] font-bold">{'{минут}'}</code>
          <code className="px-1.5 py-0.5 rounded-md bg-white text-[#0154F8] border border-[#0154F8]/20 font-mono text-[10px] font-bold">{'{учитель}'}</code>
        </div>

        {/* Templates list */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-[#F5F7FA] border border-[#E5E7EB] rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#1C2329]">{tpl.title}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">{tpl.description}</p>
                </div>

                <button
                  onClick={() => handleSave(tpl)}
                  className="px-3.5 py-1.5 bg-[#0154F8] hover:bg-[#0047D4] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-xs"
                >
                  {savedId === tpl.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{t('saved')}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{t('save')}</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                rows={3}
                value={tpl.template}
                onChange={(e) => handleTextChange(tpl.id, e.target.value)}
                className="w-full p-3.5 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#1C2329] focus:outline-none focus:ring-2 focus:ring-[#0154F8]/20 focus:border-[#0154F8] font-sans leading-relaxed"
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E5E7EB] bg-[#F5F7FA] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#EBEDF0] hover:bg-[#DEE1E6] text-[#1C2329] rounded-xl text-xs sm:text-sm font-bold transition"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
