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

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Ensure DB is initialized (works both locally and in serverless)
let isReady = false;
const initPromise = initDb()
  .then(() => {
    isReady = true;
  })
  .catch((err) => {
    console.error('Failed to initialize Turso DB:', err);
  });

app.use(async (req, res, next) => {
  if (!isReady) {
    try {
      await initPromise;
    } catch (e) {
      return res.status(500).json({ error: 'Database initialization failed: ' + e.message });
    }
  }
  next();
});

// Helper to get all settings as key-value object
async function getSettingsMap() {
  const rs = await db.execute('SELECT key, value FROM settings');
  const map = {};
  for (const r of rs.rows) {
    map[r.key] = r.value;
  }
  return map;
}

// -------------------------------------------------------------
// STUDENTS ROUTES
// -------------------------------------------------------------

// GET /api/students?group=...&search=...
app.get('/api/students', async (req, res) => {
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
    const rs = await db.execute({ sql: query, args: params });
    
    // Parse group_days if stored as string
    const students = rs.rows.map(s => ({
      ...s,
      group_days: s.group_days ? s.group_days.split(',').filter(Boolean) : []
    }));

    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/students - Add student
app.post('/api/students', async (req, res) => {
  try {
    const { name, parent_name, parent_phone, group_name, notes, gender, group_days } = req.body;
    if (!name || !parent_phone || !group_name) {
      return res.status(400).json({
        error: 'Пожалуйста, заполните обязательные поля: ФИО ученика, номер телефона и группу.'
      });
    }

    const cleanPhone = normalizePhone(parent_phone);
    const daysStr = Array.isArray(group_days) ? group_days.join(',') : (group_days || '');

    const rs = await db.execute({
      sql: `INSERT INTO students (name, parent_name, parent_phone, group_name, notes, gender, group_days)
            VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      args: [
        name.trim(),
        (parent_name || '').trim(),
        cleanPhone,
        group_name.trim(),
        notes ? notes.trim() : '',
        gender || 'male',
        daysStr
      ]
    });

    const s = rs.rows[0];
    res.status(201).json({
      ...s,
      group_days: s.group_days ? s.group_days.split(',').filter(Boolean) : []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/students/batch - Batch import students (for migration from localStorage)
app.post('/api/students/batch', async (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.json({ success: true, inserted: 0 });
    }

    let inserted = 0;
    for (const s of students) {
      if (!s.name || !s.parent_phone) continue;
      const cleanPhone = normalizePhone(s.parent_phone);
      const daysStr = Array.isArray(s.group_days) ? s.group_days.join(',') : (s.group_days || '');
      await db.execute({
        sql: `INSERT INTO students (name, parent_name, parent_phone, group_name, notes, gender, group_days)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          s.name.trim(),
          (s.parent_name || '').trim(),
          cleanPhone,
          (s.group_name || 'Group 1').trim(),
          (s.notes || '').trim(),
          s.gender || 'male',
          daysStr
        ]
      });
      inserted++;
    }

    res.json({ success: true, inserted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/students/:id - Update student
app.put('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent_name, parent_phone, group_name, notes, gender, group_days } = req.body;
    const cleanPhone = normalizePhone(parent_phone);
    const daysStr = Array.isArray(group_days) ? group_days.join(',') : (group_days || '');

    const rs = await db.execute({
      sql: `UPDATE students
            SET name = ?, parent_name = ?, parent_phone = ?, group_name = ?, notes = ?, gender = ?, group_days = ?
            WHERE id = ? RETURNING *`,
      args: [
        name.trim(),
        (parent_name || '').trim(),
        cleanPhone,
        group_name.trim(),
        notes ? notes.trim() : '',
        gender || 'male',
        daysStr,
        id
      ]
    });

    if (rs.rows.length === 0) {
      return res.status(404).json({ error: 'Ученик не найден' });
    }

    const s = rs.rows[0];
    res.json({
      ...s,
      group_days: s.group_days ? s.group_days.split(',').filter(Boolean) : []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/students/:id - Delete student
app.delete('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rs = await db.execute({
      sql: 'DELETE FROM students WHERE id = ?',
      args: [id]
    });
    if (rs.rowsAffected === 0) {
      return res.status(404).json({ error: 'Ученик не найден' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/groups - Automatically extract distinct groups from students
app.get('/api/groups', async (req, res) => {
  try {
    const rs = await db.execute(
      "SELECT DISTINCT group_name FROM students WHERE group_name IS NOT NULL AND group_name != '' ORDER BY group_name ASC"
    );
    const groups = rs.rows.map((r) => r.group_name);
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// TEMPLATES ROUTES
// -------------------------------------------------------------

app.get('/api/templates', async (req, res) => {
  try {
    const rs = await db.execute('SELECT * FROM complaint_templates ORDER BY id ASC');
    res.json(rs.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { template, title, description } = req.body;
    const rs = await db.execute({
      sql: `UPDATE complaint_templates
            SET template = ?, title = COALESCE(?, title), description = COALESCE(?, description)
            WHERE id = ? RETURNING *`,
      args: [template, title || null, description || null, id]
    });
    res.json(rs.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// COMPLAINTS & MESSAGING ROUTES
// -------------------------------------------------------------

// POST /api/complaints/send - Send complaint via Android Gateway & Log to DB
app.post('/api/complaints/send', async (req, res) => {
  try {
    const {
      phone,
      message,
      studentId,
      studentName,
      parentName,
      groupName,
      complaintType,
      minutesLate,
      mode,
      ip,
      port,
      login,
      password,
      cloudUrl,
      cloudLogin,
      cloudPassword
    } = req.body;

    const settings = await getSettingsMap();
    let finalPhone = phone;

    if (!finalPhone && studentId) {
      const studentRs = await db.execute({
        sql: 'SELECT * FROM students WHERE id = ?',
        args: [studentId]
      });
      if (studentRs.rows.length > 0) {
        finalPhone = studentRs.rows[0].parent_phone;
      }
    }

    if (!finalPhone) {
      return res.status(400).json({ error: 'Не указан номер телефона получателя' });
    }

    const cleanPhone = normalizePhone(finalPhone);
    const smsUrl = generateSmsUrl(cleanPhone, message);

    const gatewayResult = await sendSmsViaGateway({
      mode: mode || settings.gateway_mode || 'cloud',
      ip: ip || settings.gateway_ip || '192.168.68.110',
      port: port || settings.gateway_port || '8080',
      login: login || settings.gateway_login || 'sms',
      password: password || settings.gateway_password || 'rare..ali121',
      cloudUrl: cloudUrl || settings.cloud_url || 'https://api.sms-gate.app/3rdparty/v1/message',
      cloudLogin: cloudLogin || settings.cloud_login || 'FFKANJ',
      cloudPassword: cloudPassword || settings.cloud_password || 'd0vgkjqdy_ddcm',
      phone: cleanPhone,
      message
    });

    const status = gatewayResult.success ? 'sent' : 'failed';
    const errorMessage = gatewayResult.success ? null : (gatewayResult.error || 'Ошибка отправки');

    // Save log to Turso
    try {
      await db.execute({
        sql: `INSERT INTO complaint_logs (
                student_id, student_name, parent_name, parent_phone, group_name,
                complaint_type, message, minutes_late, status, error_message
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          studentId || null,
          studentName || '',
          parentName || '',
          cleanPhone,
          groupName || '',
          complaintType || 'complaint',
          message || '',
          minutesLate || null,
          status,
          errorMessage
        ]
      });
    } catch (logErr) {
      console.error('Failed to write complaint log to DB:', logErr);
    }

    res.json({
      success: gatewayResult.success,
      status,
      errorMessage,
      message,
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

app.get('/api/logs', async (req, res) => {
  try {
    const rs = await db.execute('SELECT * FROM complaint_logs ORDER BY created_at DESC LIMIT 100');
    res.json(rs.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/logs', async (req, res) => {
  try {
    await db.execute('DELETE FROM complaint_logs');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// SETTINGS & TEST GATEWAY ROUTES
// -------------------------------------------------------------

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await getSettingsMap();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const settings = req.body;
    for (const [k, v] of Object.entries(settings)) {
      await db.execute({
        sql: `INSERT INTO settings (key, value)
              VALUES (?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        args: [k, String(v)]
      });
    }
    const updated = await getSettingsMap();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/gateway/test', async (req, res) => {
  try {
    const { mode, ip, port, login, password, cloudUrl, cloudLogin, cloudPassword } = req.body;
    const settings = await getSettingsMap();
    const result = await testGatewayConnection({
      mode: mode || settings.gateway_mode || 'cloud',
      ip: ip || settings.gateway_ip || '192.168.68.110',
      port: port || settings.gateway_port || '8080',
      login: login || settings.gateway_login || 'sms',
      password: password || settings.gateway_password || 'rare..ali121',
      cloudUrl: cloudUrl || settings.cloud_url || 'https://api.sms-gate.app/3rdparty/v1/message',
      cloudLogin: cloudLogin || settings.cloud_login || 'FFKANJ',
      cloudPassword: cloudPassword || settings.cloud_password || 'd0vgkjqdy_ddcm'
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static frontend assets when run as standalone server
app.use(express.static(distPath));

// SPA fallback for non-API routes
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Export default app for Vercel / serverless handlers
export default app;

// Start Express server if running standalone
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🐐 Goat Server is running on http://localhost:${PORT}`);
  });
}
