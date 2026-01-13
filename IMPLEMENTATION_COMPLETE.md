# 🎯 Tokyo Trip 動態分組 + Supabase 實施完成

## 📊 已交付的完整解決方案

### 1️⃣ Supabase 資料庫設計 ✅
**檔案**: `supabase_schema.sql`

```
trips (旅程主表)
  ├── groups (動態組別表) - 支持任意數量的組別
  ├── days (日期表)
  │   └── events (行程事件表) 
  │       └── group_id 欄位 (NULL=全員, 有值=特定組別)
```

**核心設計檢查**:
- ✅ groups 表有 `color` 欄位（字串型態）- 支持動態顏色
- ✅ events 表有 `group_id` 欄位（可為 NULL）- 區分全員 vs 分組
- ✅ 完整索引設置 - 優化查詢性能
- ✅ RLS 框架預留 - 便於後續權限控制

---

### 2️⃣ 後端服務層 ✅
**檔案**: `src/services/supabaseService.js`

完整的 CRUD 操作封裝：
```javascript
// 三層服務架構
tripService.getTrip() / createTrip() / updateTrip()
groupService.getGroupsByTrip() / createGroup() / updateGroup() / deleteGroup()
dayService.getDaysByTrip() / createDay() / updateDay() / deleteDay()
eventService.getEventsByDay() / createEvent() / updateEvent() / deleteEvent()

// 高階複合查詢
aggregateService.getFullTrip(tripId) // 一次性載入完整行程 + 所有組別 + 所有事件
```

**特點**:
- 自動 JOIN 關聯表 (events.group_id -> groups)
- 錯誤處理規範化
- 支持 Supabase 即時訂閱 (可選)

---

### 3️⃣ 前端數據轉換層 ✅
**檔案**: `src/utils/dataTransform.js`

從 Supabase 原始數據 → 可渲染格式的轉換邏輯：

```javascript
// 核心轉換函數
groupEventsByTimeAndGroup(events, groups)
  ↓
  將事件按「時間」分組
  然後按「所屬組別」分欄
  返回 swimlane 布局數據

// 輔助函數
getGridColsClass(count)        // 自動計算 Grid 欄數
getColorClasses(colorName)     // 將顏色字串轉換為 Tailwind class
organizeEventsByGroup()        // 按組別組織事件
calculateGridColumns()         // 計算最佳布局欄數
```

**轉換邏輯視覺化**:
```
【原始數據】
events = [
  { time: "08:00", title: "睡飽", group_id: "g1" },
  { time: "08:00", title: "出發", group_id: "g2" },
  { time: "12:00", title: "午餐", group_id: null }
]

        ↓ groupEventsByTimeAndGroup()

【轉換後】
timeSlots = [
  {
    time: "08:00",
    allGroupsEvents: [],
    groupLayout: [
      { groupId: "g1", groupName: "A 組", color: "pink", events: [...] },
      { groupId: "g2", groupName: "B 組", color: "sky", events: [...] }
    ]
  },
  {
    time: "12:00",
    allGroupsEvents: [{ title: "午餐" }],
    groupLayout: []
  }
]

        ↓ 直接在 React 中渲染
```

---

### 4️⃣ 核心 UI 組件 ✅

#### **EventTimelineGroup** (`src/components/EventTimelineGroup.jsx`)
Swimlane 布局組件 - 同一時段多組事件並排顯示

```jsx
【全員時段】- 佔滿整行
┌─────────────────────────────┐
│   12:00 午餐 (全員參加)      │
└─────────────────────────────┘

【2 組時段】- Grid cols-2
┌──────────────────┬──────────────────┐
│ 08:00 睡飽 (A組) │ 08:00 出發 (B組) │
└──────────────────┴──────────────────┘

【3 組時段】- Grid cols-3
┌─────────┬─────────┬─────────┐
│ 攝影組   │ 購物組  │迪士尼組 │
└─────────┴─────────┴─────────┘
```

**特點**:
- 自動計算 Grid 欄數 (1-4 欄)
- 色彩編碼 (每組自動配色)
- 支持編輯/刪除操作
- 位置地圖整合

#### **GroupManagementPanel** (`src/components/GroupSelector.jsx`)
新增日程時的組別管理面板

```jsx
┌─────────────────────────────────┐
│      組別管理                     │
├─────────────────────────────────┤
│ ● A 組 (pink)  [編輯] [移除]     │
│ ● B 組 (sky)   [編輯] [移除]     │
│ ● C 組 (amber) [編輯] [移除]     │
├─────────────────────────────────┤
│ [輸入框] [+ 新增組別]             │
└─────────────────────────────────┘
```

**功能**:
- 動態新增組別
- 編輯組別名稱
- 刪除組別 (事件不刪除，group_id 設 NULL)
- 自動配色

#### **GroupSelector** (`src/components/GroupSelector.jsx`)
新增事件時的分組選擇器

```jsx
◉ 全員參加              [此時段對所有組別開放]
○ A 組 (pink)          [攝影組]
○ B 組 (sky)           [購物組]
○ C 組 (amber)         [迪士尼組]
```

**特點**:
- 單選單一組別或全員
- 色彩視覺提示
- 可擴展至多選 (若需要)

---

### 5️⃣ 完整實施指南 ✅
**檔案**: `SUPABASE_MIGRATION_GUIDE.md`

包含:
- ✅ 資料庫架構解析
- ✅ 前端數據流圖
- ✅ UI 布局策略
- ✅ 分步實施清單
- ✅ 顏色系統參考表
- ✅ 常見問題解答
- ✅ 性能優化建議
- ✅ 遷移策略 (漸進 vs 完整)

---

## 🔧 關鍵設計檢查

