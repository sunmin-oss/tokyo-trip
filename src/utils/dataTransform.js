/**
 * 數據轉換工具 - 將 Supabase 數據轉換成前端渲染格式
 */

/**
 * 將事件按照時間範圍重疊分組
 * 同一時段重疊的事件並排，當較短事件結束後，較長的接續往下
 */
export const groupEventsByTimeAndGroup = (events, groups) => {
  if (!events || events.length === 0) return [];

  // 檢查是否有任何事件設定了 endTime
  const hasAnyEndTime = events.some(e => e.endTime);

  if (!hasAnyEndTime) {
    // 所有事件都沒有結束時間 → 用開始時間分組（向下相容）
    return groupByStartTime(events, groups);
  }

  // 收集所有時間邊界
  const boundaries = new Set();
  events.forEach(e => {
    if (e.time) boundaries.add(e.time);
    if (e.endTime) boundaries.add(e.endTime);
  });

  const sortedBounds = [...boundaries].sort();
  if (sortedBounds.length === 0) return [];

  const slots = [];
  for (let i = 0; i < sortedBounds.length; i++) {
    const time = sortedBounds[i];

    // 找出在此時間點活躍的事件
    const activeEvents = events.filter(e => {
      const start = e.time || '';
      const end = e.endTime || '';
      if (!end) {
        // 點事件：只在開始時間活躍
        return start === time;
      }
      // 區間事件：start <= time < end
      return start <= time && end > time;
    });

    if (activeEvents.length === 0) continue;

    // 跟前一個 slot 比較，若活躍事件集合相同則跳過
    const currKey = activeEvents.map(e => e._id || e.title).sort().join(',');
    const prev = slots[slots.length - 1];
    if (prev && prev._key === currKey) continue;

    const allGroupsEvents = activeEvents.filter(e => !e.group_id);
    const groupedEvents = activeEvents.filter(e => e.group_id);

    slots.push({
      time,
      endTime: sortedBounds[i + 1] || null,
      allGroupsEvents,
      groupedEvents,
      groupLayout: organizeEventsByGroup(groupedEvents, groups),
      _key: currKey
    });
  }

  return slots;
};

/** 純開始時間分組（向下相容無 endTime 的舊資料） */
function groupByStartTime(events, groups) {
  const timeGroups = {};
  events.forEach(event => {
    const t = event.time || '';
    if (!timeGroups[t]) timeGroups[t] = [];
    timeGroups[t].push(event);
  });
  return Object.entries(timeGroups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, timeEvents]) => {
      const allGroupsEvents = timeEvents.filter(e => !e.group_id);
      const groupedEvents = timeEvents.filter(e => e.group_id);
      return {
        time,
        endTime: null,
        allGroupsEvents,
        groupedEvents,
        groupLayout: organizeEventsByGroup(groupedEvents, groups)
      };
    });
}

/**
 * 將分組事件按照組別組織，返回每個組別的事件列表
 */
export const organizeEventsByGroup = (events, groups) => {
  const layout = {};
  
  // 初始化每個組別
  groups.forEach((group) => {
    layout[group.id] = {
      groupId: group.id,
      groupName: group.name,
      color: group.color,
      events: []
    };
  });
  
  // 將事件分配到各組
  events.forEach((event) => {
    if (layout[event.group_id]) {
      layout[event.group_id].events.push(event);
    }
  });
  
  // 轉換為陣列，只保留有事件的組別
  return Object.values(layout).filter(col => col.events.length > 0);
};

/**
 * 計算 CSS Grid 的欄數
 * 根據最大的分組數量自動計算
 */
export const calculateGridColumns = (days, _groups) => {
  let maxGroupsInDay = 0;
  
  days.forEach((day) => {
    if (day.events && day.events.length > 0) {
      day.events.forEach((timeEvent) => {
        if (timeEvent.groupLayout) {
          maxGroupsInDay = Math.max(maxGroupsInDay, timeEvent.groupLayout.length);
        }
      });
    }
  });
  
  // 最多不超過 4 欄
  return Math.min(Math.max(maxGroupsInDay, 2), 4);
};

/**
 * 生成 Tailwind Grid 類名
 */
export const getGridColsClass = (count) => {
  const mapping = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  };
  return mapping[Math.min(count, 4)] || 'grid-cols-2';
};

/**
 * 生成顏色類名 - 動態從字串轉換
 * @param {string} colorName - 顏色名稱 (pink, sky, amber, etc.)
 * @returns {object} 包含背景色、邊框色、文字色的類名
 */
export const getColorClasses = (colorName = 'pink') => {
  const colorMap = {
    pink: {
      bg: 'bg-pink-100',
      border: 'border-pink-400',
      text: 'text-pink-800',
      badge: 'bg-pink-500'
    },
    sky: {
      bg: 'bg-sky-100',
      border: 'border-sky-400',
      text: 'text-sky-800',
      badge: 'bg-sky-500'
    },
    amber: {
      bg: 'bg-amber-100',
      border: 'border-amber-400',
      text: 'text-amber-800',
      badge: 'bg-amber-500'
    },
    purple: {
      bg: 'bg-purple-100',
      border: 'border-purple-400',
      text: 'text-purple-800',
      badge: 'bg-purple-500'
    },
    indigo: {
      bg: 'bg-indigo-100',
      border: 'border-indigo-400',
      text: 'text-indigo-800',
      badge: 'bg-indigo-500'
    },
    teal: {
      bg: 'bg-teal-100',
      border: 'border-teal-400',
      text: 'text-teal-800',
      badge: 'bg-teal-500'
    },
    cyan: {
      bg: 'bg-cyan-100',
      border: 'border-cyan-400',
      text: 'text-cyan-800',
      badge: 'bg-cyan-500'
    },
    rose: {
      bg: 'bg-rose-100',
      border: 'border-rose-400',
      text: 'text-rose-800',
      badge: 'bg-rose-500'
    },
    green: {
      bg: 'bg-green-100',
      border: 'border-green-400',
      text: 'text-green-800',
      badge: 'bg-green-500'
    },
    red: {
      bg: 'bg-red-100',
      border: 'border-red-400',
      text: 'text-red-800',
      badge: 'bg-red-500'
    },
    blue: {
      bg: 'bg-blue-100',
      border: 'border-blue-400',
      text: 'text-blue-800',
      badge: 'bg-blue-500'
    }
  };
  
  return colorMap[colorName] || colorMap.pink;
};

/**
 * 判斷時段是否有分組行程
 */
export const hasGroupedEvents = (timeEvent) => {
  return timeEvent.groupLayout && timeEvent.groupLayout.length > 0;
};

/**
 * 判斷時段是否有全員行程
 */
export const hasAllGroupsEvents = (timeEvent) => {
  return timeEvent.allGroupsEvents && timeEvent.allGroupsEvents.length > 0;
};

/**
 * 格式化事件時間
 */
export const formatEventTime = (timeStr) => {
  // 如果已經是時間格式 HH:MM，直接返回
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    return timeStr;
  }
  // 否則返回原始字串（例如「早晨」、「全天」）
  return timeStr;
};
