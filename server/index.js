const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3020;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin888';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple admin auth middleware (token-based)
function requireAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token === ADMIN_PASSWORD) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// ---- Public API ----
// Customer submits a new booking request
app.post('/api/submissions', (req, res) => {
  try {
    const data = req.body;
    if (!data.name || !data.phone) {
      return res.status(400).json({ error: '姓名和电话为必填项' });
    }
    const sub = db.createSubmission(data);
    console.log('[NEW] Submission #' + sub.id + ' from ' + sub.name);
    sendEmailNotification(sub);
    res.json({ success: true, id: sub.id });
  } catch (err) {
    console.error('Create error:', err);
    res.status(500).json({ error: '提交失败，请重试' });
  }
});

// ---- Admin API ----
app.get('/api/admin/submissions', requireAuth, (req, res) => {
  try {
    const subs = db.getAllSubmissions();
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/submissions/:id', requireAuth, (req, res) => {
  try {
    const sub = db.getSubmission(parseInt(req.params.id));
    if (!sub) return res.status(404).json({ error: 'Not found' });
    res.json(sub);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/submissions/:id', requireAuth, (req, res) => {
  try {
    const sub = db.updateSubmission(parseInt(req.params.id), req.body);
    res.json(sub);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/submissions/:id', requireAuth, (req, res) => {
  try {
    db.deleteSubmission(parseInt(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin dashboard page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`🎬 影院包场后台服务已启动`);
  console.log(`📡 API 地址: http://localhost:${PORT}`);
  console.log(`🔐 后台管理: http://localhost:${PORT}/admin`);
  console.log(`📝 管理员密码: ${ADMIN_PASSWORD}`);
});

// ---- Email Notification (optional) ----
function sendEmailNotification(submission) {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!host || !user || !pass || !adminEmail) {
    console.log('[Email] Not configured, skipping notification');
    return;
  }
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host, port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: parseInt(process.env.EMAIL_PORT || '587') === 465,
    auth: { user, pass }
  });
  const hallInfo = submission.hall_short ? submission.hall_short + '厅' : '未选择';
  const mailOptions = {
    from: user,
    to: adminEmail,
    subject: `[包场新需求] ${submission.name} - ${submission.date || '待定'}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#e94560;">🎬 新的包场需求</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px;color:#666;">客户</td><td style="padding:6px;"><strong>${submission.name}</strong></td></tr>
          <tr><td style="padding:6px;color:#666;">电话</td><td style="padding:6px;">${submission.phone}</td></tr>
          <tr><td style="padding:6px;color:#666;">微信</td><td style="padding:6px;">${submission.wechat || '-'}</td></tr>
          <tr><td style="padding:6px;color:#666;">影厅</td><td style="padding:6px;">${hallInfo}</td></tr>
          <tr><td style="padding:6px;color:#666;">日期</td><td style="padding:6px;">${submission.date || '-'} ${submission.time || ''}</td></tr>
          <tr><td style="padding:6px;color:#666;">人数</td><td style="padding:6px;">${submission.people || '-'}</td></tr>
          <tr><td style="padding:6px;color:#666;">活动性质</td><td style="padding:6px;">${submission.type || '-'}</td></tr>
          <tr><td style="padding:6px;color:#666;">备注</td><td style="padding:6px;">${submission.note || '-'}</td></tr>
        </table>
        <p style="margin-top:16px;">
          <a href="https://cinema-booking-api.onrender.com/admin"
             style="background:#d4a853;color:#000;padding:10px 20px;text-decoration:none;border-radius:6px;">
            去后台查看
          </a>
        </p>
      </div>
    `
  };
  transporter.sendMail(mailOptions)
    .then(info => console.log('[Email] Sent:', info.messageId))
    .catch(err => console.error('[Email] Error:', err.message));
}
