# Supabase 設定指南

## 步驟 1: 創建 Supabase 帳號

1. 前往 [https://supabase.com](https://supabase.com)
2. 點擊 "Start your project" 
3. 使用 GitHub 或 Email 註冊帳號
4. 創建新專案 (選擇你喜歡的區域)

## 步驟 2: 獲取 API 密鑰

1. 在 Supabase 儀表板中，進入 **Settings** → **API**
2. 複製以下值：
   - **Project URL** → 貼到 `.env.local` 的 `VITE_SUPABASE_URL`
   - **anon public** (在 Project API keys 下) → 貼到 `VITE_SUPABASE_ANON_KEY`

## 步驟 3: 創建資料庫表結構

在 Supabase 儀表板的 **SQL Editor** 中執行以下 SQL：

```sql
-- 創建 trips 表
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 創建 schedules 表 (日程)
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  theme TEXT DEFAULT 'bg-blue-500',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 創建 events 表 (事件/活動)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  time TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  type TEXT DEFAULT 'sight',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 創建索引以提高查詢性能
CREATE INDEX idx_schedules_trip_id ON schedules(trip_id);
CREATE INDEX idx_events_schedule_id ON events(schedule_id);

-- 啟用 RLS (Row Level Security) - 可選
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 為公開讀取創建策略
CREATE POLICY "Allow public read" ON trips FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON schedules FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON events FOR SELECT USING (true);
```

## 步驟 4: 驗證設定

1. 將 API 密鑰貼到 `.env.local`
2. 運行 `npm run dev`
3. 檢查瀏覽器控制台是否有警告
4. 如果沒有警告，表示配置成功！

## 使用 API

應用已整合 Supabase API，你可以使用以下函數：

```javascript
import {
  createTrip,
  fetchTrips,
  fetchTripWithDetails,
  updateTrip,
  createSchedule,
  updateSchedule,
  createEvent,
  updateEvent,
  deleteEvent,
  fetchScheduleEvents
} from './supabaseApi'
```

## 注意事項

- ⚠️ 不要提交 `.env.local` 到 GitHub
- 🔒 在生產環境中，考慮設定 RLS 政策
- 📱 免費級別的 Supabase 有足夠的限額用於個人專案
- 💾 本地編輯功能仍然有效，Supabase 是可選的增強功能
