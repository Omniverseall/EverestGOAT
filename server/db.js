import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_TEMPLATES } from './defaultTemplates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const url = process.env.TURSO_DATABASE_URL || 'file:goat.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient({
  url,
  authToken,
});

export async function initDb() {
  // 1. Students table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_name TEXT NOT NULL,
      parent_phone TEXT NOT NULL,
      group_name TEXT NOT NULL,
      notes TEXT,
      gender TEXT DEFAULT 'male',
      group_days TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Complaint templates table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS complaint_templates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      template TEXT NOT NULL,
      has_minutes INTEGER DEFAULT 0,
      icon TEXT DEFAULT 'MessageSquare'
    );
  `);

  // 3. Complaint logs table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS complaint_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      student_name TEXT NOT NULL,
      parent_name TEXT NOT NULL,
      parent_phone TEXT NOT NULL,
      group_name TEXT NOT NULL,
      complaint_type TEXT NOT NULL,
      message TEXT NOT NULL,
      minutes_late INTEGER,
      status TEXT NOT NULL,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE SET NULL
    );
  `);

  // 4. Settings table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed default templates if not present
  const countTemplatesRes = await db.execute('SELECT COUNT(*) as count FROM complaint_templates');
  const countTemplates = countTemplatesRes.rows[0]?.count || 0;
  if (Number(countTemplates) === 0) {
    for (const t of DEFAULT_TEMPLATES) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO complaint_templates (id, title, description, template, has_minutes, icon)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [t.id, t.title, t.description || '', t.template, t.has_minutes ? 1 : 0, t.icon || 'MessageSquare']
      });
    }
  }

  // Seed default settings matching teacher phone
  const defaultSettings = [
    { key: 'gateway_ip', value: '192.168.68.110' },
    { key: 'gateway_port', value: '8080' },
    { key: 'gateway_login', value: 'sms' },
    { key: 'gateway_password', value: 'rare..ali121' },
    { key: 'gateway_mode', value: 'cloud' },
    { key: 'cloud_url', value: 'https://api.sms-gate.app/3rdparty/v1/message' },
    { key: 'cloud_login', value: 'FFKANJ' },
    { key: 'cloud_password', value: 'd0vgkjqdy_ddcm' },
    { key: 'teacher_name', value: "O'qituvchi / Учитель" },
    { key: 'country_code', value: '+998' }
  ];

  for (const s of defaultSettings) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
      args: [s.key, s.value]
    });
  }
}
