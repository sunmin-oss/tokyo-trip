# Trip Planner

Trip Planner 是一套以旅遊情境為核心的行程管理系統，支援從規劃、地圖、預算到雲端同步的一站式流程。

## 專案亮點

- 多行程管理：可建立多筆旅行，快速切換不同旅程
- 行程編排：支援 Day/Event 新增、編輯、刪除
- 智慧分類：輸入關鍵字自動分類（食物、交通、購物等）
- 地圖整合：顯示行程地點標記與路線
- 預算追蹤：每日/分類花費統計
- 即時匯率：顯示外幣金額與約略台幣換算
- 打包清單：支援新增、勾選、刪除
- 雲端同步：Supabase Auth + Postgres + RLS

## 技術棧

- React 19
- Vite
- Tailwind CSS
- Supabase (Auth, Database, RLS)
- Leaflet / react-leaflet
- dnd-kit

## 專案結構

```text
src/
	components/
		AuthPage.jsx
		TripList.jsx
		TripDetail.jsx
		TripMap.jsx
		EventTimelineGroup.jsx
		GroupSelector.jsx
	hooks/
		useAuth.js
	services/
		exchangeRate.js
	utils/
		dataTransform.js
	supabaseClient.js
```

## 快速開始

### 1) 安裝依賴

```bash
npm install
```

### 2) 設定環境變數

建立 .env：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3) 啟動開發

```bash
npm run dev
```

預設網址：

http://localhost:5173/tokyo-trip/

### 4) 產生建置

```bash
npm run build
```

## Supabase 必要檢查

請確認下列條件：

1. public.users, trips, days, events, groups 資料表已建立
2. RLS 與 Policy 已啟用（authenticated user 可操作自己的資料）
3. auth.users -> public.users 觸發器存在
4. events 表有 cost 欄位

可在 SQL Editor 執行：

```sql
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cost numeric DEFAULT 0;
```

```sql
SELECT tgname
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
	AND table_name = 'events'
	AND column_name = 'cost';
```

## Demo 流程（給老師）

1. 登入並建立新行程
2. 進入 Trip Detail，確認顯示雲端同步
3. 新增 Day 與 Event（含地點、花費）
4. 切換地圖、預算、打包清單頁面
5. 回列表套用範本，再刷新頁面確認資料可回載

## 部署後 Smoke Test

1. 可登入、可看到列表
2. 新增行程成功，狀態為雲端同步
3. 新增/編輯/刪除事件成功
4. 地圖標記可顯示
5. 預算與匯率換算正常
6. 重新整理後資料仍可從雲端回載

## 專案狀態

- 核心功能：完成
- 雲端整合：完成
- 最終驗證：通過

## 授權

課程專案使用。
