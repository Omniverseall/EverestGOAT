import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  BookX,
  Clock,
  UserX,
  CreditCard,
  AlertTriangle,
  MessageSquareText,
  CheckCircle2,
  Smartphone,
  Sparkles,
  Edit2,
  Globe
} from 'lucide-react';
import { LANGUAGES, getTranslation, formatStudentDays } from '../i18n';
import {
  getActiveTemplates,
  compileComplaintText,
  getStoredSettings
} from '../storage';
import { sendSmsViaServer } from '../api';

export default function ComplaintModal({
  isOpen,
  onClose,
  student,
  onComplaintSent,
  currentLang = 'uz_lat',
  templateLang = 'uz_lat',
  onChangeTemplateLang,
  onOpenSettings
}) {
  const [selectedType, setSelectedType] = useState('homework');
  const [minutes, setMinutes] = useState('15');
  const [customComment, setCustomComment] = useState('');
  const [editedText, setEditedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const t = (k) => getTranslation(currentLang, k);
  const settings = getStoredSettings();
  const templates = getActiveTemplates(templateLang);

  // Compile message text automatically using student's stored gender
  useEffect(() => {
    if (!student || !isOpen) return;

    setSendResult(null);
    setIsEditing(false);

    const tplObj = templates.find((tpl) => tpl.id === selectedType) || templates[0];
    if (tplObj) {
      const compiled = compileComplaintText({
        template: tplObj.template,
        student,
        gender: student.gender || 'male',
        minutes: selectedType === 'late' ? minutes : undefined,
        comment: customComment,
        teacherName: settings.teacher_name,
        lang: templateLang
      });
      setEditedText(compiled);
    }
  }, [student, selectedType, minutes, customComment, templateLang, isOpen]);

  if (!isOpen || !student) return null;

  // Icons map
  const getIcon = (id) => {
    switch (id) {
      case 'homework': return <BookX className="w-5 h-5" />;
      case 'late': return <Clock className="w-5 h-5" />;
      case 'absent': return <UserX className="w-5 h-5" />;
      case 'unpaid': return <CreditCard className="w-5 h-5" />;
      case 'disruptive': return <AlertTriangle className="w-5 h-5" />;
      default: return <MessageSquareText className="w-5 h-5" />;
    }
  };

  const getColor = (id) => {
    switch (id) {
      case 'homework': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'late': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'absent': return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'unpaid': return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'disruptive': return 'text-[#FF0A54] bg-rose-50 border-rose-200';
      default: return 'text-[#0154F8] bg-[#DCE8FF] border-[#0154F8]/30';
    }
  };

  const handleSendViaGateway = async () => {
    setSending(true);
    setSendResult(null);

    const currentTpl = templates.find((t) => t.id === selectedType);
    const complaintTitle = currentTpl ? currentTpl.title : 'Shikoyat';

    try {
      const result = await sendSmsViaServer({
        mode: settings.gateway_mode || 'cloud',
        ip: settings.gateway_ip || '192.168.100.119',
        port: settings.gateway_port || '8080',
        login: settings.gateway_login || 'sms',
        password: settings.gateway_password || '12345678',
        cloudUrl: settings.cloud_url,
        cloudLogin: settings.cloud_login || 'GTREYM',
        cloudPassword: settings.cloud_password || 'qmi0tt1znyb3kh',
        phone: student.parent_phone,
        message: editedText,
        studentId: student.id,
        studentName: student.name,
        parentName: student.parent_name,
        groupName: student.group_name,
        complaintType: complaintTitle,
        minutesLate: selectedType === 'late' ? Number(minutes) : null
      });

      setSendResult({
        success: result.success,
        errorMessage: result.errorMessage
      });

      if (onComplaintSent) onComplaintSent();
    } catch (err) {
      setSendResult({
        success: false,
        errorMessage: err.message || 'SMS yuborishda xatolik yuz berdi'
      });
      if (onComplaintSent) onComplaintSent();
    } finally {
      setSending(false);
    }
  };

  const handleOpenDeviceSms = () => {
    const clean = (student.parent_phone || '').replace(/[^\d+]/g, '');
    const url = `sms:${clean}?body=${encodeURIComponent(editedText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white border border-[#E5E7EB] w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden my-6">
        
        {/* Header with Student info and breathing space */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] bg-[#F5F7FA] flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">📢</span>
              <h2 className="text-lg font-black text-[#1C2329]">{t('complaint_title')}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#DCE8FF] border border-[#0154F8]/20 text-[#0154F8] font-bold font-mono">
                {student.group_name}
              </span>
              {student.group_days && formatStudentDays(student.group_days, currentLang) && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EBEDF0] border border-[#E5E7EB] text-[#1C2329] font-semibold">
                  📅 {formatStudentDays(student.group_days, currentLang)}
                </span>
              )}
              {student.group_time && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
                  ⏰ {student.group_time}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              <strong className="text-[#1C2329]">{student.gender === 'female' ? '👧' : '👦'} {student.name}</strong> • {t('parent')} <span className="text-[#1C2329] font-bold">{student.parent_name}</span> ({student.parent_phone})
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-[#1C2329] p-1.5 rounded-xl hover:bg-[#EBEDF0] transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with spacious vertical rhythm */}
        <div className="p-6 space-y-6">
          
          {/* Template Language Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#F5F7FA] p-3.5 rounded-2xl border border-[#E5E7EB]">
            <div className="flex items-center gap-2 text-xs text-[#1C2329] font-bold">
              <Globe className="w-4 h-4 text-[#0154F8]" />
              <span>{t('template_language')}</span>
            </div>

            <select
              value={templateLang}
              onChange={(e) => onChangeTemplateLang(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#0154F8] focus:outline-none focus:ring-2 focus:ring-[#0154F8]/20 focus:border-[#0154F8] cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* 1. Complaint Types Grid */}
          <div>
            <label className="block text-xs font-bold text-[#1C2329] uppercase tracking-wider mb-3">
              {t('step1_type')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {templates.map((type) => {
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all min-h-[90px] ${
                      isSelected
                        ? 'bg-[#DCE8FF]/60 border-[#0154F8] shadow-sm ring-2 ring-[#0154F8]'
                        : 'bg-[#F5F7FA] border-[#E5E7EB] hover:bg-[#EBEDF0]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-1.5 rounded-xl border ${getColor(type.id)}`}>
                        {getIcon(type.id)}
                      </div>
                      {isSelected && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0154F8] ring-2 ring-[#0154F8]/30"></span>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[#1C2329] leading-snug">
                      {type.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Extra inputs if Late */}
          {selectedType === 'late' && (
            <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 space-y-3 animate-in fade-in">
              <label className="block text-xs font-bold text-orange-950">
                {t('minutes_late_label')}
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="w-20 px-3 py-1.5 bg-white border border-orange-300 rounded-xl text-sm text-center font-bold text-orange-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-xs text-orange-900 font-semibold">{t('minutes_unit')}</span>

                {/* Quick minutes pills */}
                <div className="flex flex-wrap gap-1.5">
                  {['5', '10', '15', '20', '30', '45'].map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setMinutes(m)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-bold transition ${
                        minutes === m
                          ? 'bg-orange-600 text-white'
                          : 'bg-white hover:bg-orange-100 text-orange-900 border border-orange-200'
                      }`}
                    >
                      +{m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. Extra input if Custom */}
          {selectedType === 'custom' && (
            <div className="space-y-2 animate-in fade-in">
              <label className="block text-xs font-bold text-[#1C2329]">
                {t('custom_comment_label')}
              </label>
              <textarea
                rows={2}
                value={customComment}
                onChange={(e) => setCustomComment(e.target.value)}
                placeholder={t('custom_comment_ph')}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#1C2329] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0154F8]/20 focus:border-[#0154F8]"
              />
            </div>
          )}

          {/* 4. Generated Message Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#1C2329] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{t('step2_preview')}</span>
              </label>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs text-[#0154F8] hover:text-[#0047D4] font-bold flex items-center gap-1 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEditing ? t('done_editing') : t('manual_edit')}</span>
              </button>
            </div>

            <div className="relative">
              {isEditing ? (
                <textarea
                  rows={5}
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full p-4 bg-[#F5F7FA] border border-[#0154F8] rounded-2xl text-xs sm:text-sm text-[#1C2329] focus:outline-none focus:ring-2 focus:ring-[#0154F8]/20 font-sans leading-relaxed"
                />
              ) : (
                <div className="p-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-2xl text-xs sm:text-sm text-[#1C2329] leading-relaxed font-sans select-all">
                  {editedText}
                </div>
              )}

              <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-500 font-medium">
                <span>{t('recipient')} <strong className="text-[#0154F8] font-mono">{student.parent_phone}</strong></span>
                <span>{t('char_count')} {(editedText || '').length}</span>
              </div>
            </div>
          </div>

          {/* Result / Error notification */}
          {sendResult && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 animate-in fade-in ${
                sendResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {sendResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-bold mb-1">
                  {sendResult.success ? t('success_sent') : t('error_sent')}
                </div>
                {sendResult.errorMessage && (
                  <p className="text-xs text-rose-700 leading-relaxed font-medium">
                    {sendResult.errorMessage}
                  </p>
                )}
                {!sendResult.success && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onOpenSettings) onOpenSettings();
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-rose-100 border border-rose-300 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>{t('settings')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenDeviceSms}
                      className="px-3.5 py-1.5 bg-[#EBEDF0] hover:bg-[#DEE1E6] text-[#1C2329] rounded-xl text-xs font-bold"
                    >
                      <span>{t('open_native_sms')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions (Everest LC styling) */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#F5F7FA] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#EBEDF0] hover:bg-[#DEE1E6] text-[#1C2329] rounded-xl text-xs sm:text-sm font-bold transition"
          >
            {t('close')}
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenDeviceSms}
              className="px-4 py-2.5 bg-white hover:bg-[#EBEDF0] text-[#1C2329] rounded-xl text-xs sm:text-sm font-bold border border-[#E5E7EB] transition"
              title={t('open_native_sms')}
            >
              {t('open_native_sms')}
            </button>

            <button
              type="button"
              disabled={sending}
              onClick={handleSendViaGateway}
              className="w-full sm:w-auto px-7 py-2.5 bg-[#FF0A54] hover:bg-[#E00747] text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-[#FF0A54]/25 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{t('sending')}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{t('send_via_phone')}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
