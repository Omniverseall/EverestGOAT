import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SplashScreen from './components/SplashScreen';
import GroupFilter from './components/GroupFilter';
import StudentCard from './components/StudentCard';
import StudentModal from './components/StudentModal';
import ComplaintModal from './components/ComplaintModal';
import SettingsModal from './components/SettingsModal';
import TemplatesModal from './components/TemplatesModal';
import {
  getStoredStudents,
  getStoredGroups,
  saveStudent,
  deleteStoredStudent,
  getStoredSettings,
  saveStoredSettings
} from './storage';
import { getTranslation } from './i18n';
import { UserPlus, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const initialSettings = getStoredSettings();
  const [uiLang, setUiLang] = useState(initialSettings.ui_lang || 'uz_lat');
  const [templateLang, setTemplateLang] = useState(initialSettings.template_lang || 'uz_lat');

  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [selectedStudentForComplaint, setSelectedStudentForComplaint] = useState(null);

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);

  const t = (k) => getTranslation(uiLang, k);

  // Load students & groups from Local Storage
  const loadData = () => {
    const list = getStoredStudents(selectedGroup, searchTerm);
    const grps = getStoredGroups();
    setStudents(list);
    setGroups(grps);
  };

  useEffect(() => {
    loadData();
  }, [selectedGroup, searchTerm]);

  const handleSaveStudent = (data) => {
    saveStudent(data);
    setStudentModalOpen(false);
    setEditingStudent(null);
    loadData();
  };

  const handleDeleteStudent = (student) => {
    if (window.confirm(t('delete_confirm') + ` (${student.name})`)) {
      deleteStoredStudent(student.id);
      loadData();
    }
  };

  const handleOpenComplaint = (student) => {
    setSelectedStudentForComplaint(student);
    setComplaintModalOpen(true);
  };

  const handleUiLangChange = (lang) => {
    setUiLang(lang);
    saveStoredSettings({ ui_lang: lang });
  };

  const handleTemplateLangChange = (lang) => {
    setTemplateLang(lang);
    saveStoredSettings({ template_lang: lang });
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1C2329] flex flex-col font-sans">
      {/* Full-screen Loading Splash */}
      <SplashScreen />
      
      {/* Header */}
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenTemplates={() => setTemplatesModalOpen(true)}
        currentLang={uiLang}
        onChangeLang={handleUiLangChange}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 flex-1 flex flex-col gap-6">
        
        {/* Hero / Top Brand Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="h-11 flex items-center justify-center shrink-0">
              <img
                src="/logo.png"
                alt="Everest LC"
                className="h-11 w-auto object-contain max-w-[130px]"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-[#1C2329]">
                  {t('app_name')} • {t('app_badge')}
                </h1>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  {initialSettings.gateway_mode === 'cloud' ? 'SMS-Gate Cloud' : 'Wi-Fi Local'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {t('storage_notice')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>{t('template_language')}:</span>
            <span className="font-bold text-[#0154F8] uppercase px-2.5 py-1 rounded-lg bg-[#DCE8FF] border border-[#0154F8]/20">
              {templateLang}
            </span>
          </div>
        </div>

        {/* Group Filter Bar (Auto-populated from students) */}
        {groups.length > 0 && (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-2.5 shadow-xs">
            <GroupFilter
              groups={groups}
              selectedGroup={selectedGroup}
              onSelectGroup={setSelectedGroup}
              students={getStoredStudents('all', '')}
              currentLang={uiLang}
            />
          </div>
        )}

        {/* Students Section */}
        <div className="flex-1 flex flex-col">
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-black text-[#1C2329]">{t('students_list')}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EBEDF0] text-[#1C2329] font-bold border border-[#E5E7EB] font-mono">
                {students.length}
              </span>
            </div>

            {/* The Primary Add Student button */}
            <button
              onClick={() => {
                setEditingStudent(null);
                setStudentModalOpen(true);
              }}
              className="px-5 py-2.5 bg-[#0154F8] hover:bg-[#0047D4] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-[#0154F8]/20 transition active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t('add_student')}</span>
            </button>
          </div>

          {/* Cards Grid or Empty State */}
          {students.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white border border-[#E5E7EB] rounded-[24px] shadow-sm min-h-[300px]">
              <div className="w-16 h-16 rounded-2xl bg-[#DCE8FF] flex items-center justify-center mb-4 text-[#0154F8] shadow-xs">
                <UserPlus className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-[#1C2329] mb-1">
                {searchTerm ? t('search_placeholder') : t('empty_students_title')}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-5">
                {searchTerm
                  ? 'Qidiruv bo\'yicha hech narsa topilmadi / Ничего не найдено'
                  : t('empty_students_desc')}
              </p>
              <button
                onClick={() => {
                  setEditingStudent(null);
                  setStudentModalOpen(true);
                }}
                className="px-6 py-2.5 bg-[#0154F8] hover:bg-[#0047D4] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-[#0154F8]/20 transition flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('add_first_student')}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {students.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onComplaint={handleOpenComplaint}
                  onEdit={(s) => {
                    setEditingStudent(s);
                    setStudentModalOpen(true);
                  }}
                  onDelete={handleDeleteStudent}
                  currentLang={uiLang}
                />
              ))}
            </div>
          )}

        </div>

      </main>


      {/* Modals */}
      <StudentModal
        isOpen={studentModalOpen}
        onClose={() => {
          setStudentModalOpen(false);
          setEditingStudent(null);
        }}
        onSave={handleSaveStudent}
        student={editingStudent}
        existingGroups={groups}
        currentLang={uiLang}
      />

      <ComplaintModal
        isOpen={complaintModalOpen}
        onClose={() => {
          setComplaintModalOpen(false);
          setSelectedStudentForComplaint(null);
        }}
        student={selectedStudentForComplaint}
        onComplaintSent={loadData}
        currentLang={uiLang}
        templateLang={templateLang}
        onChangeTemplateLang={handleTemplateLangChange}
        onOpenSettings={() => {
          setComplaintModalOpen(false);
          setSettingsModalOpen(true);
        }}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        currentLang={uiLang}
        onChangeLang={handleUiLangChange}
        templateLang={templateLang}
        onChangeTemplateLang={handleTemplateLangChange}
      />

      <TemplatesModal
        isOpen={templatesModalOpen}
        onClose={() => setTemplatesModalOpen(false)}
        currentLang={uiLang}
        templateLang={templateLang}
        onChangeTemplateLang={handleTemplateLangChange}
      />

    </div>
  );
}
