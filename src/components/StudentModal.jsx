import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check, AlertCircle, Clock, Calendar } from 'lucide-react';
import { getTranslation, WEEKDAYS, TIME_SLOTS } from '../i18n';
import { normalizeUzPhone, formatUzPhoneMask } from '../storage';

export default function StudentModal({
  isOpen,
  onClose,
  onSave,
  student = null,
  existingGroups = [],
  currentLang = 'uz_lat'
}) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('male');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('+998 ');
  const [groupName, setGroupName] = useState('');
  const [groupDays, setGroupDays] = useState(['mon', 'wed', 'fri']);
  const [groupTime, setGroupTime] = useState('16:30 - 18:30');
  const [error, setError] = useState('');

  const t = (k) => getTranslation(currentLang, k);

  useEffect(() => {
    if (student) {
      setName(student.name || '');
      setGender(student.gender || 'male');
      setParentName(student.parent_name || '');
      setParentPhone(formatUzPhoneMask(student.parent_phone || ''));
      setGroupName(student.group_name || '');
      setGroupDays(Array.isArray(student.group_days) ? student.group_days : (student.group_days ? [student.group_days] : []));
      setGroupTime(student.group_time || '');
    } else {
      setName('');
      setGender('male');
      setParentName('');
      setParentPhone('+998 ');
      setGroupName(existingGroups[0] || '');
      setGroupDays(['mon', 'wed', 'fri']);
      setGroupTime('16:30 - 18:30');
    }
    setError('');
  }, [student, isOpen, existingGroups]);

  if (!isOpen) return null;

  const handlePhoneKeyDown = (e) => {
    const input = e.target;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;

    if (e.key === 'Backspace') {
      // Prevent deleting the '+998 ' country code
      if (start <= 5 && end <= 5) {
        e.preventDefault();
        return;
      }

      if (start === end) {
        const charBefore = parentPhone[start - 1];
        // If the character immediately before cursor is a formatting symbol: ')', ' ', '-', '('
        if (charBefore && !/\d/.test(charBefore)) {
          e.preventDefault();
          // Find the last digit index before cursor
          let targetIndex = start - 1;
          while (targetIndex >= 5 && !/\d/.test(parentPhone[targetIndex])) {
            targetIndex--;
          }
          if (targetIndex >= 5) {
            const before = parentPhone.slice(0, targetIndex);
            const after = parentPhone.slice(targetIndex + 1);
            const rawDigits = (before + after).replace(/[^\d]/g, '').slice(3); // drop 998
            const formatted = formatUzPhoneMask(rawDigits);
            setParentPhone(formatted);
            setTimeout(() => {
              const newPos = Math.max(5, targetIndex);
              input.setSelectionRange(newPos, newPos);
            }, 0);
          }
        }
      }
    } else if (e.key === 'Delete') {
      if (start === end) {
        const charAfter = parentPhone[start];
        // If the character right after cursor is a formatting symbol
        if (charAfter && !/\d/.test(charAfter)) {
          e.preventDefault();
          let targetIndex = start;
          while (targetIndex < parentPhone.length && !/\d/.test(parentPhone[targetIndex])) {
            targetIndex++;
          }
          if (targetIndex < parentPhone.length) {
            const before = parentPhone.slice(0, targetIndex);
            const after = parentPhone.slice(targetIndex + 1);
            const rawDigits = (before + after).replace(/[^\d]/g, '').slice(3);
            const formatted = formatUzPhoneMask(rawDigits);
            setParentPhone(formatted);
            setTimeout(() => {
              const newPos = Math.max(5, start);
              input.setSelectionRange(newPos, newPos);
            }, 0);
          }
        }
      }
    }
  };

  const handlePhoneChange = (e) => {
    const input = e.target;
    const oldPos = input.selectionStart || 0;
    const oldLen = parentPhone.length;
    const formatted = formatUzPhoneMask(e.target.value);
    setParentPhone(formatted);

    setTimeout(() => {
      const newLen = formatted.length;
      const diff = newLen - oldLen;
      const newPos = Math.max(5, Math.min(newLen, oldPos + (diff > 0 ? diff : 0)));
      input.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const toggleDay = (dayId) => {
    setGroupDays((prev) => {
      if (prev.includes(dayId)) {
        return prev.filter((d) => d !== dayId);
      } else {
        return [...prev, dayId];
      }
    });
  };

  const handlePresetDays = (preset) => {
    if (preset === 'mwf') setGroupDays(['mon', 'wed', 'fri']);
    else if (preset === 'tts') setGroupDays(['tue', 'thu', 'sat']);
    else if (preset === 'everyday') setGroupDays(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
    else if (preset === 'clear') setGroupDays([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !parentName.trim() || !parentPhone.trim() || !groupName.trim()) {
      setError('Iltimos, barcha majburiy maydonlarni to\'ldiring / Пожалуйста, заполните все обязательные поля');
      return;
    }

    const cleanPhone = normalizeUzPhone(parentPhone);
    if (cleanPhone.length < 10) {
      setError('Noto\'g\'ri telefon raqami / Введите корректный номер (+998 XX XXX XX XX)');
      return;
    }

    onSave({
      id: student?.id,
      name: name.trim(),
      gender: gender,
      parent_name: parentName.trim(),
      parent_phone: cleanPhone,
      group_name: groupName.trim(),
      group_days: groupDays,
      group_time: groupTime.trim(),
      notes: student?.notes || ''
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white border border-[#E5E7EB] w-full max-w-lg rounded-[24px] shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F5F7FA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DCE8FF] text-[#0154F8] flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-[#1C2329]">
              {student ? t('student_modal_edit') : t('student_modal_add')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-[#1C2329] p-1.5 rounded-xl hover:bg-[#EBEDF0] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Name */}
          <div>
            <label className="block text-xs font-bold text-[#1C2329] mb-1.5">
              {t('field_student_name')} <span className="text-[#FF0A54]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('field_student_name_ph')}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm text-[#1C2329] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0154F8]/20 focus:border-[#0154F8]"
            />
          </div>

          {/* Gender Selector */}
          <div>
            <label className="block text-xs font-bold text-[#1C2329] mb-1.5">
              {t('field_gender')} <span className="text-[#FF0A54]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition ${
                  gender === 'male'
                    ? 'bg-[#DCE8FF] border-[#0154F8] text-[#0154F8] ring-1 ring-[#0154F8] shadow-xs'
                    : 'bg-[#F5F7FA] border-[#E5E7EB] text-[#1C2329] hover:bg-[#EBEDF0]'
                }`}
              >
                <span className="text-base">👦</span>
                <span>{t('gender_male')}</span>
              </button>

              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition ${
                  gender === 'female'
                    ? 'bg-rose-50 border-rose-500 text-rose-600 ring-1 ring-rose-500 shadow-xs'
                    : 'bg-[#F5F7FA] border-[#E5E7EB] text-[#1C2329] hover:bg-[#EBEDF0]'
                }`}
              >
                <span className="text-base">👧</span>
                <span>{t('gender_female')}</span>
              </button>
            </div>
          </div>

          {/* Parent Name */}
          <div>
            <label className="block text-xs font-bold text-[#1C2329] mb-1.5">
              {t('field_parent_name')} <span className="text-[#FF0A54]">*</span>
            </label>
            <input
              type="text"
              required
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder={t('field_parent_name_ph')}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm text-[#1C2329] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0154F8]/20 focus:border-[#0154F8]"
            />
          </div>

          {/* Parent Phone with Uzbekistan auto-mask */}
          <div>
            <label className="block text-xs font-bold text-[#1C2329] mb-1.5">
              {t('field_parent_phone')} <span className="text-[#FF0A54]">*</span>
            </label>
            <input
              type="tel"
              required
              value={parentPhone}
              onChange={handlePhoneChange}
              onKeyDown={handlePhoneKeyDown}
              placeholder="+998 (90) 123-45-67"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-base text-[#0154F8] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0154F8]/20 focus:border-[#0154F8] font-mono font-bold tracking-wider"
            />
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              {t('field_parent_phone_hint')}
            </p>
          </div>

          {/* Group Name */}
          <div>
            <label className="block text-xs font-bold text-[#1C2329] mb-1.5">
              {t('field_group')} <span className="text-[#FF0A54]">*</span>
            </label>
            <input
              type="text"
              required
              list="existing-groups-datalist"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder=""
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm text-[#1C2329] focus:outline-none focus:ring-2 focus:ring-[#0154F8]/20 focus:border-[#0154F8] font-semibold"
            />
            <datalist id="existing-groups-datalist">
              {existingGroups.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>

            {existingGroups.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[11px] text-slate-500 font-medium mr-1 self-center">{t('quick_select')}</span>
                {existingGroups.map((g) => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setGroupName(g)}
                    className="px-2.5 py-1 text-xs bg-[#EBEDF0] hover:bg-[#DEE1E6] text-[#1C2329] font-bold rounded-lg border border-transparent transition"
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Group Class Days Selection (Mon to Sun multi-select + presets) */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label className="block text-xs font-bold text-[#1C2329] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0154F8]" />
                <span>{t('field_group_days')}</span>
              </label>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => handlePresetDays('mwf')}
                  className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-[#EBEDF0] hover:bg-[#DEE1E6] text-[#1C2329] transition"
                >
                  {t('preset_mwf')}
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetDays('tts')}
                  className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-[#EBEDF0] hover:bg-[#DEE1E6] text-[#1C2329] transition"
                >
                  {t('preset_tts')}
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetDays('everyday')}
                  className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-[#EBEDF0] hover:bg-[#DEE1E6] text-[#1C2329] transition"
                >
                  {t('preset_everyday')}
                </button>
                {groupDays.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handlePresetDays('clear')}
                    className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
                  >
                    {t('preset_clear')}
                  </button>
                )}
              </div>
            </div>

            {/* 7-day pill buttons (Mon-Sun) */}
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((day) => {
                const isSelected = groupDays.includes(day.id);
                return (
                  <button
                    type="button"
                    key={day.id}
                    onClick={() => toggleDay(day.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition text-center flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-[#0154F8] text-white border-[#0154F8] shadow-sm shadow-[#0154F8]/25'
                        : 'bg-[#F5F7FA] border-[#E5E7EB] text-[#1C2329] hover:bg-[#EBEDF0]'
                    }`}
                  >
                    <span>{day[currentLang] || day.ru}</span>
                    <span className="text-[10px] opacity-80 mt-0.5">
                      {isSelected ? '✓' : '•'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group Class Schedule Time (8 Shifts selection: 1-й: 08:30-10:30 ... 8-й: 22:30-00:30) */}
          <div>
            <label className="block text-xs font-bold text-[#1C2329] mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('field_group_time')}</span>
            </label>

            {/* Input for custom/selected time */}
            <input
              type="text"
              value={groupTime}
              onChange={(e) => setGroupTime(e.target.value)}
              placeholder={t('field_group_time_ph')}
              className="w-full px-3.5 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm text-[#1C2329] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0154F8]/20 focus:border-[#0154F8] mb-2 font-mono font-bold"
            />

            {/* 8 Shift Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {TIME_SLOTS.map((slot) => {
                const isSelected = groupTime === slot.time || groupTime === `${slot.label}: ${slot.time}`;
                return (
                  <button
                    type="button"
                    key={slot.shift}
                    onClick={() => setGroupTime(slot.time)}
                    className={`p-2 rounded-xl text-left border transition flex flex-col justify-center ${
                      isSelected
                        ? 'bg-[#DCE8FF] border-[#0154F8] text-[#0154F8] ring-1 ring-[#0154F8]/30 font-bold shadow-xs'
                        : 'bg-[#F5F7FA] border-[#E5E7EB] text-[#1C2329] hover:bg-[#EBEDF0]'
                    }`}
                  >
                    <span className="text-[11px] font-black text-[#0154F8]">
                      {slot.label}
                    </span>
                    <span className="text-[11px] font-mono text-[#1C2329] font-bold">
                      {slot.time}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-[#EBEDF0] hover:bg-[#DEE1E6] text-[#1C2329] rounded-xl text-xs sm:text-sm font-bold transition"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0154F8] hover:bg-[#0047D4] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-[#0154F8]/20 transition flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{student ? t('save') : t('add_student')}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
