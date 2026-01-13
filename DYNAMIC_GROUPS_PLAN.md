# 動態分組功能實現計劃

## 目標
讓用戶可以在新增日程時創建任意數量的分組，而不是固定的 A/B 組。

## 數據結構改變

### 當前結構（Day 4 範例）
```javascript
{
  day: 4,
  date: "1/21 (三)",
  title: "分組行動日",
  theme: "bg-purple-500",
  isSplit: true,
  groupAName: 'A 組',
  groupBName: 'B 組',
  splitEvents: [
    {
      time: "早晨",
      groupA: { title: "...", desc: "..." },
      groupB: { title: "...", desc: "..." }
    }
  ]
}
```

### 新結構
```javascript
{
  day: 4,
  date: "1/21 (三)",
  title: "分組行動日",
  theme: "bg-purple-500",
  groups: [
    { id: 'g1', name: 'A 組', color: 'pink' },
    { id: 'g2', name: 'B 組', color: 'sky' },
    { id: 'g3', name: 'C 組', color: 'amber' }  // 可選第三組
  ],
  events: [
    {
      time: "08:00",
      title: "睡飽一點",
      desc: "約 09:30 出門",
      type: "sight",
      groupIds: ['g1'],  // 屬於 A 組
      location?: "..."
    },
    {
      time: "08:00",
      title: "出發衝入園",
      desc: "北千住→八丁堀→舞濱",
      type: "transport",
      groupIds: ['g2'],  // 屬於 B 組
      location?: "..."
    }
  ]
}
```

## React State 更新

### 新增 day 時的 form 狀態
```javascript
const [newDayForm, setNewDayForm] = useState({
  date: '',
  title: '',
  theme: 'bg-green-500',
  groups: [], // [{id: string, name: string, color: string}, ...]
  useGroups: false
});
```

### 新增 event 時的 form 狀態
```javascript
const [newEventForm, setNewEventForm] = useState({
  time: '',
  title: '',
  desc: '',
  type: 'sight',
  groupIds: [] // 事件屬於的分組IDs
});
```

## 需要實現的函數

```javascript
// 在新增 day 時添加分組
const addGroupToDayForm = () => {
  const colors = ['pink', 'sky', 'amber', 'purple', 'indigo', 'teal'];
  const newId = 'group_' + Date.now();
  const newGroup = {
    id: newId,
    name: `分組 ${newDayForm.groups.length + 1}`,
    color: colors[newDayForm.groups.length % colors.length]
  };
  setNewDayForm({
    ...newDayForm,
    groups: [...newDayForm.groups, newGroup],
    useGroups: true
  });
};

// 移除分組
const removeGroupFromDayForm = (groupId) => {
  setNewDayForm({
    ...newDayForm,
    groups: newDayForm.groups.filter(g => g.id !== groupId)
  });
};

// 更新分組名稱
const updateGroupInDayForm = (groupId, name) => {
  setNewDayForm({
    ...newDayForm,
    groups: newDayForm.groups.map(g =>
      g.id === groupId ? { ...g, name } : g
    )
  });
};

// 切換事件的分組
const toggleEventGroup = (groupId) => {
  setNewEventForm({
    ...newEventForm,
    groupIds: newEventForm.groupIds.includes(groupId)
      ? newEventForm.groupIds.filter(id => id !== groupId)
      : [...newEventForm.groupIds, groupId]
  });
};
```

## UI 變化

### 新增日程表單
- 添加 "使用分組行程" 勾選框
- 當勾選時顯示分組管理區域
- 每個分組有：
  - 刪除按鈕
  - 編輯名稱的輸入框
  - 顏色標示

### 新增事件表單
- 如果當前日期有分組，顯示"分配到分組"區域
- 多選勾選框讓用戶選擇事件屬於的分組
- 事件可以屬於多個分組

## 渲染邏輯

### 顯示普通日期 (無分組)
- 正常顯示事件列表

### 顯示分組日期 (有分組)
- 按時間分組顯示
- 每個時間點下，顯示多個卡片（每個分組一個）
- 如果事件不屬於任何分組，單獨顯示

## 實現步驟
1. ✅ 理解需求
2. ⏳ 修改 state 結構
3. ⏳ 實現分組管理函數
4. ⏳ 更新 initialSchedule 格式（Day 4 作為範例）
5. ⏳ 更新新增 day 邏輯
6. ⏳ 更新新增 event 邏輯
7. ⏳ 更新 day 表單 UI
8. ⏳ 更新 event 表單 UI
9. ⏳ 更新事件顯示 UI
10. ⏳ 測試構建
11. ⏳ 部署到 GitHub

## 預期效果
- 用戶可以為任何日期創建動態分組
- 每個分組有自己的名稱和顏色
- 事件可以分配到特定分組或多個分組
- 界面簡潔且直觀
