import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import {
  MapPin, Utensils, ShoppingBag, Train, Moon, Gamepad2,
  Edit2, Save, X, Plus, Database, Trash2, ArrowLeft,
  DollarSign, TrendingUp, ClipboardList, PackageCheck, Map, GripVertical, UserPlus
} from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
const TripMap = lazy(() => import('./TripMap'));
import LocationSearch from './LocationSearch';
import { MemberManager, MemberSelector } from './MemberManager';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import {
  fetchExchangeRates,
  formatCost,
  formatBaseHint,
  getCurrencySymbol,
  BASE_CURRENCY,
} from '../services/exchangeRate';
import { EventTimelineGroup } from './EventTimelineGroup';
import {
  groupEventsByTimeAndGroup,
  getGridColsClass
} from '../utils/dataTransform';
import { useDebouncedEffect } from '../hooks/useDebouncedEffect';
import BudgetTab from './tabs/BudgetTab';
import PackingTab from './tabs/PackingTab';

/**
 * TripDetail - 單一行程的詳細頁面（含 Supabase 同步）
 */
const TripDetail = ({ trip, user, onBack, onUpdateTrip }) => {
  const [activeDay, setActiveDay] = useState(1);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isAddingDay, setIsAddingDay] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newDayForm, setNewDayForm] = useState({ date: '', title: '', theme: 'bg-green-500' });
  const [newEventForm, setNewEventForm] = useState({ time: '', endTime: '', title: '', desc: '', type: 'sight', location: '', cost: '', assignees: [] });
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'map' | 'budget' | 'packing'
  const [showDayManager, setShowDayManager] = useState(false);
  const [showMemberManager, setShowMemberManager] = useState(false);
  const [members, setMembers] = useState([]);
  const [showTripEdit, setShowTripEdit] = useState(false);
  const [tripEditForm, setTripEditForm] = useState({});
  const [packingItems, setPackingItems] = useState([]);
  const [newPackingItem, setNewPackingItem] = useState('');
  const [currency, setCurrency] = useState('JPY');
  const [exchangeRates, setExchangeRates] = useState(null);

  const isCloud = isSupabaseConfigured() && user && trip.id && !String(trip.id).startsWith('local-');

  // ==================== 載入資料 ====================

  // 載入匯率
  useEffect(() => {
    fetchExchangeRates().then(setExchangeRates).catch(() => {});
  }, []);

  useEffect(() => {
    loadTripData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.id]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadTripData = async () => {
    setLoading(true);
    try {
      if (isCloud) {
        const [{ data: dbDays }, { data: dbMembers }] = await Promise.all([
          supabase.from('days').select('*').eq('trip_id', trip.id).order('day_number'),
          supabase.from('trip_members').select('*').eq('trip_id', trip.id).order('created_at')
        ]);

        if (dbDays && dbDays.length > 0) {
          const daysWithEvents = await Promise.all(
            dbDays.map(async (day) => {
              const { data: events } = await supabase
                .from('events')
                .select('*')
                .eq('day_id', day.id)
                .order('order_index');
              return {
                _id: day.id,
                day: day.day_number,
                date: day.date,
                title: day.day_title,
                theme: day.theme || 'bg-blue-500',
                events: (events || []).map((evt) => ({
                  _id: evt.id,
                  time: evt.time,
                  endTime: evt.end_time || '',
                  title: evt.title,
                  desc: evt.description || '',
                  type: evt.event_type || 'sight',
                  location: evt.location,
                  cost: evt.cost || 0,
                  assignees: evt.assignees || []
                }))
              };
            })
          );
          setSchedule(daysWithEvents);
        } else {
          setSchedule([]);
        }

        setMembers((dbMembers || []).map(m => ({ id: m.id, name: m.name, email: m.email || '', note: m.note || '' })));
      } else {
        // 本地模式
        const key = `trip_${trip.id}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          setSchedule(parsed.schedule || []);
          setMembers(parsed.members || []);
          if (parsed.packingItems) setPackingItems(parsed.packingItems);
          if (parsed.currency) setCurrency(parsed.currency);
        }
      }
    } catch (err) {
      console.error('載入行程資料失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  // 本地模式自動保存（debounce 500ms 降低 localStorage 寫入頻率）
  useDebouncedEffect(
    () => {
      if (!isCloud && !loading) {
        localStorage.setItem(
          `trip_${trip.id}`,
          JSON.stringify({ schedule, members, packingItems, currency })
        );
      }
    },
    [schedule, members, packingItems, currency, loading, isCloud, trip.id],
    500
  );

  // ==================== Supabase 同步 CRUD ====================

  const addNewDay = async () => {
    // 檢查日期是否重複
    if (newDayForm.date && schedule.some(d => d.date === newDayForm.date)) {
      alert('此日期已有行程，請選擇其他日期');
      return;
    }

    const dayNumber = schedule.length + 1;

    try {
      let newDay;
      if (isCloud) {
        const { data, error } = await supabase
          .from('days')
          .insert([{
            trip_id: trip.id,
            day_number: dayNumber,
            date: newDayForm.date,
            day_title: newDayForm.title,
            theme: newDayForm.theme
          }])
          .select();
        if (error) throw error;
        newDay = { _id: data[0].id, day: dayNumber, date: newDayForm.date, title: newDayForm.title, theme: newDayForm.theme, events: [] };
      } else {
        newDay = { _id: `day-${Date.now()}`, day: dayNumber, date: newDayForm.date, title: newDayForm.title, theme: newDayForm.theme, events: [] };
      }

      setSchedule(prev => [...prev, newDay]);
      setActiveDay(dayNumber);
      setIsAddingDay(false);
      setNewDayForm({ date: '', title: '', theme: 'bg-green-500' });
    } catch (err) {
      console.error('新增日程失敗:', err);
    }
  };

  const deleteDay = async (dayIndex) => {
    const day = schedule[dayIndex];
    try {
      if (isCloud && day._id) {
        const { error } = await supabase.from('days').delete().eq('id', day._id);
        if (error) throw error;
      }
      const newSchedule = schedule.filter((_, idx) => idx !== dayIndex);
      newSchedule.forEach((d, idx) => d.day = idx + 1);
      setSchedule(newSchedule);
      if (activeDay > newSchedule.length) setActiveDay(newSchedule.length || 1);
    } catch (err) {
      console.error('刪除日程失敗:', err);
    }
  };

  const addNewEvent = async () => {
    const dayIdx = activeDay - 1;
    const day = schedule[dayIdx];

    const eventData = {
      time: newEventForm.time,
      endTime: newEventForm.endTime || undefined,
      title: newEventForm.title,
      desc: newEventForm.desc,
      type: newEventForm.type,
      location: newEventForm.location || undefined,
      cost: parseFloat(newEventForm.cost) || 0,
      assignees: newEventForm.assignees || []
    };

    try {
      if (isCloud && day._id) {
        const { data, error } = await supabase
          .from('events')
          .insert([{
            day_id: day._id,
            trip_id: trip.id,
            time: eventData.time,
            end_time: eventData.endTime || null,
            title: eventData.title,
            description: eventData.desc,
            event_type: eventData.type,
            location: eventData.location,
            cost: eventData.cost || 0,
            assignees: eventData.assignees,
            order_index: day.events.length
          }])
          .select();
        if (error) throw error;
        eventData._id = data[0].id;
      }

      const newSchedule = [...schedule];
      newSchedule[dayIdx].events.push(eventData);
      // 按時間排序
      newSchedule[dayIdx].events.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      setSchedule(newSchedule);
      setIsAddingEvent(false);
      setNewEventForm({ time: '', endTime: '', title: '', desc: '', type: 'sight', location: '', cost: '', assignees: [] });
    } catch (err) {
      console.error('新增事件失敗:', err);
    }
  };

  const updateEvent = async (dayIndex, eventIndex, updates) => {
    const event = schedule[dayIndex].events[eventIndex];

    try {
      if (isCloud && event._id) {
        const dbUpdates = {};
        if (updates.time !== undefined) dbUpdates.time = updates.time;
        if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime || null;
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.desc !== undefined) dbUpdates.description = updates.desc;
        if (updates.type !== undefined) dbUpdates.event_type = updates.type;
        if (updates.location !== undefined) dbUpdates.location = updates.location || null;
        if (updates.cost !== undefined) dbUpdates.cost = updates.cost || 0;
        if (updates.assignees !== undefined) dbUpdates.assignees = updates.assignees;

        const { error } = await supabase.from('events').update(dbUpdates).eq('id', event._id);
        if (error) throw error;
      }

      const newSchedule = [...schedule];
      newSchedule[dayIndex].events[eventIndex] = { ...event, ...updates };
      // 若時間有變動，重新排序
      if (updates.time !== undefined) {
        newSchedule[dayIndex].events.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      }
      setSchedule(newSchedule);
    } catch (err) {
      console.error('更新事件失敗:', err);
    }
  };

  const deleteEvent = async (dayIndex, eventIndex) => {
    const event = schedule[dayIndex].events[eventIndex];

    try {
      if (isCloud && event._id) {
        const { error } = await supabase.from('events').delete().eq('id', event._id);
        if (error) throw error;
      }

      const newSchedule = [...schedule];
      newSchedule[dayIndex].events.splice(eventIndex, 1);
      setSchedule(newSchedule);
    } catch (err) {
      console.error('刪除事件失敗:', err);
    }
  };

  // ==================== 組別管理 ====================

  // ==================== Modal 操作 ====================

  const currentDayData = schedule.find(d => d.day === activeDay);

  const openEditModal = (dayIdx, eventIdx, event) => {
    setIsEditingEvent({ dayIdx, eventIdx });
    setEditForm({
      time: event.time, endTime: event.endTime || '', title: event.title, desc: event.desc,
      location: event.location || '', type: event.type || 'sight',
      cost: event.cost || '',
      assignees: event.assignees || []
    });
  };

  const closeEditModal = () => { setIsEditingEvent(null); setEditForm({}); };

  const saveEdit = () => {
    if (isEditingEvent) {
      const { dayIdx, eventIdx } = isEditingEvent;
      updateEvent(dayIdx, eventIdx, {
        time: editForm.time, endTime: editForm.endTime, title: editForm.title, desc: editForm.desc,
        location: editForm.location || undefined, type: editForm.type,
        cost: parseFloat(editForm.cost) || 0,
        assignees: editForm.assignees || []
      });
      closeEditModal();
    }
  };

  // ==================== 成員管理 ====================

  const handleAddMember = async (member) => {
    try {
      if (isCloud) {
        const { data, error } = await supabase.from('trip_members')
          .insert([{ trip_id: trip.id, name: member.name, email: member.email || null, note: member.note || null }])
          .select();
        if (error) throw error;
        setMembers(prev => [...prev, { id: data[0].id, name: data[0].name, email: data[0].email || '', note: data[0].note || '' }]);
      } else {
        setMembers(prev => [...prev, { id: `member-${Date.now()}`, ...member }]);
      }
    } catch (err) {
      console.error('新增成員失敗:', err);
    }
  };

  const handleUpdateMember = async (memberId, updates) => {
    try {
      if (isCloud) {
        const { error } = await supabase.from('trip_members').update(updates).eq('id', memberId);
        if (error) throw error;
      }
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, ...updates } : m));
    } catch (err) {
      console.error('更新成員失敗:', err);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('確定移除此成員？')) return;
    try {
      if (isCloud) {
        const { error } = await supabase.from('trip_members').delete().eq('id', memberId);
        if (error) throw error;
      }
      // 從所有事件的 assignees 中移除該成員
      setSchedule(prev => prev.map(day => ({
        ...day,
        events: day.events.map(e => ({
          ...e,
          assignees: (e.assignees || []).filter(id => id !== memberId)
        }))
      })));
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      console.error('移除成員失敗:', err);
    }
  };

  // ==================== 行程資訊編輯 ====================

  const openTripEdit = () => {
    setTripEditForm({
      title: trip.title || '',
      description: trip.description || '',
      start_date: trip.start_date || '',
      end_date: trip.end_date || ''
    });
    setShowTripEdit(true);
  };

  const saveTripEdit = async () => {
    if (!tripEditForm.title || !tripEditForm.start_date || !tripEditForm.end_date) return;
    try {
      if (isCloud) {
        const { error } = await supabase.from('trips').update({
          title: tripEditForm.title,
          description: tripEditForm.description || null,
          start_date: tripEditForm.start_date,
          end_date: tripEditForm.end_date
        }).eq('id', trip.id);
        if (error) throw error;
      }
      onUpdateTrip?.({
        title: tripEditForm.title,
        description: tripEditForm.description,
        start_date: tripEditForm.start_date,
        end_date: tripEditForm.end_date
      });
      setShowTripEdit(false);
    } catch (err) {
      console.error('更新行程資訊失敗:', err);
    }
  };

  // ==================== 通用函式 ====================

  const openMap = (location) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank', 'noopener,noreferrer');
  };

  // ==================== 預算計算（皆以 BASE_CURRENCY = JPY 為基準）====================

  const sym = getCurrencySymbol(currency);
  const baseSym = getCurrencySymbol(BASE_CURRENCY);

  // 用普通物件而非 Map()，因為本檔已從 lucide-react 匯入名為 Map 的 icon，
  // 會遮蔽全域的 Map constructor。
  const dayCostMap = useMemo(() => {
    const result = {};
    schedule.forEach((day) => {
      result[day.day] = (day.events || []).reduce((s, e) => s + (e.cost || 0), 0);
    });
    return result;
  }, [schedule]);

  const getDayCost = useCallback(
    (day) => dayCostMap[day.day] || 0,
    [dayCostMap]
  );

  // ==================== 打包清單 state（邏輯已搬至 PackingTab）====================
  // 增刪邏輯由 PackingTab 自身處理，此處只保留 state 以便本地保存同步。

  const themeOptions = [
    { value: 'bg-blue-500', label: '藍色' }, { value: 'bg-red-500', label: '紅色' },
    { value: 'bg-amber-500', label: '琥珀色' }, { value: 'bg-purple-500', label: '紫色' },
    { value: 'bg-indigo-500', label: '靛色' }, { value: 'bg-teal-500', label: '青色' },
    { value: 'bg-green-500', label: '綠色' }, { value: 'bg-pink-500', label: '粉紅色' }
  ];

  const typeOptions = [
    { value: 'transport', label: '🚃 交通' }, { value: 'food', label: '🍜 食物' },
    { value: 'shopping', label: '🛍️ 購物' }, { value: 'sight', label: '📍 景點' },
    { value: 'fun', label: '🎮 娛樂' }, { value: 'stay', label: '🏠 住宿' }
  ];

  const getIconForType = (type) => {
    const iconMap = {
      transport: <Train className="w-5 h-5" />, food: <Utensils className="w-5 h-5" />,
      shopping: <ShoppingBag className="w-5 h-5" />, sight: <MapPin className="w-5 h-5" />,
      fun: <Gamepad2 className="w-5 h-5" />, stay: <Moon className="w-5 h-5" />
    };
    return iconMap[type] || <MapPin className="w-5 h-5" />;
  };

  // ==================== 智慧分類 ====================

  const smartTypeRules = [
    { type: 'food', keywords: ['拉麵', '壽司', '燒肉', '餐', '吃', '食', '咖啡', '甜點', '早餐', '午餐', '晚餐', '小吃', '居酒屋', '火鍋', '章魚燒', '大阪燒', '串炸', '蛋糕', '鬆餅', '冰淇淋', '便當', '飯', '麵', '丼', '烤肉', '雞湯', '豆腐', '抹茶', 'cafe', 'restaurant', 'ramen', 'sushi'] },
    { type: 'transport', keywords: ['機場', '車站', '電車', '地鐵', '巴士', '新幹線', '搭', '轉乘', '租車', '包車', 'JR', 'taxi', '計程車', 'uber', '高鐵', '捷運', '公車', '渡輪', '飛機', 'airport', 'station'] },
    { type: 'shopping', keywords: ['購物', '逛街', '買', '唐吉訶德', '百貨', '商店', '市場', '免稅', 'outlet', '藥妝', '超市', 'mall', '商圈', '心齋橋', '明洞', '阿美橫丁', '竹下通'] },
    { type: 'stay', keywords: ['飯店', '旅館', 'check-in', 'check-out', '民宿', 'hotel', 'hostel', '住宿', 'airbnb'] },
    { type: 'fun', keywords: ['遊樂', '樂園', '環球', '迪士尼', 'teamlab', '遊戲', '酒吧', 'KTV', '卡拉OK', '夜生活', '體驗', '溫泉', '泡湯', '桑拿'] },
    { type: 'sight', keywords: ['寺', '神社', '城', '塔', '公園', '展望', '觀景', '美術館', '博物館', '故宮', '古蹟', '世界遺產'] },
  ];

  const inferTypeFromTitle = (title) => {
    const lower = title.toLowerCase();
    for (const rule of smartTypeRules) {
      if (rule.keywords.some(kw => lower.includes(kw.toLowerCase()))) {
        return rule.type;
      }
    }
    return null;
  };

  // ==================== 渲染：時間軸 ====================

  const renderTimeline = (dayData) => {
    const timeSlots = groupEventsByTimeAndGroup(dayData.events, []);
    return (
      <div className="space-y-6">
        {timeSlots.map((timeSlot, idx) => (
          <div key={idx} className="animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
            <EventTimelineGroup
              timeEvent={timeSlot}
              sym={sym}
              currency={currency}
              exchangeRates={exchangeRates}
              members={members}
              onEditEvent={(event) => {
                const eventIdx = dayData.events.indexOf(event);
                if (eventIdx !== -1) openEditModal(activeDay - 1, eventIdx, event);
              }}
              onDeleteEvent={(event) => {
                const eventIdx = dayData.events.indexOf(event);
                if (eventIdx !== -1) deleteEvent(activeDay - 1, eventIdx);
              }}
              openMap={openMap}
            />
          </div>
        ))}
      </div>
    );
  };

  // ==================== 拖曳排序 ====================

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = async (result) => {
    const { active, over } = result;
    if (!over || active.id === over.id) return;

    const dayIdx = activeDay - 1;
    const day = schedule[dayIdx];
    const oldIndex = day.events.findIndex((_, i) => `event-${i}` === active.id);
    const newIndex = day.events.findIndex((_, i) => `event-${i}` === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newSchedule = [...schedule];
    newSchedule[dayIdx] = {
      ...day,
      events: arrayMove([...day.events], oldIndex, newIndex),
    };
    setSchedule(newSchedule);

    // Sync order to Supabase
    if (isCloud) {
      try {
        await Promise.all(
          newSchedule[dayIdx].events.map((evt, i) =>
            evt._id ? supabase.from('events').update({ order_index: i }).eq('id', evt._id) : null
          )
        );
      } catch (err) {
        console.error('排序同步失敗:', err);
      }
    }
  };

  const moveEventToDay = async (fromDayIdx, eventIdx, toDayIdx) => {
    const newSchedule = [...schedule];
    const [moved] = newSchedule[fromDayIdx].events.splice(eventIdx, 1);

    if (isCloud && moved._id && newSchedule[toDayIdx]._id) {
      try {
        await supabase.from('events').update({
          day_id: newSchedule[toDayIdx]._id,
          order_index: newSchedule[toDayIdx].events.length,
        }).eq('id', moved._id);
      } catch (err) {
        console.error('移動事件失敗:', err);
      }
    }

    newSchedule[toDayIdx].events.push(moved);
    // 按時間排序
    newSchedule[toDayIdx].events.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    setSchedule(newSchedule);
  };

  // ==================== 渲染：可拖曳事件卡片 ====================

  const SortableEventCard = ({ event, idx, dayData }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `event-${idx}` });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.4 : 1,
    };

    return (
      <div ref={setNodeRef} style={style} className="flex group" {...attributes}>
        <div className="w-16 flex-shrink-0 flex flex-col items-center">
          <span className="text-sm font-bold text-slate-500 group-hover:text-slate-800 transition-colors">{event.time}{event.endTime ? `~${event.endTime}` : ''}</span>
          <div className="h-full w-0.5 bg-slate-200 mt-2 mb-2 relative">
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${dayData.theme}`} />
          </div>
        </div>
        <div className="flex-1 pb-6">
          <div className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300 relative overflow-hidden ${isDragging ? 'shadow-lg ring-2 ring-blue-300' : ''}`}>
            <div className="absolute -right-4 -bottom-4 text-slate-50 opacity-10 transform rotate-12 scale-150">
              {getIconForType(event.type)}
            </div>
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-start space-x-3">
                {/* Drag Handle */}
                <button {...listeners} className="p-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing flex-shrink-0 mt-1" title="拖曳排序">
                  <GripVertical className="w-4 h-4" />
                </button>
                <div className={`p-2 rounded-lg ${dayData.theme} bg-opacity-10`}>
                  {getIconForType(event.type)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 leading-tight">{event.title}</h3>
                  <div className="mt-1 text-slate-600 text-sm whitespace-pre-line">{event.desc}</div>
                  {event.location && (
                    <button onClick={() => openMap(event.location)}
                      className="mt-3 inline-flex items-center text-xs font-semibold text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors">
                      <MapPin className="w-3 h-3 mr-1" /> 打開地圖
                    </button>
                  )}
                  {event.cost > 0 && (
                    <span className="ml-2 mt-3 inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      <DollarSign className="w-3 h-3 mr-0.5" /> {formatCost(event.cost, currency, exchangeRates)}
                      {formatBaseHint(event.cost, currency) && (
                        <span className="ml-1 text-slate-400 font-normal">{formatBaseHint(event.cost, currency)}</span>
                      )}
                    </span>
                  )}
                  {event.assignees && event.assignees.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {event.assignees.map(mid => {
                        const m = members.find(mm => mm.id === mid);
                        return m ? (
                          <span key={mid} className="inline-flex items-center text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                            {m.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center flex-shrink-0 ml-2 gap-0.5">
                {/* Move to day dropdown */}
                {schedule.length > 1 && (
                  <select
                    value=""
                    onChange={(e) => {
                      const toDayIdx = parseInt(e.target.value);
                      if (!isNaN(toDayIdx)) moveEventToDay(activeDay - 1, idx, toDayIdx);
                    }}
                    className="w-[72px] text-xs text-slate-400 border border-slate-200 rounded-lg py-1.5 px-1 hover:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-transparent cursor-pointer"
                    title="移動到其他天"
                  >
                    <option value="" disabled>移至…</option>
                    {schedule.map((d, di) => di !== activeDay - 1 && (
                      <option key={di} value={di}>Day {d.day}</option>
                    ))}
                  </select>
                )}
                <button onClick={() => openEditModal(activeDay - 1, idx, event)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="編輯">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteEvent(activeDay - 1, idx)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="刪除">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== 渲染：一般時間軸（可拖曳） ====================

  const renderRegularTimeline = (dayData) => (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={dayData.events.map((_, i) => `event-${i}`)} strategy={verticalListSortingStrategy}>
        <div className="space-y-6">
          {dayData.events.map((event, idx) => (
            <SortableEventCard key={`event-${idx}`} event={event} idx={idx} dayData={dayData} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );

  // ==================== 主渲染 ====================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-10 font-sans text-slate-800">
      {/* Hero Header */}
      <div className="relative h-56 bg-slate-900 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=2994&auto=format&fit=crop"
          alt="Trip" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
        <div className="absolute top-4 left-4">
          <button onClick={onBack}
            className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-colors flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> 行程列表
          </button>
        </div>
        <div className="absolute top-4 right-4">
          <button onClick={openTripEdit}
            className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-colors" title="編輯行程資訊">
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 p-6 text-white w-full">
          <h1 className="text-2xl md:text-4xl font-extrabold mb-1">{trip.title}</h1>
          {trip.description && <p className="text-slate-300 text-sm mb-2">{trip.description}</p>}
          <div className="flex items-center gap-3 text-sm text-slate-200">
            <span className="bg-slate-800/80 px-3 py-1 rounded-full backdrop-blur-sm border border-slate-700">
              {trip.start_date} → {trip.end_date}
            </span>
            <span className={`px-3 py-1 rounded-full backdrop-blur-sm border flex items-center gap-1 text-xs ${isCloud ? 'bg-blue-500/80 border-blue-400' : 'bg-slate-600/80 border-slate-500'}`}>
              <Database className="w-3.5 h-3.5" />
              {isCloud ? '雲端同步' : '本地存儲'}
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Navigation */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 py-3">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between gap-3">
          <div className="overflow-x-auto no-scrollbar flex space-x-3 snap-x flex-1">
            {schedule.map((day) => (
              <div key={day.day} className="relative snap-center flex-shrink-0">
                <button onClick={() => { setActiveDay(day.day); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border ${
                    activeDay === day.day
                      ? `${day.theme} text-white border-transparent shadow-lg scale-105`
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}>
                  <span className="block text-xs opacity-80 font-medium">Day {day.day}</span>
                  <span>{day.date?.split(' ')[0] || `Day ${day.day}`}</span>
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => setShowDayManager(true)}
            className="flex-shrink-0 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors" title="日程管理">
            <Edit2 className="w-5 h-5" />
          </button>
          <button onClick={() => {
            // 計算預設日期：根據已有日程推算下一天
            let defaultDate = '';
            if (trip.start_date) {
              const start = new Date(trip.start_date);
              const nextDate = new Date(start);
              nextDate.setDate(start.getDate() + schedule.length);
              // 確保不超過 end_date
              if (trip.end_date) {
                const end = new Date(trip.end_date);
                if (nextDate > end) nextDate.setTime(end.getTime());
              }
              defaultDate = nextDate.toISOString().split('T')[0];
            }
            setNewDayForm({ date: defaultDate, title: '', theme: 'bg-green-500', newGroups: [] });
            setIsAddingDay(true);
          }}
            className="flex-shrink-0 p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors" title="新增日程">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className={`mx-auto px-4 mt-6 ${activeTab === 'map' ? 'max-w-4xl' : 'max-w-2xl'}`}>
        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${activeTab === 'timeline' ? 'bg-blue-500 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
            <ClipboardList className="w-4 h-4" /> 行程
          </button>
          <button onClick={() => setActiveTab('map')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${activeTab === 'map' ? 'bg-indigo-500 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
            <Map className="w-4 h-4" /> 地圖
          </button>
          <button onClick={() => setActiveTab('budget')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${activeTab === 'budget' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
            <TrendingUp className="w-4 h-4" /> 預算
          </button>
          <button onClick={() => setActiveTab('packing')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${activeTab === 'packing' ? 'bg-amber-500 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
            <PackageCheck className="w-4 h-4" /> 打包清單
          </button>
          <button onClick={() => setShowMemberManager(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 bg-white text-slate-500 border border-slate-200 hover:bg-slate-50">
            <UserPlus className="w-4 h-4" /> 成員
            {members.length > 0 && <span className="bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded-full">{members.length}</span>}
          </button>
        </div>

        {/* 成員管理彈窗 */}
        {showMemberManager && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <UserPlus className="w-5 h-5" /> 成員名單
                </h3>
                <button onClick={() => setShowMemberManager(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <MemberManager
                members={members}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                onRemoveMember={handleRemoveMember}
              />
            </div>
          </div>
        )}

        {/* 日程管理彈窗 */}
        {showDayManager && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" /> 日程管理
                </h3>
                <button onClick={() => setShowDayManager(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              {schedule.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">尚未新增日程</p>
              ) : (
                <div className="space-y-3">
                  {schedule.map((day, idx) => (
                    <div key={day._id || idx} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm ${day.theme || 'bg-green-500'}`}>
                        D{day.day}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-700">{day.date || `Day ${day.day}`}</div>
                        <div className="text-xs text-slate-500 truncate">{day.title || '無主題'}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-400">{day.events?.length || 0} 個事件</span>
                        {schedule.length > 1 && (
                          <button onClick={() => {
                            if (confirm(`確定刪除 Day ${day.day}（${day.date || ''}）？該日所有事件也會被刪除。`)) {
                              deleteDay(idx);
                              if (schedule.length <= 1) setShowDayManager(false);
                            }
                          }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="刪除日程">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== Tab: Timeline ===== */}
        {activeTab === 'timeline' && (
          <>
            {schedule.length === 0 ? (
              <div className="text-center py-20">
                <h2 className="text-xl font-bold text-slate-400 mb-2">還沒有日程</h2>
                <p className="text-slate-400 mb-6">點擊右上角 ＋ 新增第一天的行程</p>
              </div>
            ) : currentDayData && (
              <>
                <div className="mb-8 flex items-center justify-between gap-4 animate-fade-in">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-900">{currentDayData.date}</h2>
                    <p className={`inline-block mt-2 px-4 py-1 rounded-full text-white text-sm font-medium ${currentDayData.theme}`}>
                      {currentDayData.title}
                    </p>
                    {getDayCost(currentDayData) > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                        <DollarSign className="w-3.5 h-3.5" /> {formatCost(getDayCost(currentDayData), currency, exchangeRates)}
                      </span>
                    )}
                  </div>
                  <button onClick={() => setIsAddingEvent(true)}
                    className="flex-shrink-0 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2 font-semibold" title="新增事件">
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">新增事件</span>
                  </button>
                </div>
                {renderTimeline(currentDayData)}
              </>
            )}
          </>
        )}

        {/* ===== Tab: Map ===== */}
        {activeTab === 'map' && (
          <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
            <TripMap schedule={schedule} activeDay={activeDay} sym={sym} />
          </Suspense>
        )}

        {/* ===== Tab: Budget ===== */}
        {activeTab === 'budget' && (
          <BudgetTab
            schedule={schedule}
            currency={currency}
            onChangeCurrency={setCurrency}
            exchangeRates={exchangeRates}
          />
        )}

        {/* ===== Tab: Packing List ===== */}
        {activeTab === 'packing' && (
          <PackingTab
            packingItems={packingItems}
            setPackingItems={setPackingItems}
            newPackingItem={newPackingItem}
            setNewPackingItem={setNewPackingItem}
          />
        )}
      </div>

      {/* Footer */}
      <div className="max-w-2xl mx-auto px-6 mt-12 mb-6">
        <p className="text-center text-slate-400 text-xs">Have a nice trip! ✈️</p>
      </div>

      {/* ==================== Edit Trip Info Modal ==================== */}
      {showTripEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">編輯行程資訊</h3>
              <button onClick={() => setShowTripEdit(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">行程名稱</label>
                <input type="text" value={tripEditForm.title} onChange={(e) => setTripEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="行程名稱" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">描述</label>
                <textarea value={tripEditForm.description} onChange={(e) => setTripEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows="2" placeholder="行程描述（選填）" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">開始日期</label>
                  <input type="date" value={tripEditForm.start_date} onChange={(e) => setTripEditForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">結束日期</label>
                  <input type="date" value={tripEditForm.end_date}
                    min={tripEditForm.start_date || ''}
                    onChange={(e) => setTripEditForm(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {tripEditForm.start_date && tripEditForm.end_date && (
                <p className="text-sm text-slate-500">
                  共 {Math.max(1, Math.round((new Date(tripEditForm.end_date) - new Date(tripEditForm.start_date)) / 86400000) + 1)} 天
                </p>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowTripEdit(false)} className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold">取消</button>
                <button onClick={saveTripEdit}
                  disabled={!tripEditForm.title || !tripEditForm.start_date || !tripEditForm.end_date}
                  className="flex-1 px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 rounded-lg font-semibold flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> 儲存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Edit Event Modal ==================== */}
      {isEditingEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">編輯行程</h3>
              <button onClick={closeEditModal} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">時間</label>
                <div className="flex items-center gap-2">
                  <input type="time" value={editForm.time} onChange={(e) => { const v = e.target.value; setEditForm(prev => ({ ...prev, time: v })); }}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <span className="text-slate-400 font-medium">~</span>
                  <input type="time" value={editForm.endTime} onChange={(e) => { const v = e.target.value; setEditForm(prev => ({ ...prev, endTime: v })); }}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="結束" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">標題</label>
                <input type="text" value={editForm.title} onChange={(e) => { const v = e.target.value; setEditForm(prev => ({ ...prev, title: v })); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="活動標題" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">描述</label>
                <textarea value={editForm.desc} onChange={(e) => { const v = e.target.value; setEditForm(prev => ({ ...prev, desc: v })); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows="3" placeholder="活動描述" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">地點</label>
                <LocationSearch value={editForm.location} onChange={(v) => setEditForm(prev => ({ ...prev, location: v }))} placeholder="搜尋地點名稱" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">類型</label>
                <select value={editForm.type} onChange={(e) => { const v = e.target.value; setEditForm(prev => ({ ...prev, type: v })); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {typeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">花費 ({baseSym})</label>
                <input type="number" min="0" step="1" value={editForm.cost} onChange={(e) => { const v = e.target.value; setEditForm(prev => ({ ...prev, cost: v })); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
              </div>
              {members.length > 0 && (
                <MemberSelector members={members} selectedMemberIds={editForm.assignees || []}
                  onChangeMembers={(ids) => setEditForm(prev => ({ ...prev, assignees: ids }))} />
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={closeEditModal} className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold">取消</button>
                <button onClick={saveEdit} className="flex-1 px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> 儲存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Add Day Modal ==================== */}
      {isAddingDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">新增日程</h3>
              <button onClick={() => setIsAddingDay(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">日期</label>
                <input type="date" value={newDayForm.date} onChange={(e) => setNewDayForm({ ...newDayForm, date: e.target.value })}
                  min={trip.start_date || ''} max={trip.end_date || ''}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">主題</label>
                <input type="text" value={newDayForm.title} onChange={(e) => setNewDayForm({ ...newDayForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="例：自由探索" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">顏色</label>
                <select value={newDayForm.theme} onChange={(e) => setNewDayForm({ ...newDayForm, theme: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                  {themeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setIsAddingDay(false)} className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold">取消</button>
                <button onClick={addNewDay} className="flex-1 px-4 py-2 text-white bg-green-500 hover:bg-green-600 rounded-lg font-semibold flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> 新增
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Add Event Modal ==================== */}
      {isAddingEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">新增事件</h3>
              <button onClick={() => setIsAddingEvent(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">時間</label>
                <div className="flex items-center gap-2">
                  <input type="time" value={newEventForm.time} onChange={(e) => { const v = e.target.value; setNewEventForm(prev => ({ ...prev, time: v })); }}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <span className="text-slate-400 font-medium">~</span>
                  <input type="time" value={newEventForm.endTime} onChange={(e) => { const v = e.target.value; setNewEventForm(prev => ({ ...prev, endTime: v })); }}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">標題</label>
                <input type="text" value={newEventForm.title} onChange={(e) => {
                    const title = e.target.value;
                    const inferred = inferTypeFromTitle(title);
                    setNewEventForm(prev => ({ ...prev, title, ...(inferred ? { type: inferred } : {}) }));
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="活動標題（輸入關鍵字自動分類）" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">描述</label>
                <textarea value={newEventForm.desc} onChange={(e) => { const v = e.target.value; setNewEventForm(prev => ({ ...prev, desc: v })); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows="3" placeholder="活動描述" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">地點</label>
                <LocationSearch value={newEventForm.location} onChange={(v) => setNewEventForm(prev => ({ ...prev, location: v }))} placeholder="搜尋地點名稱" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">類型</label>
                <select value={newEventForm.type} onChange={(e) => { const v = e.target.value; setNewEventForm(prev => ({ ...prev, type: v })); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {typeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">花費 ({baseSym})</label>
                <input type="number" min="0" step="1" value={newEventForm.cost} onChange={(e) => { const v = e.target.value; setNewEventForm(prev => ({ ...prev, cost: v })); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
              </div>
              {members.length > 0 && (
                <MemberSelector members={members} selectedMemberIds={newEventForm.assignees || []}
                  onChangeMembers={(ids) => setNewEventForm(prev => ({ ...prev, assignees: ids }))} />
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setIsAddingEvent(false)} className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold">取消</button>
                <button onClick={addNewEvent} className="flex-1 px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> 新增
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default TripDetail;
