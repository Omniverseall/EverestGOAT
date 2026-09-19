import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_TEMPLATES } from './defaultTemplates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'goat.db');

export const db = new Database(dbPath);

// Enable WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL');

export function initDb() {
  // 1. Students table
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_name TEXT NOT NULL,
      parent_phone TEXT NOT NULL,
      group_name TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Complaint templates table
  db.exec(`
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
  db.exec(`
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
      status TEXT NOT NULL, -- 'sent', 'failed', 'whatsapp'
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE SET NULL
    );
  `);

  // 4. Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed default templates if not present
  const countTemplates = db.prepare('SELECT COUNT(*) as count FROM complaint_templates').get();
  if (countTemplates.count === 0) {
    const insertTemplate = db.prepare(`
      INSERT INTO complaint_templates (id, title, description, template, has_minutes, icon)
      VALUES (@id, @title, @description, @template, @has_minutes, @icon)
    `);
    for (const t of DEFAULT_TEMPLATES) {
      insertTemplate.run(t);
    }
  }

  // Seed default settings matching teacher phone
  const defaultSettings = [
    { key: 'gateway_ip', value: '192.168.100.119' },
    { key: 'gateway_port', value: '8080' },
    { key: 'gateway_login', value: 'sms' },
    { key: 'gateway_password', value: '12345678' },
    { key: 'gateway_mode', value: 'local' }, // 'local' | 'cloud'
    { key: 'cloud_url', value: 'https://api.sms-gate.app/3rdparty/v1/message' },
    { key: 'cloud_login', value: 'GTREYM' },
    { key: 'cloud_password', value: 'qmi0tt1znyb3kh' },
    { key: 'teacher_name', value: "O'qituvchi / Учитель" },
    { key: 'country_code', value: '+998' }
  ];

  const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');

  for (const s of defaultSettings) {
    if (!getSetting.get(s.key)) {
      insertSetting.run(s.key, s.value);
    }
  }
}

