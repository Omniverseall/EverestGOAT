import React, { useState, useEffect } from 'react';
import { X, Settings, Check, Wifi, Cloud, AlertTriangle, CheckCircle2, Save, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { LANGUAGES, getTranslation } from '../i18n';
import { getStoredSettings, saveStoredSettings } from '../storage';
import { testGatewayConnection } from '../api';

export default function SettingsModal({
  isOpen,
  onClose,
  currentLang = 'uz_lat',
  onChangeLang,
  templateLang = 'uz_lat',
  onChangeTemplateLang
}) {
  const [settings, setSettings] = useState(getStoredSettings());
  const [showHelper, setShowHelper] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const t = (k) => getTranslation(currentLang, k);

  useEffect(() => {
    if (isOpen) {
      setSettings(getStoredSettings());
      setTestResult(null);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testGatewayConnection({
        mode: settings.gateway_mode,
        ip: settings.gateway_ip,
        port: settings.gateway_port,
        login: settings.gateway_login,
        password: settings.gateway_password,
        cloudUrl: settings.cloud_url,
        cloudLogin: settings.cloud_login,
        cloudPassword: settings.cloud_password
      });
      setTestResult(res);
    } catch (err) {
      setTestResult({
        success: false,
        error: err.message
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveStoredSettings(settings);
    onChangeLang(settings.ui_lang);
    onChangeTemplateLang(settings.template_lang);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white border border-[#E5E7EB] w-full max-w-xl rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-4">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] bg-[#F5F7FA] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#DCE8FF] text-[#0154F8] flex items-center justify-center font-bold">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#1C2329]">{t('settings_title')}</h2>
              <p className="text-xs text-slate-500 font-medium">{t('settings_subtitle')}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-[#1C2329] p-1.5 rounded-xl hover:bg-[#EBEDF0] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs sm:text-sm">
          
          {/* Quick Guide */}
          <div className="p-3.5 rounded-2xl bg-[#DCE8FF]/50 border border-[#0154F8]/20 text-[#1C2329] space-y-2">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowHelper(!showHelper)}
            >
              <div className="flex items-center gap-1.5 font-bold text-[#0154F8] text-xs sm:text-sm">
                <HelpCircle className="w-4 h-4 text-[#0154F8] shrink-0" />
                <span>📱 Настройки подключения Android SMS</span>
              </div>
              {showHelper ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>

            {showHelper && (
              <div className="pt-2 text-[11px] leading-relaxed text-[#1C2329] space-y-2 border-t border-[#0154F8]/15">
                <p className="font-medium text-slate-600">
                  Все данные из приложения на телефоне уже предзаполнены:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E7EB] space-y-1">
                    <span className="font-bold text-emerald-700">1. Локальный сервер (Wi-Fi):</span>
                    <div>• IP: <code className="text-[#0154F8] font-mono font-bold">192.168.100.119</code></div>
                    <div>• Порт: <code className="text-[#0154F8] font-mono font-bold">8080</code></div>
                    <div>• Логин: <code className="text-[#0154F8] font-mono font-bold">sms</code></div>
                    <div>• Пароль: <code className="text-[#0154F8] font-mono font-bold">12345678</code></div>
                    <div className="text-[10px] text-slate-500 pt-0.5">В одной сети Wi-Fi.</div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E7EB] space-y-1">
                    <span className="font-bold text-[#0154F8]">2. Облачный сервер (Cloud):</span>
                    <div>• Сервер: <code className="text-[#0154F8] font-mono font-bold">api.sms-gate.app</code></div>
                    <div>• Логин: <code className="text-[#0154F8] font-mono font-bold">GTREYM</code></div>
                    <div>• Пароль: <code className="text-[#0154F8] font-mono font-bold">qmi0tt1znyb3kh</code></div>
                    <div className="text-[10px] text-slate-500 pt-0.5">Работает везде, через любой интернет.</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mode Switch Tabs */}
          <div>
            <label className="block text-xs font-bold text-[#1C2329] uppercase tracking-wider mb-2">
              {t('gateway_mode')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, gateway_mode: 'local' })}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                  settings.gateway_mode === 'local'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                    : 'bg-[#F5F7FA] border-[#E5E7EB] text-[#1C2329] hover:bg-[#EBEDF0]'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>{t('mode_local')}</span>
              </button>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, gateway_mode: 'cloud' })}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                  settings.gateway_mode === 'cloud'
                    ? 'bg-[#DCE8FF] border-[#0154F8] text-[#0154F8] shadow-xs'
                    : 'bg-[#F5F7FA] border-[#E5E7EB] text-[#1C2329] hover:bg-[#EBEDF0]'
                }`}
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>{t('mode_cloud')}</span>
              </button>
            </div>
          </div>

          {/* LOCAL SERVER FIELDS */}
          {settings.gateway_mode === 'local' ? (
            <div className="space-y-3 p-3.5 rounded-2xl bg-[#F5F7FA] border border-[#E5E7EB] animate-in fade-in">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-[#1C2329] mb-1">
                    {t('field_ip')}
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.gateway_ip}
                    onChange={(e) => setSettings({ ...settings, gateway_ip: e.target.value })}
                    placeholder="192.168.100.119"
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-mono text-[#1C2329] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0154F8]/20 focus:border-[#0154F8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C2329] mb-1">
                    {t('field_port')}
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.gateway_port}
                    onChange={(e) => setSettings({ ...settings, gateway_port: e.target.value })}
                    placeholder="8080"
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-mono text-[#1C2329] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0154F8]/20 focus:border-[#0154F8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#1C2329] mb-1">
                    {t('field_login')}
                  </label>
                  <input
                    type="text"
                    value={settings.gateway_login}
                    onChange={(e) => setSettings({ ...settings, gateway_login: e.target.value })}
                    placeholder="sms"
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-mono text-[#1C2329] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0154F8]/20 focus:border-[#0154F8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C2329] mb-1">
                    {t('field_password')}
                  </label>
                  <input
                    type="text"
                    value={settings.gateway_password}
                    onChange={(e) => setSettings({ ...settings, gateway_password: e.target.value })}
                    placeholder="12345678"
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-mono text-[#1C2329] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0154F8]/20 focus:border-[#0154F8]"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* CLOUD SERVER FIELDS */
            <div className="space-y-3 p-3.5 rounded-2xl bg-[#F5F7FA] border border-[#E5E7EB] animate-in fade-in">
              <div>
                <label className="block text-xs font-bold text-[#1C2329] mb-1">
                  {t('field_cloud_url')}
                </label>
                <input
                  type="text"
                  value={settings.cloud_url}
                  onChange={(e) => setSettings({ ...settings, cloud_url: e.target.value })}
                  placeholder="https://api.sms-gate.app/3rdparty/v1/message"
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-mono text-[#1C2329] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0154F8]/20 focus:border-[#0154F8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#1C2329] mb-1">
                    {t('field_cloud_login')}
                  </label>
                  <input
                    type="text"
                    value={settings.cloud_login}
                    onChange={(e) => setSettings({ ...settings, cloud_login: e.target.value })}
                    placeholder="GTREYM"
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-mono text-[#1C2329] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0154F8]/20 focus:border-[#0154F8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C2329] mb-1">
                    {t('field_cloud_password')}
                  </label>
                  <input
                    type="text"
                    value={settings.cloud_password}
                    onChange={(e) => setSettings({ ...settings, cloud_password: e.target.value })}
                    placeholder="qmi0tt1znyb3kh"
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-mono text-[#1C2329] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0154F8]/20 focus:border-[#0154F8]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Teacher Signature */}
          <div>
            <label className="block text-xs font-bold text-[#1C2329] mb-1">
              {t('teacher_signature')}
            </label>
            <input
              type="text"
              value={settings.teacher_name}
              onChange={(e) => setSettings({ ...settings, teacher_name: e.target.value })}
              placeholder="Ustoz / Преподаватель"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#1C2329] font-medium focus:outline-none focus:ring-2 focus:ring-[#0154F8]/20 focus:border-[#0154F8]"
            />
          </div>

          {/* Languages in Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#1C2329] mb-1">
                {t('site_language')}
              </label>
              <select
                value={settings.ui_lang}
                onChange={(e) => setSettings({ ...settings, ui_lang: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1C2329] focus:outline-none focus:ring-2 focus:ring-[#0154F8]/20 focus:border-[#0154F8]"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C2329] mb-1">
                {t('template_language')}
              </label>
              <select
                value={settings.template_lang}
                onChange={(e) => setSettings({ ...settings, template_lang: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1C2329] focus:outline-none focus:ring-2 focus:ring-[#0154F8]/20 focus:border-[#0154F8]"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Test connection action */}
          <div className="pt-2">
            <button
              type="button"
              disabled={testing}
              onClick={handleTest}
              className="w-full py-2.5 bg-white hover:bg-[#F5F7FA] text-[#0154F8] border border-[#0154F8]/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 shadow-xs"
            >
              <Wifi className={`w-3.5 h-3.5 ${testing ? 'animate-pulse' : ''}`} />
              <span>{testing ? t('testing_connection') : t('test_connection')}</span>
            </button>

            {testResult && (
              <div
                className={`mt-2.5 p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">
                    {testResult.success ? t('conn_success') : t('conn_fail')}
                  </div>
                  <div className="text-[11px] opacity-90 mt-0.5 font-medium">
                    {testResult.message || testResult.error}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            🔒 {t('storage_notice')}
          </div>

          {/* Footer Save Button */}
          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-xs text-emerald-700 flex items-center gap-1 font-bold">
                <Check className="w-3.5 h-3.5" /> {t('saved')}
              </span>
            ) : (
              <span></span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-[#EBEDF0] hover:bg-[#DEE1E6] text-[#1C2329] rounded-xl text-xs font-bold transition"
              >
                {t('close')}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0154F8] hover:bg-[#0047D4] text-white rounded-xl text-xs font-bold shadow-md shadow-[#0154F8]/20 transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t('save')}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
