import { getTemplatesForLang, DEFAULT_SIGNATURES, formatStudentDays } from './i18n.js';

const STORAGE_KEYS = {
  STUDENTS: 'goat_students',
  SETTINGS: 'goat_settings',
  TEMPLATES: 'goat_templates_v2_5',
  UI_LANG: 'goat_ui_lang',
  TPL_LANG: 'goat_template_lang'
};

export function normalizeUzPhone(rawPhone) {
  if (!rawPhone) return '';
  let clean = rawPhone.replace(/[^\d+]/g, '');

  // 9 digits without country code (e.g. 901234567) -> +998901234567
  if (/^\d{9}$/.test(clean)) {
    return '+998' + clean;
  }

  // Starts with 998 and 12 digits
  if (clean.startsWith('998') && clean.length === 12) {
    return '+' + clean;
  }

  // Starts with +998
  if (clean.startsWith('+998')) {
    return clean;
  }

  // Fallback
  if (!clean.startsWith('+') && clean.length >= 9) {
    return '+' + clean;
  }

  return clean;
}

export function formatUzPhoneMask(value) {
  if (!value) return '+998 ';
  let raw = value.replace(/[^\d]/g, '');
  if (raw.startsWith('998')) {
    raw = raw.slice(3);
  }
  raw = raw.slice(0, 9); // at most 9 digits for Uzbekistan

  if (raw.length === 0) return '+998 ';

  let res = '+998 (';
  res += raw.slice(0, 2);
  if (raw.length <= 2) return res;

  res += ') ' + raw.slice(2, 5);
  if (raw.length <= 5) return res;

  res += '-' + raw.slice(5, 7);
  if (raw.length <= 7) return res;

  res += '-' + raw.slice(7, 9);
  return res;
}

// ----------------- STUDENTS (Local Storage) -----------------

export function getStoredStudents(group = 'all', search = '') {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    const list = raw ? JSON.parse(raw) : [];

    return list.filter((s) => {
      const matchGroup = group === 'all' || s.group_name === group;
      const term = search.trim().toLowerCase();
      const matchSearch =
        !term ||
        (s.name && s.name.toLowerCase().includes(term)) ||
        (s.parent_name && s.parent_name.toLowerCase().includes(term)) ||
        (s.parent_phone && s.parent_phone.includes(term));
      return matchGroup && matchSearch;
    });
  } catch (err) {
    console.error('Failed to read students from localStorage', err);
    return [];
  }
}

export function saveStudent(studentData) {
  const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  let list = raw ? JSON.parse(raw) : [];

  const cleanPhone = normalizeUzPhone(studentData.parent_phone);
  const gender = studentData.gender || 'male';
  const groupDays = Array.isArray(studentData.group_days)
    ? studentData.group_days
    : (studentData.group_days ? [studentData.group_days] : []);

  if (studentData.id) {
    // Update existing
    list = list.map((s) =>
      s.id === studentData.id
        ? {
            ...s,
            name: studentData.name.trim(),
            gender: gender,
            parent_name: studentData.parent_name.trim(),
            parent_phone: cleanPhone,
            group_name: studentData.group_name.trim(),
            group_days: groupDays,
            group_time: studentData.group_time ? studentData.group_time.trim() : '',
            notes: studentData.notes ? studentData.notes.trim() : ''
          }
        : s
    );
  } else {
    // Create new
    const newStudent = {
      id: Date.now().toString(),
      name: studentData.name.trim(),
      gender: gender,
      parent_name: studentData.parent_name.trim(),
      parent_phone: cleanPhone,
      group_name: studentData.group_name.trim(),
      group_days: groupDays,
      group_time: studentData.group_time ? studentData.group_time.trim() : '',
      notes: studentData.notes ? studentData.notes.trim() : '',
      created_at: new Date().toISOString()
    };
    list.unshift(newStudent);
  }

  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
  return list;
}

export function deleteStoredStudent(id) {
  const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  let list = raw ? JSON.parse(raw) : [];
  list = list.filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
  return list;
}

export function getStoredGroups() {
  const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  const list = raw ? JSON.parse(raw) : [];
  const set = new Set();
  list.forEach((s) => {
    if (s.group_name && s.group_name.trim()) {
      set.add(s.group_name.trim());
    }
  });
  return Array.from(set).sort();
}

// ----------------- SETTINGS (Local Storage) -----------------

export function getStoredSettings() {
  const exactEverestSignature = DEFAULT_SIGNATURES.ru;

  const defaultSettings = {
    gateway_mode: 'cloud', // Default to 'cloud' since cloud connects reliably!
    gateway_ip: '192.168.68.110',
    gateway_port: '8080',
    gateway_login: 'sms',
    gateway_password: 'rare..ali121',
    cloud_url: 'https://api.sms-gate.app/3rdparty/v1/message',
    cloud_login: 'FFKANJ',
    cloud_password: 'd0vgkjqdy_ddcm',
    teacher_name: exactEverestSignature,
    country_code: '+998',
    ui_lang: 'uz_lat',
    template_lang: 'uz_lat'
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
      return defaultSettings;
    }
    const parsed = JSON.parse(raw);
    const merged = { ...defaultSettings, ...parsed };

    // Auto-fix legacy generic or outdated signatures:
    if (
      !merged.teacher_name ||
      merged.teacher_name.includes("O'qituvchi") ||
      merged.teacher_name.includes("Учитель") ||
      merged.teacher_name.includes("по изучению") ||
      !merged.teacher_name.includes("по обучению") ||
      !merged.teacher_name.includes("Xikmatov Alixon")
    ) {
      merged.teacher_name = exactEverestSignature;
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
    }

    return merged;
  } catch (err) {
    console.error(err);
    return defaultSettings;
  }
}

