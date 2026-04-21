# Trip Planner

多媒體系統設計專案 Trip Planner。

這是一套支援雲端同步的旅遊規劃工具，整合行程排程、互動地圖、預算追蹤、打包清單、行程範本與拖曳排序。

## 主要功能

- Email/Google 登入（Supabase Auth）
- 多行程管理（Trip List）
- 行程天數與事件 CRUD（Day/Event）
- 事件智慧分類（輸入標題自動推測類型）
- 拖曳排序與跨日移動
- 互動地圖（Leaflet + OpenStreetMap + Nominatim）
- 預算追蹤（每日、分類統計）
- 即時匯率換算（顯示約略 TWD 金額）
- 打包清單（預設項目、一鍵勾選）
- 行程範本一鍵套用（雲端與本地皆支援）

## 技術棧

- React 19 + Vite
- Tailwind CSS
- Supabase（Auth + Postgres + RLS）
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

### 1. 安裝

```bash
npm install
```

### 2. 設定環境變數

建立 `.env`：

```env
VITE_SUPABASE_URL=你的_supabase_project_url
VITE_SUPABASE_ANON_KEY=你的_supabase_anon_key
```

### 3. 啟動開發環境

```bash
npm run dev
```

預設網址：

`http://localhost:5173/tokyo-trip/`

### 4. 建置

```bash
npm run build
```

## Supabase 設定重點

本專案雲端模式需要以下條件：

1. `public.users`, `trips`, `days`, `events`, `groups` 資料表已建立
2. RLS 已啟用且 Policy 可允許 authenticated user 操作自己的資料
3. `auth.users -> public.users` 觸發器已建立
4. `events.cost` 欄位存在

### 必要 SQL（若尚未執行）

```sql
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cost numeric DEFAULT 0;
```

### 快速檢查 SQL

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

## 雲端同步判斷邏輯

Trip Detail 是否顯示雲端徽章，依據以下條件：

- Supabase URL/Key 已設定
- 使用者已登入
- Trip id 不是 `local-` 開頭

滿足條件顯示 `☁️ 雲端同步`，否則顯示 `📁 本地存儲`。

## 常見問題

### 1. 顯示本地模式而非雲端模式

- 請確認你點進去的行程不是舊的本地行程（`id` 為 `local-...`）
- 重新建立一筆新行程測試

### 2. 登入後無限 Loading

- 確認 Supabase RLS 已設定
- 確認 `on_auth_user_created` trigger 存在
- 確認 `public.users` 已有目前登入者資料

### 3. 可以新增行程，但事件新增失敗

- 確認 `events` 表已有 `cost` 欄位

## 指令

```bash
npm run dev      # 開發模式
npm run build    # 產生 production build
npm run preview  # 預覽 build 結果
```

## 給老師看的 Demo 流程

建議展示時間：約 5-8 分鐘。

### Demo 前準備（30 秒）

1. 確認可登入帳號可用（Email 或 Google）
2. 確認 Supabase 連線正常（環境變數已設定）
3. 開啟首頁，準備從 Trip List 開始展示

### Step 1：登入與雲端狀態（1 分鐘）

1. 在登入頁完成登入
2. 進入行程列表後，建立一筆新行程
3. 進入 Trip Detail，指出左上角顯示 `☁️ 雲端同步`

可講解重點：

- 系統可辨識登入狀態與雲端模式
- 同步資料來源為 Supabase，而非僅 localStorage

### Step 2：行程編輯核心流程（2 分鐘）

1. 新增 Day（例如 Day 1）
2. 新增 2-3 筆事件（含時間、地點、花費）
3. 示範智慧分類：輸入如「拉麵」自動切換到食物類型
4. 示範編輯與刪除其中一筆事件

可講解重點：

- CRUD 完整可用
- 表單、分類、資料更新是即時反映

### Step 3：地圖 + 預算 + 打包清單（2-3 分鐘）

1. 切到地圖分頁：顯示事件座標與路線
2. 切到預算分頁：展示總花費、每日花費、分類花費
3. 切換幣別，展示即時 `≈ NT$` 換算
4. 切到打包清單：新增項目、勾選完成狀態

可講解重點：

- 旅遊情境下三大實用功能已整合
- 同一份資料可跨不同視圖同步呈現

### Step 4：範本與同步驗證（1-2 分鐘）

1. 返回 Trip List
2. 一鍵套用行程範本（如東京五天四夜）
3. 重新整理頁面（F5）
4. 再次進入行程，確認資料仍存在

可講解重點：

- 範本可快速建立完整行程
- 重整後可從雲端回載，證明持久化與同步正常

### 收尾總結（30 秒）

可用一句話收尾：

「本系統已完成從登入、規劃、地圖、預算到雲端持久化的完整旅遊流程，並通過完整測試驗證。」

## 部署後 Smoke Test 清單

建議每次部署後，用同一組測試帳號在 5-10 分鐘內跑完以下項目。

### A. 連線與登入

1. 開啟站台後可進入登入頁
2. Email 登入成功，進入 Trip List
3. 無 console 403 / 500 錯誤

### B. 雲端模式判定

1. 新建一筆行程後進入 Trip Detail
2. 左上角徽章顯示 `☁️ 雲端同步`
3. 重新整理頁面後，該行程仍可從列表載入

### C. 行程資料 CRUD

1. 新增 Day（日期/標題/主題色）
2. 在該 Day 新增事件（含地點與花費）
3. 編輯同筆事件後儲存成功
4. 刪除事件後，畫面與資料正確更新

### D. 預算與匯率

1. 預算分頁顯示總花費、每日花費、分類花費
2. 切換幣別（JPY/TWD/USD 等）顯示正常
3. 若非 TWD 幣別，顯示 `≈ NT$` 換算

### E. 地圖與打包清單

1. 地圖分頁可渲染標記，點擊有 Popup
2. 切換當天/全部模式正常
3. 打包清單可新增、勾選、刪除並即時更新

### F. 範本與持久化

1. 一鍵套用任一範本成功
2. 範本 Day/Event 內容完整載入
3. 重新整理後資料仍存在（雲端回載成功）

### G. 資料庫快檢（Supabase SQL Editor）

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

預期：兩段查詢都至少回傳 1 筆。

### Smoke Test 完成標準

- 上述 A-G 全部通過
- 無阻塞性錯誤（登入卡住、無限 loading、403/500）
- 雲端資料可成功寫入並回載

## 狀態

- 核心功能測試：100% 通過
- 雲端同步流程：可正常建立、讀取、刷新回載

## 授權

課程專案使用。
