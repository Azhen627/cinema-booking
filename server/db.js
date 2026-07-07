const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'cinema.db');

let db;

function getDb() {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      wechat TEXT DEFAULT '',
      hall_short TEXT DEFAULT '',
      hall_name TEXT DEFAULT '',
      date TEXT DEFAULT '',
      time TEXT DEFAULT '',
      people TEXT DEFAULT '',
      type TEXT DEFAULT '',
      food TEXT DEFAULT '',
      deco TEXT DEFAULT '',
      photo TEXT DEFAULT '',
      invoice TEXT DEFAULT '',
      note TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      total_price REAL DEFAULT 0,
      deposit REAL DEFAULT 0,
      admin_note TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// CRUD operations
function createSubmission(data) {
  const stmt = getDb().prepare(`
    INSERT INTO submissions (name, phone, wechat, hall_short, hall_name, date, time, people, type, food, deco, photo, invoice, note, total_price, deposit)
    VALUES (@name, @phone, @wechat, @hallShort, @hallName, @date, @time, @people, @type, @food, @deco, @photo, @invoice, @note, @totalPrice, @deposit)
  `);
  const result = stmt.run(data);
  return getSubmission(result.lastInsertRowid);
}

function getAllSubmissions() {
  return getDb().prepare('SELECT * FROM submissions ORDER BY created_at DESC').all();
}

function getSubmission(id) {
  return getDb().prepare('SELECT * FROM submissions WHERE id = ?').get(id);
}

function updateSubmission(id, data) {
  data.updated_at = new Date().toISOString();
  const fields = ['status', 'admin_note', 'name', 'phone', 'wechat', 'date', 'time', 'people', 'type', 'food', 'deco', 'photo', 'invoice', 'note'];
  const sets = fields.filter(f => data[f] !== undefined).map(f => `${f} = @${f}`);
  if (sets.length === 0) return getSubmission(id);
  sets.push('updated_at = @updated_at');
  const stmt = getDb().prepare(`UPDATE submissions SET ${sets.join(', ')} WHERE id = @id`);
  data.id = id;
  stmt.run(data);
  return getSubmission(id);
}

function deleteSubmission(id) {
  return getDb().prepare('DELETE FROM submissions WHERE id = ?').run(id);
}

module.exports = { createSubmission, getAllSubmissions, getSubmission, updateSubmission, deleteSubmission };