export function saveStoredSettings(newSettings) {
  const current = getStoredSettings();
  const updated = { ...current, ...newSettings };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  return updated;
}

// ----------------- TEMPLATES (Local Storage) -----------------

export function getActiveTemplates(langCode = 'uz_lat') {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    const customAll = raw ? JSON.parse(raw) : {};
    if (customAll[langCode] && Array.isArray(customAll[langCode])) {
      return customAll[langCode];
    }
  } catch (e) {
    console.error(e);
  }
  return getTemplatesForLang(langCode);
}

export function saveActiveTemplates(langCode, templatesList) {
  let customAll = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (raw) customAll = JSON.parse(raw);
  } catch (e) {}

  customAll[langCode] = templatesList;
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(customAll));
  return templatesList;
}

// Helper: compile message with variables, gender endings, and Everest Uzbekistan signature
export function compileComplaintText({ template, student, minutes, comment, gender, teacherName, lang = 'uz_lat' }) {
  const dateStr = new Date().toLocaleDateString('ru-RU');
  const effectiveGender = gender || student?.gender || 'male';
  const isFemale = effectiveGender === 'female';

  // Everest Uzbekistan exact signature:
  // If teacherName is customized and contains Xikmatov Alixon, use it; otherwise use exact translation for the language
  const defaultSig = DEFAULT_SIGNATURES[lang] || DEFAULT_SIGNATURES.ru;
  let signature = defaultSig;
  if (teacherName && teacherName.includes('Xikmatov Alixon')) {
    signature = DEFAULT_SIGNATURES[lang] || DEFAULT_SIGNATURES.ru;
  } else if (teacherName && teacherName.trim()) {
    signature = teacherName.trim();
  } else {
    signature = defaultSig;
  }

  let text = template;

  // Uzbek & Karakalpak gender references:
  let obr = '';
  if (lang === 'uz_lat') obr = isFemale ? 'qizingiz' : "o'g'lingiz";
  else if (lang === 'uz_cyr') obr = isFemale ? 'қизингиз' : 'ўғлингиз';
  else if (lang === 'kaa_lat') obr = isFemale ? 'qızıńız' : 'uǵlıńız';
  else if (lang === 'kaa_cyr') obr = isFemale ? 'қызыңыз' : 'уғлыңыз';
  else obr = '';

  text = text.replace(/\{обращение\}/g, obr);

  // English gender tokens:
  text = text.replace(/\{did_not_do_hw\}/g, isFemale ? 'did not do her homework' : 'did not do his homework');
  text = text.replace(/\{was_late\}/g, isFemale ? 'she was late' : 'he was late');
  text = text.replace(/\{was_absent\}/g, isFemale ? 'she was absent' : 'he was absent');
  text = text.replace(/\{was_disruptive\}/g, isFemale
    ? 'was disruptive in class today: talking, joking, and distracting the teacher and classmates'
    : 'was disruptive in class today: talking, joking, and distracting the teacher and classmates');

  // Russian gender verb endings:
  text = text.replace(/\{не_выполнил\}/g, isFemale ? 'не выполнила' : 'не выполнил');
  text = text.replace(/\{опоздал\}/g, isFemale ? 'опоздала' : 'опоздал');
  text = text.replace(/\{отсутствовал\}/g, isFemale ? 'отсутствовала' : 'отсутствовал');
  text = text.replace(/\{вел_себя\}/g, isFemale ? 'вела себя' : 'вел себя');
  text = text.replace(/\{нарушал\}/g, isFemale ? 'нарушала' : 'нарушал');
  text = text.replace(/\{отвлекался\}/g, isFemale ? 'отвлекалась' : 'отвлекался');
  text = text.replace(/\{мешал\}/g, isFemale ? 'мешала' : 'мешал');

  // General Russian replacement if template has '(а)' or '(лась)':
  if (isFemale) {
    text = text.replace(/\(а\)/g, 'а');
    text = text.replace(/\(лась\)/g, 'лась');
  } else {
    text = text.replace(/\(а\)/g, '');
    text = text.replace(/\(лась\)/g, '');
  }

  const formattedDays = formatStudentDays(student?.group_days, lang);
  const scheduleStr = formattedDays && student?.group_time
    ? `${formattedDays} (${student.group_time})`
    : (formattedDays || student?.group_time || '');

  // Base variable replacement
  return text
    .replace(/\{ученик\}/g, student?.name || '')
    .replace(/\{родственник\}/g, student?.parent_name || '')
    .replace(/\{группа\}/g, student?.group_name || '')
    .replace(/\{время\}/g, student?.group_time || '')
    .replace(/\{дни\}/g, formattedDays)
    .replace(/\{расписание\}/g, scheduleStr)
    .replace(/\{минут\}/g, minutes || '15')
    .replace(/\{учитель\}/g, signature)
    .replace(/\{подпись\}/g, signature)
    .replace(/\{комментарий\}/g, comment || '')
    .replace(/\{дата\}/g, dateStr);
}
