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
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_trip_id ON groups(trip_id);
CREATE INDEX IF NOT EXISTS idx_days_trip_id ON days(trip_id);
CREATE INDEX IF NOT EXISTS idx_events_day_id ON events(day_id);
CREATE INDEX IF NOT EXISTS idx_events_group_id ON events(group_id);
CREATE INDEX IF NOT EXISTS idx_events_trip_id ON events(trip_id);

-- 7. RLS (Row Level Security) - 如果需要
-- 啟用 RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE days ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policies (假設所有使用者都可以讀寫，後續可細化)
-- CREATE POLICY "Enable read access for all users" ON trips
--   FOR SELECT USING (true);
-- CREATE POLICY "Enable insert for all users" ON trips
--   FOR INSERT WITH CHECK (true);
-- ... 更多 policies
