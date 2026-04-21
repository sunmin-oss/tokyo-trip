-- Supabase SQL Schema for Tokyo Trip

-- 1. Users Table (可選)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. Trips Table (旅程)
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  theme TEXT DEFAULT 'bg-blue-500',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 3. Groups Table (組別)
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'pink', -- Tailwind color: pink, sky, amber, purple, indigo, teal, cyan, rose, etc.
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(trip_id, name)
);

-- 4. Days Table (日期)
CREATE TABLE IF NOT EXISTS days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  day_title TEXT NOT NULL,
  theme TEXT DEFAULT 'bg-green-500',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(trip_id, day_number)
);

-- 5. Events Table (行程事件) - 核心表
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES days(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  
  -- 基本資訊
  time TEXT NOT NULL,              -- "08:00", "早晨", etc.
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'sight', -- sight, food, shopping, transport, fun, stay, etc.
  location TEXT,
  
  -- 分組資訊
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL, -- NULL 表示全員參加
  
  -- 排序和顯示
  cost NUMERIC DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 補 migration：如果 events 已存在但沒有 cost 欄位，補上欄位
ALTER TABLE events ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT 0;

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_trip_id ON groups(trip_id);
CREATE INDEX IF NOT EXISTS idx_days_trip_id ON days(trip_id);
CREATE INDEX IF NOT EXISTS idx_events_day_id ON events(day_id);
CREATE INDEX IF NOT EXISTS idx_events_group_id ON events(group_id);
CREATE INDEX IF NOT EXISTS idx_events_trip_id ON events(trip_id);

-- 7. RLS (Row Level Security)
-- 啟用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE days ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- ========== users 表 ==========
-- 使用者可以讀取自己的資料
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- 使用者可以新增自己的資料（ensureUserExists 用）
CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 使用者可以更新自己的資料
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ========== trips 表 ==========
-- 使用者只能讀取自己的行程
CREATE POLICY "trips_select_own" ON trips
  FOR SELECT USING (auth.uid() = user_id);

-- 使用者可以建立行程（user_id 必須是自己）
CREATE POLICY "trips_insert_own" ON trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 使用者只能更新自己的行程
CREATE POLICY "trips_update_own" ON trips
  FOR UPDATE USING (auth.uid() = user_id);

-- 使用者只能刪除自己的行程
CREATE POLICY "trips_delete_own" ON trips
  FOR DELETE USING (auth.uid() = user_id);

-- ========== groups 表 ==========
-- 透過 trip 的 user_id 驗證擁有權
CREATE POLICY "groups_select_own" ON groups
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = groups.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "groups_insert_own" ON groups
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = groups.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "groups_update_own" ON groups
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = groups.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "groups_delete_own" ON groups
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = groups.trip_id AND trips.user_id = auth.uid())
  );

-- ========== days 表 ==========
CREATE POLICY "days_select_own" ON days
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = days.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "days_insert_own" ON days
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = days.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "days_update_own" ON days
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = days.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "days_delete_own" ON days
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = days.trip_id AND trips.user_id = auth.uid())
  );

-- ========== events 表 ==========
CREATE POLICY "events_select_own" ON events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = events.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "events_insert_own" ON events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = events.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "events_update_own" ON events
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = events.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "events_delete_own" ON events
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = events.trip_id AND trips.user_id = auth.uid())
  );
