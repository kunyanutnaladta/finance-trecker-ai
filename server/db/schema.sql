CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  password   TEXT NOT NULL,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  amount      NUMERIC NOT NULL CHECK(amount > 0),
  category    TEXT NOT NULL,
  description TEXT,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK(type IN ('income', 'expense', 'both')),
  icon       TEXT,
  is_default INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS ai_analyses (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month      TEXT NOT NULL,
  prompt     TEXT NOT NULL,
  response   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO categories (name, type, icon) VALUES
  ('เงินเดือน','income','💰'),('ฟรีแลนซ์','income','💻'),
  ('ลงทุน','income','📈'),('อาหาร','expense','🍜'),
  ('เดินทาง','expense','🚗'),('ที่พัก','expense','🏠'),
  ('สุขภาพ','expense','💊'),('บันเทิง','expense','🎮'),
  ('ช้อปปิ้ง','expense','🛍️'),('การศึกษา','expense','📚'),
  ('อื่นๆ','both','📦')
ON CONFLICT DO NOTHING;