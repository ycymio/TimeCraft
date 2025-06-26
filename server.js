import express from 'express';
import fs from 'fs';
import path from 'path';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const CSV_FILE = path.join(__dirname, 'activities.csv');

app.use(bodyParser.json());

// CORS support
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 工具函数：格式化为 YYYY/MM/DD HH:mm
function formatDateLocal(dtStr) {
  const d = new Date(dtStr);
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${y}/${m}/${day} ${hh}:${mm}`;
}

// 工具函数：读取CSV为对象数组
function readCSV() {
  if (!fs.existsSync(CSV_FILE)) return [];
  const lines = fs.readFileSync(CSV_FILE, 'utf-8').split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(',');
  return lines.slice(1).map(line => {
    const cells = line.split(',');
    return Object.fromEntries(header.map((h, i) => [h, cells[i] || '']));
  });
}

// 工具函数：写入表头（如无文件）
function ensureCSVHeader() {
  if (!fs.existsSync(CSV_FILE)) {
    fs.writeFileSync(CSV_FILE, 'Start,End,Category,Details\n');
  }
}

// API: Add activity (保持CSV按Start时间有序)
app.post('/api/activities', (req, res) => {
  const { category, start, end, details } = req.body;
  if (!category || !start || !end) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  ensureCSVHeader();
  const newRow = [formatDateLocal(start), formatDateLocal(end), category, (details||'').replace(/,/g, '，')].join(',');
  // 读取所有数据
  const lines = fs.readFileSync(CSV_FILE, 'utf-8').split(/\r?\n/).filter(Boolean);
  const header = lines[0];
  const dataRows = lines.slice(1);
  // 插入新行并排序
  dataRows.push(newRow);
  dataRows.sort((a, b) => {
    const aStart = a.split(',')[0];
    const bStart = b.split(',')[0];
    // 解析为本地时间
    const parse = (str) => {
      const [date, time] = str.split(' ');
      const [yy, mm, dd] = date.split('/').map(Number);
      const [hh, min] = time.split(':').map(Number);
      return new Date(yy, mm - 1, dd, hh, min, 0, 0).getTime();
    };
    return parse(aStart) - parse(bStart);
  });
  // 写回文件
  fs.writeFileSync(CSV_FILE, header + '\n' + dataRows.join('\n') + '\n');
  res.json({ success: true });
});

// API: Get all activities, 支持按日期过滤
app.get('/api/activities', (req, res) => {
  const activities = readCSV();
  const { date } = req.query;
  if (date) {
    // date: YYYY-MM-DD
    const [y, m, d] = date.split('-').map(Number);
    const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0);
    const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
    const filtered = activities.filter(act => {
      if (!act.Start) return false;
      let start;
      if (typeof act.Start === 'string' && act.Start.match(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/)) {
        const [date, time] = act.Start.split(' ');
        const [yy, mm, dd] = date.split('/').map(Number);
        const [hh, min] = time.split(':').map(Number);
        start = new Date(yy, mm - 1, dd, hh, min, 0, 0);
      } else {
        start = new Date(act.Start);
      }
      return start >= dayStart && start <= dayEnd;
    });
    return res.json(filtered);
  }
  res.json(activities);
});

// API: Get today's activities
app.get('/api/activities/today', (req, res) => {
  const activities = readCSV();
  // 获取今天的起止时间（本地时区）
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
  const dayStart = new Date(y, m, d, 0, 0, 0, 0);
  const dayEnd = new Date(y, m, d, 23, 59, 59, 999);
  const todayActs = activities.filter(act => {
    if (!act.Start) return false;
    let start;
    if (typeof act.Start === 'string' && act.Start.match(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/)) {
      const [date, time] = act.Start.split(' ');
      const [yy, mm, dd] = date.split('/').map(Number);
      const [hh, min] = time.split(':').map(Number);
      start = new Date(yy, mm - 1, dd, hh, min, 0, 0);
    } else {
      start = new Date(act.Start);
    }
    return start >= dayStart && start <= dayEnd;
  });
  res.json(todayActs);
});

// API: Get summary for all activities
app.get('/api/summary', (req, res) => {
  const activities = readCSV();
  let totalMinutes = 0;
  const daysSet = new Set();
  const categoryTotals = {};
  // 获取今天日期（本地）
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
  activities.forEach(act => {
    if (!act.Start || !act.End) return;
    if (act.Category === 'Free Time') return; // 跳过 Free Time
    function parseLocal(str) {
      if (typeof str === 'string' && str.match(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2} [0-9]{2}:[0-9]{2}/)) {
        const [date, time] = str.split(' ');
        const [yy, mm, dd] = date.split('/').map(Number);
        const [hh, min] = time.split(':').map(Number);
        return new Date(yy, mm - 1, dd, hh, min, 0, 0);
      } else {
        return new Date(str);
      }
    }
    const start = parseLocal(act.Start);
    const end = parseLocal(act.End);
    const dayKey = `${start.getFullYear()}-${start.getMonth()+1}-${start.getDate()}`;
    if (dayKey === todayKey) return; // 跳过今天
    const mins = Math.max(0, (end - start) / 60000);
    totalMinutes += mins;
    daysSet.add(dayKey);
    if (!categoryTotals[act.Category]) categoryTotals[act.Category] = 0;
    categoryTotals[act.Category] += mins;
  });
  let topCategory = '-';
  let max = 0;
  Object.entries(categoryTotals).forEach(([cat, mins]) => {
    if (mins > max) {
      max = mins;
      topCategory = cat;
    }
  });
  const daysTracked = daysSet.size;
  const totalHours = totalMinutes / 60;
  const avgDaily = daysTracked ? (totalHours / daysTracked) : 0;
  res.json({
    totalHours: Number(totalHours.toFixed(2)),
    daysTracked,
    avgDaily: Number(avgDaily.toFixed(2)),
    topCategory
  });
});

// ====== 每日心得 CSV 相关 ======
const IDEAS_CSV = path.join(__dirname, 'daily_ideas.csv');
function ensureIdeasHeader() {
  if (!fs.existsSync(IDEAS_CSV)) {
    fs.writeFileSync(IDEAS_CSV, 'Date,Idea\n');
  }
}
function readIdeasCSV() {
  if (!fs.existsSync(IDEAS_CSV)) return [];
  const lines = fs.readFileSync(IDEAS_CSV, 'utf-8').split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(',');
  return lines.slice(1).map(line => {
    const cells = line.split(',');
    return Object.fromEntries(header.map((h, i) => [h, cells[i] || '']));
  });
}
// GET /api/ideas?date=YYYY-MM-DD
app.get('/api/ideas', (req, res) => {
  const { date } = req.query;
  const ideas = readIdeasCSV();
  if (date) {
    const filtered = ideas.filter(i => i.Date === date);
    return res.json(filtered);
  }
  res.json(ideas);
});
// POST /api/ideas { date, idea }
app.post('/api/ideas', (req, res) => {
  const { date, idea } = req.body;
  if (!date || !idea) return res.status(400).json({ error: 'Missing date or idea' });
  ensureIdeasHeader();
  // 防止逗号破坏CSV
  const safeIdea = (idea || '').replace(/,/g, '，');
  fs.appendFileSync(IDEAS_CSV, `${date},${safeIdea}\n`);
  res.json({ success: true });
});

// ====== Todos CSV API ======
const TODOS_CSV = path.join(__dirname, 'todos.csv');
function ensureTodosHeader() {
  if (!fs.existsSync(TODOS_CSV)) {
    fs.writeFileSync(TODOS_CSV, 'Text\n');
  }
}
function readTodosCSV() {
  if (!fs.existsSync(TODOS_CSV)) return [];
  const lines = fs.readFileSync(TODOS_CSV, 'utf-8').split(/\r?\n/).filter(Boolean);
  return lines[0] === 'Text' ? lines.slice(1) : lines;
}

// Get all todos
app.get('/api/todos', (req, res) => {
  const todos = readTodosCSV();
  res.json(todos);
});

// Add new todo
app.post('/api/todos', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing todo text' });
  ensureTodosHeader();
  // escape commas
  const line = text.replace(/,/g, '，');
  fs.appendFileSync(TODOS_CSV, `${line}\n`);
  res.json({ success: true });
});

// Delete todo by index
app.post('/api/todos/delete', (req, res) => {
  const { index } = req.body;
  const idx = Number(index);
  if (isNaN(idx)) return res.status(400).json({ error: 'Invalid index' });
  const todos = readTodosCSV();
  if (idx < 0 || idx >= todos.length) return res.status(400).json({ error: 'Index out of range' });
  todos.splice(idx, 1);
  // rewrite file
  const content = 'Text\n' + todos.join('\n') + '\n';
  fs.writeFileSync(TODOS_CSV, content);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
