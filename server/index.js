import express from 'express';
import cors from 'cors';
import { db, initDb } from './db.js';
import {
  sendSmsViaGateway,
  testGatewayConnection,
  generateSmsUrl,
  normalizePhone
} from './smsService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '..', 'dist');

// Initialize DB schema and defaults
initDb();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper to get all settings as key-value object
function getSettingsMap() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const map = {};
  for (const r of rows) {
    map[r.key] = r.value;
  }
  return map;
}

// -------------------------------------------------------------
// STUDENTS ROUTES
// -------------------------------------------------------------

// GET /api/students?group=...&search=...
app.get('/api/students', (req, res) => {
  try {
    const { group, search } = req.query;
    let query = 'SELECT * FROM students WHERE 1=1';
    const params = [];

    if (group && group !== 'all') {
      query += ' AND group_name = ?';
      params.push(group);
    }

    if (search && search.trim()) {
      query += ' AND (name LIKE ? OR parent_name LIKE ? OR parent_phone LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY group_name ASC, name ASC';
    const students = db.prepare(query).all(...params);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/students - Add student
app.post('/api/students', (req, res) => {
  try {
    const { name, parent_name, parent_phone, group_name, notes } = req.body;
    if (!name || !parent_name || !parent_phone || !group_name) {
      return res.status(400).json({ error: 'Пожалуйста, заполните все обязательные поля: ФИО ученика, ФИО родственника, номер телефона и группу.' });
    }

    const cleanPhone = normalizePhone(parent_phone);
    const stmt = db.prepare(`
      INSERT INTO students (name, parent_name, parent_phone, group_name, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name.trim(), parent_name.trim(), cleanPhone, group_name.trim(), notes ? notes.trim() : '');
    const newStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newStudent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/students/:id - Update student
app.put('/api/students/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent_name, parent_phone, group_name, notes } = req.body;
    const cleanPhone = normalizePhone(parent_phone);

    const stmt = db.prepare(`
      UPDATE students
      SET name = ?, parent_name = ?, parent_phone = ?, group_name = ?, notes = ?
      WHERE id = ?
    `);
    const info = stmt.run(name.trim(), parent_name.trim(), cleanPhone, group_name.trim(), notes ? notes.trim() : '', id);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Ученик не найден' });
    }

    const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/students/:id - Delete student
app.delete('/api/students/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM students WHERE id = ?');
    const info = stmt.run(id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Ученик не найден' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/groups - Automatically extract distinct groups from students
app.get('/api/groups', (req, res) => {
  try {
    const rows = db.prepare("SELECT DISTINCT group_name FROM students WHERE group_name IS NOT NULL AND group_name != '' ORDER BY group_name ASC").all();
    const groups = rows.map(r => r.group_name);
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// TEMPLATES ROUTES
// -------------------------------------------------------------

app.get('/api/templates', (req, res) => {
  try {
    const templates = db.prepare('SELECT * FROM complaint_templates ORDER BY id ASC').all();
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/templates/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { template, title, description } = req.body;
    const stmt = db.prepare(`
      UPDATE complaint_templates
      SET template = ?, title = COALESCE(?, title), description = COALESCE(?, description)
      WHERE id = ?
    `);
    stmt.run(template, title, description, id);
    const updated = db.prepare('SELECT * FROM complaint_templates WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// COMPLAINTS & MESSAGING ROUTES
// -------------------------------------------------------------

// Helper to compile template
function compileMessage({ template, student, minutes, comment, teacherName }) {
  const dateStr = new Date().toLocaleDateString('ru-RU');
  return template
    .replace(/\{ученик\}/g, student.name)
    .replace(/\{родственник\}/g, student.parent_name)
    .replace(/\{группа\}/g, student.group_name)
    .replace(/\{минут\}/g, minutes || '15')
    .replace(/\{учитель\}/g, teacherName || 'Преподаватель')
    .replace(/\{комментарий\}/g, comment || '')
    .replace(/\{дата\}/g, dateStr);
}

// POST /api/complaints/preview - Preview message without sending
app.post('/api/complaints/preview', (req, res) => {
  try {
    const { studentId, templateId, minutes, comment, customText } = req.body;
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    if (!student) return res.status(404).json({ error: 'Ученик не найден' });

    const settings = getSettingsMap();
    let text = '';

    if (customText) {
      text = customText;
    } else {
      const templateRow = db.prepare('SELECT * FROM complaint_templates WHERE id = ?').get(templateId);
      if (!templateRow) return res.status(404).json({ error: 'Шаблон не найден' });
      text = compileMessage({
        template: templateRow.template,
        student,
        minutes,
        comment,
        teacherName: settings.teacher_name
      });
    }

    const whatsappUrl = generateWhatsAppUrl(student.parent_phone, text);
    const smsUrl = generateSmsUrl(student.parent_phone, text);

    res.json({
      message: text,
      parentPhone: student.parent_phone,
      parentName: student.parent_name,
      studentName: student.name,
      whatsappUrl,
      smsUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/complaints/send - Send complaint via Android Gateway (Local or Cloud)
app.post('/api/complaints/send', async (req, res) => {
  try {
    const {
      phone,
      message,
      studentId,
      templateId,
      minutes,
      comment,
      customText,
      mode,
      ip,
      port,
      login,
      password,
      cloudUrl,
      cloudLogin,
      cloudPassword
    } = req.body;

    const settings = getSettingsMap();
    let finalPhone = phone;
    let finalMessage = message || customText;

    if (!finalPhone && studentId) {
      const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
      if (student) {
        finalPhone = student.parent_phone;
      }
    }

    if (!finalPhone) {
      return res.status(400).json({ error: 'Не указан номер телефона получателя' });
    }

    const cleanPhone = normalizePhone(finalPhone);
    const smsUrl = generateSmsUrl(cleanPhone, finalMessage);

    const gatewayResult = await sendSmsViaGateway({
      mode: mode || settings.gateway_mode || 'local',
      ip: ip || settings.gateway_ip || '192.168.100.119',
      port: port || settings.gateway_port || '8080',
      login: login || settings.gateway_login || 'sms',
      password: password || settings.gateway_password || '12345678',
      cloudUrl: cloudUrl || settings.cloud_url,
      cloudLogin: cloudLogin || settings.cloud_login || 'GTREYM',
      cloudPassword: cloudPassword || settings.cloud_password || 'qmi0tt1znyb3kh',
      phone: cleanPhone,
      message: finalMessage
    });

    const status = gatewayResult.success ? 'sent' : 'failed';
    const errorMessage = gatewayResult.success ? null : gatewayResult.error;

    res.json({
      success: gatewayResult.success,
      status,
      errorMessage,
      message: finalMessage,
      smsUrl,
      gatewayResult
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// HISTORY & LOGS ROUTES
// -------------------------------------------------------------

app.get('/api/logs', (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM complaint_logs ORDER BY created_at DESC LIMIT 100').all();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/logs', (req, res) => {
  try {
    db.prepare('DELETE FROM complaint_logs').run();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// SETTINGS & TEST GATEWAY ROUTES
// -------------------------------------------------------------

app.get('/api/settings', (req, res) => {
  try {
    res.json(getSettingsMap());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const settings = req.body;
    const upsert = db.prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    const updateMany = db.transaction((obj) => {
      for (const [k, v] of Object.entries(obj)) {
        upsert.run(k, String(v));
      }
    });

    updateMany(settings);
    res.json(getSettingsMap());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/gateway/test', async (req, res) => {
  try {
    const { mode, ip, port, login, password, cloudUrl, cloudLogin, cloudPassword } = req.body;
    const settings = getSettingsMap();
    const result = await testGatewayConnection({
      mode: mode || settings.gateway_mode || 'local',
      ip: ip || settings.gateway_ip || '192.168.100.119',
      port: port || settings.gateway_port || '8080',
      login: login || settings.gateway_login || 'sms',
      password: password || settings.gateway_password || '12345678',
      cloudUrl: cloudUrl || settings.cloud_url,
      cloudLogin: cloudLogin || settings.cloud_login || 'GTREYM',
      cloudPassword: cloudPassword || settings.cloud_password || 'qmi0tt1znyb3kh'
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static frontend assets
app.use(express.static(distPath));

// SPA fallback for non-API routes
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Express server
app.listen(PORT, () => {
  console.log(`🐐 Goat Server is running on http://localhost:${PORT}`);
});
