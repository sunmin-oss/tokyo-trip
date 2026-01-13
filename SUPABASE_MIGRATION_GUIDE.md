# Supabase 動態分組實施指南

## 概述

本指南詳細說明如何重構 Tokyo Trip 應用，從本地 JSON 遷移到 Supabase，並實現動態分組功能。

## 核心設計

### 1. 資料庫架構

```
trips (旅程)
├── groups (組別) - 每個旅程可有多個組別
├── days (日期)
│   └── events (行程事件)
│       ├── group_id (NULL = 全員; 有值 = 特定組別)
```

**關鍵設計決策：**
- `events.group_id` 為 NULL 時 = 全員參加
- `events.group_id` 有值時 = 只有該組參加
- `groups.color` 存字串 (pink, sky, etc.)，前端動態轉換 CSS class

### 2. 前端數據結構

```javascript
// Supabase 拉回的原始數據
day = {
  id: "day-1",
  day_number: 1,
  date: "2025-01-18",
  events: [
    {
      id: "evt-1",
      time: "08:00",
      title: "睡飽",
      group_id: "g1"  // 屬於 A 組
    },
    {
      id: "evt-2",
      time: "08:00",
      title: "出發",
      group_id: "g2"  // 屬於 B 組
    },
    {
      id: "evt-3",
      time: "12:00",
      title: "午餐",
      group_id: null  // 全員參加
    }
  ]
}

// 轉換後的渲染格式（透過 groupEventsByTimeAndGroup）
timeSlots = [
  {
    time: "08:00",
    allGroupsEvents: [],
    groupedEvents: [evt-1, evt-2],
    groupLayout: [
      {
        groupId: "g1",
        groupName: "A 組",
        color: "pink",
        events: [evt-1]
      },
      {
        groupId: "g2",
        groupName: "B 組",
        color: "sky",
        events: [evt-2]
      }
    ]
  },
  {
    time: "12:00",
    allGroupsEvents: [evt-3],
    groupedEvents: [],
    groupLayout: []
  }
]
```

### 3. UI 布局策略

**全員時段（colSpan = full）：**
```
┌─────────────────────────────┐
│   12:00 午餐 (全員參加)      │
└─────────────────────────────┘
```

**2組時段（colSpan = 1/2 each）：**
```
┌──────────────────┬──────────────────┐
│ 08:00 睡飽 (A組)  │ 08:00 出發 (B組) │
└──────────────────┴──────────────────┘
```

**3組時段（colSpan = 1/3 each）：**
```
┌──────────┬──────────┬──────────┐
│ 攝影組   │ 購物組   │迪士尼組  │
│ ...      │ ...      │ ...      │
└──────────┴──────────┴──────────┘
```

CSS 透過 Tailwind Grid 自動計算：
```javascript
getGridColsClass(groupCount) // 返回 grid-cols-2 / grid-cols-3 / grid-cols-4
```

## 實施步驟

### Step 1: Supabase 設置

1. 進入 Supabase Dashboard
2. 執行 [supabase_schema.sql](./supabase_schema.sql) 中的 SQL
3. 驗證表已建立

```bash
# 驗證命令
select * from information_schema.tables where table_name in ('trips', 'groups', 'days', 'events');
```

### Step 2: 安裝依賴（已安裝）

```bash
npm install @supabase/supabase-js
```

### Step 3: 配置 Supabase 客戶端

```javascript
// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Step 4: 使用服務層

```javascript
// 從 Supabase 載入完整旅程
import { aggregateService } from './services/supabaseService';

const fullTrip = await aggregateService.getFullTrip(tripId);
// 返回: { trip, groups, days: [{ ...day, events }] }
```

### Step 5: 轉換數據用於渲染

```javascript
import { groupEventsByTimeAndGroup } from './utils/dataTransform';

const day = fullTrip.days[0];
const timeSlots = groupEventsByTimeAndGroup(day.events, fullTrip.groups);

// 現在 timeSlots 已按時間和組別組織，可直接渲染
timeSlots.forEach(slot => {
  // slot.time: "08:00"
  // slot.allGroupsEvents: [...]
  // slot.groupLayout: [{groupId, groupName, color, events}, ...]
});
```

### Step 6: 在 React 組件中使用

```jsx
import EventTimelineGroup from './components/EventTimelineGroup';
import { groupEventsByTimeAndGroup } from './utils/dataTransform';

