const API_BASE = '/api';

// ----------------- STUDENTS API -----------------

export async function fetchStudentsApi(group = 'all', search = '') {
  const params = new URLSearchParams();
  if (group && group !== 'all') params.append('group', group);
  if (search && search.trim()) params.append('search', search.trim());

  const res = await fetch(`${API_BASE}/students?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Не удалось загрузить список учеников');
  }
  return res.json();
}

export async function createStudentApi(studentData) {
  const res = await fetch(`${API_BASE}/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Ошибка сохранения ученика' }));
    throw new Error(err.error || 'Ошибка сохранения ученика');
  }
  return res.json();
}

export async function updateStudentApi(id, studentData) {
  const res = await fetch(`${API_BASE}/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Ошибка обновления ученика' }));
    throw new Error(err.error || 'Ошибка обновления ученика');
  }
  return res.json();
}

export async function deleteStudentApi(id) {
  const res = await fetch(`${API_BASE}/students/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Ошибка удаления ученика' }));
    throw new Error(err.error || 'Ошибка удаления ученика');
  }
  return res.json();
}

export async function batchImportStudentsApi(students) {
  const res = await fetch(`${API_BASE}/students/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ students })
  });
  if (!res.ok) {
    throw new Error('Ошибка импорта учеников');
  }
  return res.json();
}

export async function fetchGroupsApi() {
  const res = await fetch(`${API_BASE}/groups`);
  if (!res.ok) {
    throw new Error('Не удалось загрузить группы');
  }
  return res.json();
}

// ----------------- SETTINGS & GATEWAY API -----------------

export async function fetchSettingsApi() {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) return null;
  return res.json();
}

export async function saveSettingsApi(settings) {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!res.ok) {
    throw new Error('Ошибка сохранения настроек');
  }
  return res.json();
}

export async function sendSmsViaServer({
  mode,
  ip,
  port,
  login,
  password,
  cloudUrl,
  cloudLogin,
  cloudPassword,
  phone,
  message,
  studentId,
  studentName,
  parentName,
  groupName,
  complaintType,
  minutesLate
}) {
  const res = await fetch(`${API_BASE}/complaints/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode,
      ip,
      port,
      login,
      password,
      cloudUrl,
      cloudLogin,
      cloudPassword,
      phone,
      message,
      studentId,
      studentName,
      parentName,
      groupName,
      complaintType,
      minutesLate
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Ошибка отправки SMS' }));
    throw new Error(err.error || 'Ошибка отправки SMS');
  }
  return res.json();
}

export async function testGatewayConnection({
  mode,
  ip,
  port,
  login,
  password,
  cloudUrl,
  cloudLogin,
  cloudPassword
}) {
  const res = await fetch(`${API_BASE}/gateway/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode,
      ip,
      port,
      login,
      password,
      cloudUrl,
      cloudLogin,
      cloudPassword
    })
  });
  return res.json();
}

export async function fetchLogsApi() {
  const res = await fetch(`${API_BASE}/logs`);
  if (!res.ok) return [];
  return res.json();
}

export async function clearLogsApi() {
  const res = await fetch(`${API_BASE}/logs`, { method: 'DELETE' });
  return res.json();
}
