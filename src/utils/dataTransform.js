/**
 * 數據轉換工具 - 將 Supabase 數據轉換成前端渲染格式
 */

/**
 * 將事件按照組別和時間分組
 * 用於"Swimlane"布局 - 同一時段的不同組別事件並排顯示
 * 
 * @param {Array} events - 原始事件陣列
 * @param {Array} groups - 所有組別陣列
 * @returns {Array} 轉換後的事件陣列
 */
export const groupEventsByTimeAndGroup = (events, groups) => {
  // 按時間分組
  const timeGroups = {};
  
  events.forEach((event) => {
    if (!timeGroups[event.time]) {
      timeGroups[event.time] = [];
    }
    timeGroups[event.time].push(event);
  });
  
  // 轉換為陣列並排序
  return Object.entries(timeGroups)
    .map(([time, timeEvents]) => {
      // 區分「全員事件」和「分組事件」
      const allGroupsEvents = timeEvents.filter(e => !e.group_id);
      const groupedEvents = timeEvents.filter(e => e.group_id);
      
      return {
        time,
        allGroupsEvents, // 全員參加的事件
        groupedEvents,   // 分組事件，按 group_id 組織
        groupLayout: organizeEventsByGroup(groupedEvents, groups)
      };
    });
};

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
export const calculateGridColumns = (days, groups) => {
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