export function DayView({ day, groups }) {
  const timeSlots = groupEventsByTimeAndGroup(day.events, groups);

  return (
    <div className="space-y-4">
      {timeSlots.map((slot) => (
        <EventTimelineGroup
          key={slot.time}
          timeEvent={slot}
          groupCount={groups.length}
          onEditEvent={handleEdit}
          onDeleteEvent={handleDelete}
          openMap={openMap}
        />
      ))}
    </div>
  );
}
```

## 顏色系統

### 支持的顏色

| 顏色名稱 | Tailwind | 預覽 |
|---------|----------|------|
| pink    | pink-100/400/500 | 🎀 |
| sky     | sky-100/400/500  | 🔵 |
| amber   | amber-100/400/500 | 🟡 |
| purple  | purple-100/400/500 | 🟣 |
| indigo  | indigo-100/400/500 | 🔷 |
| teal    | teal-100/400/500 | 🔵 |
| cyan    | cyan-100/400/500 | 💙 |
| rose    | rose-100/400/500 | 🌹 |
| green   | green-100/400/500 | 💚 |
| red     | red-100/400/500 | ❤️ |
| blue    | blue-100/400/500 | 💙 |

### 動態顏色應用

```javascript
const colorClasses = getColorClasses('pink');
// 返回: {
//   bg: 'bg-pink-100',
//   border: 'border-pink-400',
//   text: 'text-pink-800',
//   badge: 'bg-pink-500'
// }

// 在 JSX 中
<div className={`${colorClasses.bg} border-2 ${colorClasses.border}`}>
  { /* content */ }
</div>
```

## 重要檢查清單

### ✅ 資料庫檢查

- [ ] groups 表有 color 欄位（字串型態）
- [ ] events 表有 group_id 欄位（可為 NULL）
- [ ] 索引已建立（提升查詢效能）

### ✅ 前端檢查

- [ ] getColorClasses() 支持所有可能的顏色
- [ ] groupEventsByTimeAndGroup() 正確分組事件
- [ ] EventTimelineGroup 組件支持 1-4 欄網格
- [ ] GroupSelector 提供「全員」和「特定組別」選項

### ✅ 邏輯檢查

- [ ] NULL group_id 事件顯示在全員區域
- [ ] 同一時段不同組別事件並排顯示
- [ ] 支持添加/編輯/刪除組別
- [ ] 刪除組別不刪除相關事件（設 group_id 為 NULL）

## 遷移策略

### 方案 A: 漸進式遷移（推薦）

1. 保留現有本地 JSON 日程
2. 新增「匯出到 Supabase」功能
3. 新增「從 Supabase 匯入」功能
4. 逐步切換用戶到 Supabase 版本

### 方案 B: 完整切換

1. 建立新的 useSupabaseSchedule() hook
2. 替換所有本地狀態
3. 測試所有功能
4. 部署新版本

## 常見問題

**Q: 如何處理沒有組別的日期？**
A: 不建立任何 group 記錄。events.group_id 全部為 NULL。UI 自動顯示為全員模式。

**Q: 可以一個事件屬於多個組別嗎？**
A: 目前設計不支持（一個 event 只有一個 group_id）。若需要，可改用陣列型欄位或建立 event_groups junction table。

**Q: 刪除組別時會發生什麼？**
A: 建議採用「軟刪除」或設 events.group_id 為 NULL，而非硬刪除。

**Q: 如何在線上編輯而不影響服務？**
A: 使用 Supabase 即時訂閱 (Realtime) 功能，但需注意成本。

## 性能優化

### 推薦做法

1. **批量查詢**：一次性載入完整旅程，而非個別查詢
2. **本地快取**：React Query 或 SWR
3. **分頁**：若旅程過大，按日期分頁
4. **索引**：在 trip_id, day_id, group_id 上建立索引

### SQL 優化範例

```sql
-- 優化的複合查詢
SELECT 
  d.*,
  json_agg(
    json_build_object(
      'id', e.id,
      'time', e.time,
      'title', e.title,
      'group_id', e.group_id,
      'group', json_build_object(
        'id', g.id,
        'name', g.name,
        'color', g.color
      )
    )
  ) as events
FROM days d
LEFT JOIN events e ON d.id = e.day_id
LEFT JOIN groups g ON e.group_id = g.id
WHERE d.trip_id = $1
GROUP BY d.id
ORDER BY d.day_number;
```

## 後續功能

- [ ] 實時協作編輯（多人同時修改）
- [ ] 行程版本控制（歷史紀錄）
- [ ] 分享行程連結
- [ ] 匯出為 PDF
- [ ] 行程投票（組別成員投票選擇活動）
