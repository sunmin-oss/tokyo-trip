# 動態分組功能 - 實施方案

## 目前進展 ✅
1. ✅ 需求分析完成
2. ✅ 數據結構設計完成  
3. ✅ 核心函數邏輯設計完成
4. ⏳ 代碼實施中（因工具限制，需分階段進行）

## 實施策略

考慮到工具限制，建議採用**兩階段實施法**：

### 第 1 階段：核心邏輯層（建議先完成）
- [ ] 更新 React State 結構
  - `newDayForm`: 添加 `groups: []` 和 `useGroups: false`
  - `newEventForm`: 添加 `groupIds: []`

- [ ] 添加分組管理函數
  - `addGroupToDayForm()`
  - `removeGroupFromDayForm(groupId)`
  - `updateGroupInDayForm(groupId, name)`
  - `toggleEventGroup(groupId)`

- [ ] 更新核心邏輯
  - `addNewDay()`: 支持保存動態分組
  - `addNewEvent()`: 支持事件分配分組
  - `initialSchedule`: 更新 Day 4 範例格式

### 第 2 階段：UI 層（後續優化）
- [ ] 新增 Day 表單
  - 添加 "使用分組行程" 勾選框
  - 當勾選時顯示分組管理面板
  - 支持添加/移除/編輯分組

- [ ] 新增 Event 表單
  - 如果當前日期有分組，顯示分組多選
  - 用戶可選擇事件屬於的分組

- [ ] 事件顯示層
  - 如果日期有分組，按分組並排顯示事件
  - 同一時段的不同分組各為一列
  - 支持色彩區分

## 快速實施清單

### 步驟 1：更新 State 定義
位置：src/App.jsx 第 33 行附近

```javascript
// 替換舊的 newDayForm
const [newDayForm, setNewDayForm] = useState({ 
  date: '', 
  title: '', 
  theme: 'bg-green-500',
  groups: [],        // 新增：動態分組列表
  useGroups: false   // 新增：是否使用分組
});

// 替換舊的 newEventForm
const [newEventForm, setNewEventForm] = useState({ 
  time: '', 
  title: '', 
  desc: '', 
  type: 'sight',
  groupIds: []       // 新增：事件屬於的分組IDs
});
```

### 步驟 2：添加分組管理函數
位置：src/App.jsx `currentDayData` 定義之前

[見 DYNAMIC_GROUPS_PLAN.md 中的函數代碼]

### 步驟 3：更新 addNewDay 函數
位置：src/App.jsx 第 264 行附近

```javascript
const addNewDay = () => {
  const newDay = {
    day: schedule.length + 1,
    date: newDayForm.date,
    title: newDayForm.title,
    theme: newDayForm.theme,
    groups: newDayForm.useGroups ? newDayForm.groups : [],  // 新邏輯
    events: []
  };
  
  setSchedule([...schedule, newDay]);
  // ... 其他代碼保持不變
};
```

### 步驟 4：更新 initialSchedule
更新 Day 4 作為示例：
```javascript
{
  day: 4,
  date: "1/21 (三)",
  title: "分組行動日",
  theme: "bg-purple-500",
  groups: [
    { id: 'g1', name: 'A 組', color: 'pink' },
    { id: 'g2', name: 'B 組', color: 'sky' }
  ],
  events: [
    { time: "08:00", title: "睡飽一點", desc: "約 09:30 出門", type: "sight", groupIds: ['g1'] },
    { time: "08:00", title: "出發衝入園", desc: "北千住→八丁堀→舞濱", type: "transport", groupIds: ['g2'] },
    // ... 其他時間點類似
  ]
}
```

### 步驟 5：測試
```bash
npm run build    # 確保沒有語法錯誤
npm run dev      # 本地測試功能
git push         # 部署到 GitHub
```

## 優先級建議

**立即完成（這次）：**
- [x] 需求分析
- [x] 方案設計
- [ ] 代碼實施（因工具限制，建議使用 VS Code 直接編輯）

**後續優化：**
- UI 表單增強
- 分組顯示優化
- 性能優化

## 備註

> ⚠️ 由於 AI 工具的文本處理限制，建議直接在 VS Code 中手動編輯 App.jsx
> 或使用以下命令行工具進行更新。

### 推薦工具
- 使用 VS Code 的全局查找替換（Ctrl+H）進行批量修改
- 或使用 sed/awk 命令行工具
- 或使用 Python/Node.js 腳本

## 聯繫幫助

如有任何問題或需要進一步協助，請參考：
- [完整設計文檔](./DYNAMIC_GROUPS_PLAN.md)
- React 官方文檔：https://react.dev
- 本項目 GitHub：https://github.com/sunmin-oss/tokyo-trip
