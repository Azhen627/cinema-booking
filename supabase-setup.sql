-- 电影院包场服务 - Supabase 数据库初始化
-- 使用方法: 打开 Supabase Dashboard → SQL Editor → 粘贴运行

-- 创建需求表
CREATE TABLE IF NOT EXISTS submissions (
  id BIGSERIAL PRIMARY KEY,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 开启 Row Level Security（行级安全）
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户插入数据（客户提交需求）
CREATE POLICY "允许任何人提交需求" ON submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 仅允许通过 API Key 读取/修改（管理员操作）
-- 管理员可以通过 Supabase Dashboard 直接操作表格
-- 或使用 service_role key 通过 API 操作

-- 创建索引以便搜索
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_date ON submissions(date);
CREATE INDEX IF NOT EXISTS idx_submissions_name ON submissions(name);
