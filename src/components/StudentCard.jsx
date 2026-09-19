import React from 'react';
import { Send, Phone, User, MoreVertical, Trash2, Edit3 } from 'lucide-react';
import { getTranslation, formatStudentDays } from '../i18n';

export default function StudentCard({
  student,
  onComplaint,
  onEdit,
  onDelete,
  currentLang = 'uz_lat'
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const t = (k) => getTranslation(currentLang, k);
  const formattedDays = formatStudentDays(student.group_days, currentLang);

  return (
    <div className="bg-white hover:bg-white border border-[#E5E7EB] hover:border-[#0154F8]/40 rounded-[24px] p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-[#0154F8]/5 group relative">
      
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3.5">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-[#DCE8FF] text-[#0154F8] border border-[#0154F8]/20">
                {student.group_name}
              </span>
              {formattedDays && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBEDF0] text-[#1C2329] border border-[#E5E7EB]">
                  <span className="text-[10px]">📅</span>
                  <span>{formattedDays}</span>
                </span>
              )}
              {student.group_time && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="text-[10px]">⏰</span>
                  <span>{student.group_time}</span>
                </span>
              )}
            </div>
            <h3 className="text-lg font-black text-[#1C2329] group-hover:text-[#0154F8] transition flex items-center gap-2">
              <span className="text-base">{student.gender === 'female' ? '👧' : '👦'}</span>
              <span>{student.name}</span>
            </h3>
          </div>

          {/* Context Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 text-slate-400 hover:text-[#1C2329] rounded-xl hover:bg-[#EBEDF0] transition"
              title="Действия"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-40 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl z-20 py-1.5 text-xs text-[#1C2329]">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(student);
                    }}
                    className="w-full text-left px-3.5 py-2 text-[#1C2329] hover:bg-[#F5F7FA] font-semibold flex items-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#0154F8]" />
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(student);
                    }}
                    className="w-full text-left px-3.5 py-2 text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t('delete')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Parent / Relative Info */}
        <div className="bg-[#F5F7FA] rounded-2xl p-4 border border-[#E5E7EB] space-y-2 mb-5">
          <div className="flex items-center gap-2 text-xs">
            <User className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-slate-500 font-medium">{t('parent')}</span>
            <span className="font-bold text-[#1C2329] truncate">{student.parent_name}</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-slate-500 font-medium">{t('phone')}</span>
            <a
              href={`tel:${student.parent_phone}`}
              className="font-mono text-[#0154F8] font-bold hover:underline"
            >
              {student.parent_phone}
            </a>
          </div>

          {student.notes && (
            <div className="text-[11px] text-slate-500 border-t border-[#E5E7EB] pt-1.5 mt-1 truncate">
              💬 {student.notes}
            </div>
          )}
        </div>
      </div>

      {/* Main Complaint Action Button (Everest Tertiary Accent: #FF0A54) */}
      <button
        onClick={() => onComplaint(student)}
        className="w-full h-11 px-5 bg-[#FF0A54] hover:bg-[#E00747] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#FF0A54]/20 flex items-center justify-center gap-2 transition active:scale-[0.98]"
      >
        <Send className="w-4 h-4" />
        <span>{t('send_complaint')}</span>
      </button>

    </div>
  );
}