### ✅ 資料庫檢查
| 項目 | 狀態 | 說明 |
|------|------|------|
| groups 表 color 欄位 | ✅ | 字串型態，支持 11 種顏色 |
| events group_id 欄位 | ✅ | 可為 NULL (全員) 或參考 groups.id |
| 外鍵約束 | ✅ | 級聯刪除 (ON DELETE CASCADE) |
| 索引 | ✅ | trip_id, day_id, group_id 已索引 |
| RLS 框架 | ✅ | 預留權限控制結構 |

### ✅ 前端邏輯檢查
| 項目 | 狀態 | 說明 |
|------|------|------|
| NULL group_id 處理 | ✅ | 自動歸入 allGroupsEvents |
| 同時段多組事件 | ✅ | 按 groupLayout 並排顯示 |
| 動態 Grid 欄數 | ✅ | 1-4 自動計算 |
| 顏色動態生成 | ✅ | getColorClasses() 轉換 |
| 組別管理 UI | ✅ | 新增/編輯/刪除完整 |

### ✅ 顏色系統
| 顏色 | Tailwind 類 | 預覽 |
|------|-------------|------|
| pink | pink-100/400/500 | 🎀 |
| sky | sky-100/400/500 | 🔵 |
| amber | amber-100/400/500 | 🟡 |
| purple | purple-100/400/500 | 🟣 |
| indigo | indigo-100/400/500 | 🔷 |
| teal | teal-100/400/500 | 🟢 |
| cyan | cyan-100/400/500 | 💙 |
| rose | rose-100/400/500 | 🌹 |
| green | green-100/400/500 | 💚 |
| red | red-100/400/500 | ❤️ |
| blue | blue-100/400/500 | 💙 |

---

## 📁 文件結構

```
tokyo-trip/
├── supabase_schema.sql                 # SQL 建表指令
├── SUPABASE_MIGRATION_GUIDE.md         # 完整實施指南
├── src/
│   ├── services/
│   │   └── supabaseService.js          # Supabase CRUD 服務層
│   ├── utils/
│   │   └── dataTransform.js            # 數據轉換工具函數
│   └── components/
│       ├── EventTimelineGroup.jsx      # Swimlane 布局組件
│       └── GroupSelector.jsx           # 組別管理和選擇組件
└── [其他原有檔案]
```

---

## 🚀 使用方式

### 1. 設置 Supabase

```bash
# 1. 在 Supabase Dashboard 執行 supabase_schema.sql
# 2. 配置環境變數
cat > .env.local << EOF
VITE_SUPABASE_URL=你的_URL
VITE_SUPABASE_ANON_KEY=你的_KEY
EOF
```

### 2. 在 React 組件中使用

```jsx
import { aggregateService } from './services/supabaseService';
import { groupEventsByTimeAndGroup } from './utils/dataTransform';
import EventTimelineGroup from './components/EventTimelineGroup';

function DayView({ tripId, dayNumber }) {
  const [dayData, setDayData] = useState(null);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    // 載入完整行程資料
    aggregateService.getFullTrip(tripId).then(trip => {
      setGroups(trip.groups);
      setDayData(trip.days[dayNumber - 1]);
    });
  }, [tripId, dayNumber]);

  // 轉換數據用於渲染
  const timeSlots = groupEventsByTimeAndGroup(dayData.events, groups);

  return (
    <div className="space-y-4">
      {timeSlots.map(slot => (
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

### 3. 新增組別

```jsx
import { GroupManagementPanel } from './components/GroupSelector';

<GroupManagementPanel
  groups={groups}
  onAddGroup={(groupData) => {
    groupService.createGroup(tripId, groupData).then(newGroup => {
      setGroups([...groups, newGroup]);
    });
  }}
  onRemoveGroup={(groupId) => {
    groupService.deleteGroup(groupId).then(() => {
      setGroups(groups.filter(g => g.id !== groupId));
    });
  }}
/>
```

---

## ✨ 亮點特性

1. **完全動態** - 支持無限數量的組別 (不限 A/B)
2. **智能布局** - 自動根據組別數量調整 Grid (1-4 欄)
3. **色彩編碼** - 11 種預設顏色，自動分配
4. **全員支持** - 同時段支持全員 + 分組混合
5. **易於擴展** - 組件化設計，易於二次開發
6. **性能優化** - 聚合查詢，減少 N+1 問題
7. **無損遷移** - 支持從本地 JSON 漸進式遷移

---

## 📈 下一步

### 立即可做
- [ ] 在 Supabase Dashboard 執行 SQL 建表
- [ ] 配置環境變數
- [ ] 整合 supabaseService 到現有 App.jsx

### 推薦做法
- [ ] 使用 React Query 或 SWR 管理 Supabase 數據快取
- [ ] 實現實時協作編輯 (Supabase Realtime)
- [ ] 添加行程版本控制 (歷史紀錄)
- [ ] 分享行程連結功能

### 未來功能
- [ ] 多人協作編輯
- [ ] 行程投票系統 (組別成員投票選擇活動)
- [ ] 匯出為 PDF 或圖片
- [ ] AI 助手推薦行程

---

## 💡 驗收標準

| 項目 | 檢查 |
|------|------|
| SQL Schema 完整 | ✅ |
| Supabase Service 層 | ✅ |
| 數據轉換邏輯 | ✅ |
| UI 組件 (3 個) | ✅ |
| Swimlane 布局 | ✅ |
| 顏色系統 | ✅ |
| 完整文檔 | ✅ |
| 構建成功 | ✅ |
| Git 提交 | ✅ |
| GitHub 推送 | ✅ |

---

**所有代碼已推送至 GitHub，構建驗證通過。** 🎉

現在您可以根據 `SUPABASE_MIGRATION_GUIDE.md` 進行後續整合。
