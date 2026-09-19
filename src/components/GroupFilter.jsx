import React from 'react';
import { Layers } from 'lucide-react';
import { getTranslation } from '../i18n';

export default function GroupFilter({
  groups = [],
  selectedGroup = 'all',
  onSelectGroup,
  students = [],
  currentLang = 'uz_lat'
}) {
  const t = (k) => getTranslation(currentLang, k);

  // Calculate counts per group
  const counts = students.reduce((acc, s) => {
    if (s.group_name) {
      acc[s.group_name] = (acc[s.group_name] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 scrollbar-none">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase tracking-wider mr-2 shrink-0">
        <Layers className="w-3.5 h-3.5 text-[#0154F8]" />
        <span>{t('groups')}</span>
      </div>

      {/* "All" button */}
      <button
        onClick={() => onSelectGroup('all')}
        className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition flex items-center gap-2 ${
          selectedGroup === 'all'
            ? 'bg-[#0154F8] text-white shadow-sm shadow-[#0154F8]/30'
            : 'bg-[#EBEDF0] text-[#1C2329] hover:bg-[#DEE1E6]'
        }`}
      >
        <span>{t('all_groups')}</span>
        <span className={`px-2 py-0.5 text-[11px] rounded-full font-mono ${
          selectedGroup === 'all' ? 'bg-white/25 text-white' : 'bg-white text-slate-700 shadow-xs'
        }`}>
          {students.length}
        </span>
      </button>

      {/* Individual groups */}
      {groups.map((group) => {
        const count = counts[group] || 0;
        const isSelected = selectedGroup === group;

        return (
          <button
            key={group}
            onClick={() => onSelectGroup(group)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition flex items-center gap-2 ${
              isSelected
                ? 'bg-[#0154F8] text-white shadow-sm shadow-[#0154F8]/30'
                : 'bg-[#EBEDF0] text-[#1C2329] hover:bg-[#DEE1E6]'
            }`}
          >
            <span>{group}</span>
            <span className={`px-2 py-0.5 text-[11px] rounded-full font-mono ${
              isSelected ? 'bg-white/25 text-white' : 'bg-white text-slate-700 shadow-xs'
            }`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
