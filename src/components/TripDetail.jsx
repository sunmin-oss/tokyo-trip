import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  MapPin, Utensils, ShoppingBag, Train, Moon, Gamepad2, Coffee,
  Users, Edit2, Save, X, Plus, Database, Trash2, ArrowLeft,
  DollarSign, TrendingUp, ClipboardList, CheckSquare, Square, PackageCheck, Map, GripVertical
} from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
const TripMap = lazy(() => import('./TripMap'));
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { fetchExchangeRates, formatConvertedAmount } from '../services/exchangeRate';
import { EventTimelineGroup } from './EventTimelineGroup';
import { GroupManagementPanel, GroupSelector } from './GroupSelector';
import {
  groupEventsByTimeAndGroup,
  getColorClasses,
  getGridColsClass
} from '../utils/dataTransform';

/**
 * TripDetail - 單一行程的詳細頁面（含 Supabase 同步）
 */
const TripDetail = ({ trip, user, onBack }) => {
  const [activeDay, setActiveDay] = useState(1);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isAddingDay, setIsAddingDay] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newDayForm, setNewDayForm] = useState({ date: '', title: '', theme: 'bg-green-500', newGroups: [] });
  const [newEventForm, setNewEventForm] = useState({ time: '', title: '', desc: '', type: 'sight', location: '', group_id: null, cost: '' });
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'map' | 'budget' | 'packing'
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
        const [{ data: dbGroups }, { data: dbDays }] = await Promise.all([
          supabase.from('groups').select('*').eq('trip_id', trip.id).order('order_index'),
          supabase.from('days').select('*').eq('trip_id', trip.id).order('day_number')
        ]);

        if (dbDays && dbDays.length > 0) {
          const daysWithEvents = await Promise.all(
            dbDays.map(async (day) => {
              const { data: events } = await supabase
                .from('events')
                .select('*, groups:group_id(id, name, color)')
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
                  title: evt.title,
                  desc: evt.description || '',
                  type: evt.event_type || 'sight',
                  location: evt.location,
                  group_id: evt.group_id,
                  cost: evt.cost || 0
                }))
              };
            })
          );
          setSchedule(daysWithEvents);
        } else {
          setSchedule([]);
        }

        setGroups((dbGroups || []).map(g => ({ id: g.id, name: g.name, color: g.color })));
      } else {
        // 本地模式
        const key = `trip_${trip.id}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          setSchedule(parsed.schedule || []);
          setGroups(parsed.groups || []);
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

  // 本地模式自動保存
  useEffect(() => {
    if (!isCloud && !loading) {
      localStorage.setItem(`trip_${trip.id}`, JSON.stringify({ schedule, groups, packingItems, currency }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule, groups, packingItems, currency, loading]);

  // ==================== Supabase 同步 CRUD ====================

  const addNewDay = async () => {
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

        // 新增該日程的組別
        if (newDayForm.newGroups?.length > 0) {
          const groupInserts = newDayForm.newGroups.map((g, idx) => ({
            trip_id: trip.id, name: g.name, color: g.color, order_index: groups.length + idx
          }));
          const { data: newGs, error: gErr } = await supabase.from('groups').insert(groupInserts).select();
          if (gErr) throw gErr;
          setGroups(prev => [...prev, ...newGs.map(g => ({ id: g.id, name: g.name, color: g.color }))]);
        }
      } else {
        newDay = { _id: `day-${Date.now()}`, day: dayNumber, date: newDayForm.date, title: newDayForm.title, theme: newDayForm.theme, events: [] };
        if (newDayForm.newGroups?.length > 0) {
          setGroups(prev => [...prev, ...newDayForm.newGroups]);
        }
      }

      setSchedule(prev => [...prev, newDay]);
      setActiveDay(dayNumber);
      setIsAddingDay(false);
      setNewDayForm({ date: '', title: '', theme: 'bg-green-500', newGroups: [] });
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
      title: newEventForm.title,
      desc: newEventForm.desc,
      type: newEventForm.type,
      location: newEventForm.location || undefined,
      group_id: newEventForm.group_id || undefined,
      cost: parseFloat(newEventForm.cost) || 0
    };

    try {
      if (isCloud && day._id) {
        const { data, error } = await supabase
          .from('events')
          .insert([{
            day_id: day._id,
            trip_id: trip.id,
            time: eventData.time,
            title: eventData.title,
            description: eventData.desc,
            event_type: eventData.type,
            location: eventData.location,
            group_id: eventData.group_id || null,
            cost: eventData.cost || 0,
            order_index: day.events.length
          }])
          .select();
        if (error) throw error;
        eventData._id = data[0].id;
      }

      const newSchedule = [...schedule];
      newSchedule[dayIdx].events.push(eventData);
      setSchedule(newSchedule);
      setIsAddingEvent(false);
      setNewEventForm({ time: '', title: '', desc: '', type: 'sight', location: '', group_id: null, cost: '' });
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
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.desc !== undefined) dbUpdates.description = updates.desc;
        if (updates.type !== undefined) dbUpdates.event_type = updates.type;
        if (updates.location !== undefined) dbUpdates.location = updates.location || null;
        if (updates.group_id !== undefined) dbUpdates.group_id = updates.group_id || null;
        if (updates.cost !== undefined) dbUpdates.cost = updates.cost || 0;

        const { error } = await supabase.from('events').update(dbUpdates).eq('id', event._id);
        if (error) throw error;
      }

      const newSchedule = [...schedule];
      newSchedule[dayIndex].events[eventIndex] = { ...event, ...updates };
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
      time: event.time, title: event.title, desc: event.desc,
      location: event.location || '', type: event.type || 'sight',
      group_id: event.group_id || null, cost: event.cost || ''
    });
  };

  const closeEditModal = () => { setIsEditingEvent(null); setEditForm({}); };

  const saveEdit = () => {
    if (isEditingEvent) {
      const { dayIdx, eventIdx } = isEditingEvent;
      updateEvent(dayIdx, eventIdx, {
        time: editForm.time, title: editForm.title, desc: editForm.desc,
        location: editForm.location || undefined, type: editForm.type,
        group_id: editForm.group_id, cost: parseFloat(editForm.cost) || 0
      });
      closeEditModal();
    }
  };

  // ==================== 通用函式 ====================

  const openMap = (location) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank', 'noopener,noreferrer');
  };

  const dayHasGroups = (day) => day.events?.some(e => e.group_id);
  const getDayGroups = (day) => {
    const groupIds = [...new Set(day.events?.filter(e => e.group_id).map(e => e.group_id))];
    return groups.filter(g => groupIds.includes(g.id));
  };

  // ==================== 預算計算 ====================

  const currencySymbols = { JPY: '¥', TWD: 'NT$', USD: '$', EUR: '€', KRW: '₩' };
  const sym = currencySymbols[currency] || currency;

  const getDayCost = (day) => (day.events || []).reduce((sum, e) => sum + (e.cost || 0), 0);
  const getTripCost = () => schedule.reduce((sum, day) => sum + getDayCost(day), 0);

  const getCostByType = () => {
    const map = {};
    schedule.forEach(day => day.events?.forEach(e => {
      if (e.cost > 0) map[e.type] = (map[e.type] || 0) + e.cost;
    }));
    return map;
  };

  // ==================== 打包清單 ====================

  const defaultPackingItems = [
    '護照', '身分證', '機票/電子票', '手機 & 充電線', '行動電源', '轉接頭',
    '現金', '信用卡', '換洗衣物', '盥洗用品', '雨具', '藥品', 'Wi-Fi 分享器'
  ];

  const addPackingItem = (text) => {
    if (!text.trim()) return;
    setPackingItems(prev => [...prev, { id: Date.now(), text: text.trim(), checked: false }]);
    setNewPackingItem('');
  };

  const togglePackingItem = (id) => {
    setPackingItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const deletePackingItem = (id) => {
    setPackingItems(prev => prev.filter(item => item.id !== id));
  };

  const addDefaultItems = () => {
    const existingTexts = new Set(packingItems.map(i => i.text));
    const newItems = defaultPackingItems
      .filter(t => !existingTexts.has(t))
      .map((text, i) => ({ id: Date.now() + i, text, checked: false }));
    setPackingItems(prev => [...prev, ...newItems]);
  };

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

  // ==================== 渲染：分組時間軸 ====================

  const renderGroupedTimeline = (dayData) => {
    const dayGroups = getDayGroups(dayData);
    const timeSlots = groupEventsByTimeAndGroup(dayData.events, dayGroups);
    return (
      <div className="space-y-6">
        <div className={`grid ${getGridColsClass(dayGroups.length)} gap-4 mb-6 sticky top-28 z-30`}>
          {dayGroups.map(group => {
            const colors = getColorClasses(group.color);
            return (
              <div key={group.id} className={`${colors.bg} ${colors.text} p-3 rounded-lg text-center font-bold shadow-sm border-2 ${colors.border}`}>
                {group.name}
              </div>
            );
          })}
        </div>
        {timeSlots.map((timeSlot, idx) => (
          <div key={idx} className="animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
            <EventTimelineGroup
              timeEvent={timeSlot}
              groupCount={dayGroups.length}
              sym={sym}
              currency={currency}
              exchangeRates={exchangeRates}
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
          <span className="text-sm font-bold text-slate-500 group-hover:text-slate-800 transition-colors">{event.time}</span>
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
                      <DollarSign className="w-3 h-3 mr-0.5" /> {sym}{event.cost.toLocaleString()}
                      {formatConvertedAmount(event.cost, currency, exchangeRates) && (
                        <span className="ml-1 text-slate-400 font-normal">{formatConvertedAmount(event.cost, currency, exchangeRates)}</span>
                      )}
                    </span>
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
      <div className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
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
                {schedule.length > 1 && (
                  <button onClick={() => deleteDay(day.day - 1)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-colors opacity-0 hover:opacity-100" title="刪除此日程">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setIsAddingDay(true)}
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
        </div>

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
                        <DollarSign className="w-3.5 h-3.5" /> {sym}{getDayCost(currentDayData).toLocaleString()}
                      </span>
                    )}
                    {dayHasGroups(currentDayData) && (
                      <div className="flex gap-2 mt-2">
                        {getDayGroups(currentDayData).map(group => {
                          const colors = getColorClasses(group.color);
                          return (
                            <span key={group.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
                              <Users className="w-3 h-3" /> {group.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setIsAddingEvent(true)}
                    className="flex-shrink-0 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2 font-semibold" title="新增事件">
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">新增事件</span>
                  </button>
                </div>
                {dayHasGroups(currentDayData) ? renderGroupedTimeline(currentDayData) : renderRegularTimeline(currentDayData)}
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
          <div className="animate-fade-in space-y-6">
            {/* Currency Selector */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-700">幣別</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="JPY">¥ JPY 日圓</option>
                <option value="TWD">NT$ TWD 台幣</option>
                <option value="USD">$ USD 美元</option>
                <option value="EUR">€ EUR 歐元</option>
                <option value="KRW">₩ KRW 韓圓</option>
              </select>
            </div>

            {/* Trip Total */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-emerald-100 text-sm font-medium mb-1">全程總花費</p>
              <p className="text-4xl font-extrabold">{sym}{getTripCost().toLocaleString()}</p>
              {formatConvertedAmount(getTripCost(), currency, exchangeRates) && (
                <p className="text-emerald-100 text-sm mt-1 font-medium">{formatConvertedAmount(getTripCost(), currency, exchangeRates)}</p>
              )}
              <p className="text-emerald-100 text-xs mt-2">{schedule.length} 天 · {schedule.reduce((s, d) => s + d.events.length, 0)} 個事件</p>
            </div>

            {/* Per Day */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-slate-800">每日花費</h3>
              {schedule.map(day => {
                const cost = getDayCost(day);
                const pct = getTripCost() > 0 ? (cost / getTripCost()) * 100 : 0;
                return (
                  <div key={day.day} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${day.theme}`} />
                        <span className="font-semibold text-sm text-slate-800">Day {day.day} · {day.title}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-600">{sym}{cost.toLocaleString()}</span>
                        {formatConvertedAmount(cost, currency, exchangeRates) && (
                          <span className="block text-xs text-slate-400">{formatConvertedAmount(cost, currency, exchangeRates)}</span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${day.theme} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Per Type */}
            {Object.keys(getCostByType()).length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-800">分類花費</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(getCostByType()).sort((a, b) => b[1] - a[1]).map(([type, cost]) => {
                    const emojiMap = { transport: '🚃', food: '🍜', shopping: '🛍️', sight: '📍', fun: '🎮', stay: '🏠' };
                    const nameMap = { transport: '交通', food: '食物', shopping: '購物', sight: '景點', fun: '娛樂', stay: '住宿' };
                    return (
                      <div key={type} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm text-center">
                        <p className="text-2xl mb-1">{emojiMap[type] || '📦'}</p>
                        <p className="text-xs text-slate-500 mb-1">{nameMap[type] || type}</p>
                        <p className="font-bold text-slate-800">{sym}{cost.toLocaleString()}</p>
                        {formatConvertedAmount(cost, currency, exchangeRates) && (
                          <p className="text-xs text-slate-400 mt-0.5">{formatConvertedAmount(cost, currency, exchangeRates)}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== Tab: Packing List ===== */}
        {activeTab === 'packing' && (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-amber-500" /> 打包清單
              </h3>
              <span className="text-sm text-slate-400">
                {packingItems.filter(i => i.checked).length}/{packingItems.length} 已完成
              </span>
            </div>

            {/* Progress */}
            {packingItems.length > 0 && (
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="h-3 rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${packingItems.length > 0 ? (packingItems.filter(i => i.checked).length / packingItems.length) * 100 : 0}%` }} />
              </div>
            )}

            {/* Add Item */}
            <div className="flex gap-2">
              <input type="text" value={newPackingItem}
                onChange={(e) => setNewPackingItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPackingItem(newPackingItem)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                placeholder="新增打包物品..." />
              <button onClick={() => addPackingItem(newPackingItem)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-sm transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Add Default */}
            {packingItems.length === 0 && (
              <button onClick={addDefaultItems}
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-amber-400 hover:text-amber-600 transition-colors text-sm font-semibold">
                一鍵加入常用物品（護照、充電線、藥品…）
              </button>
            )}

            {/* Items List */}
            <div className="space-y-2">
              {packingItems.map(item => (
                <div key={item.id}
                  className={`flex items-center gap-3 bg-white rounded-xl px-4 py-3 border shadow-sm transition-all ${item.checked ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200'}`}>
                  <button onClick={() => togglePackingItem(item.id)} className="flex-shrink-0">
                    {item.checked
                      ? <CheckSquare className="w-5 h-5 text-emerald-500" />
                      : <Square className="w-5 h-5 text-slate-300 hover:text-slate-500" />}
                  </button>
                  <span className={`flex-1 text-sm ${item.checked ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {item.text}
                  </span>
                  <button onClick={() => deletePackingItem(item.id)}
                    className="p-1 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add defaults button when list exists but some are missing */}
            {packingItems.length > 0 && packingItems.length < defaultPackingItems.length && (
              <button onClick={addDefaultItems}
                className="text-sm text-amber-500 hover:text-amber-600 font-semibold transition-colors">
                + 補充常用物品
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-2xl mx-auto px-6 mt-12 mb-6">
        <p className="text-center text-slate-400 text-xs">Have a nice trip! ✈️</p>
      </div>

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
                <input type="text" value={editForm.time} onChange={(e) => { const v = e.target.value; setEditForm(prev => ({ ...prev, time: v })); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="例：18:30" />
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
                <input type="text" value={editForm.location} onChange={(e) => { const v = e.target.value; setEditForm(prev => ({ ...prev, location: v })); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="地點名稱" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">類型</label>
                <select value={editForm.type} onChange={(e) => { const v = e.target.value; setEditForm(prev => ({ ...prev, type: v })); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {typeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">花費 ({sym})</label>
                <input type="number" min="0" step="1" value={editForm.cost} onChange={(e) => { const v = e.target.value; setEditForm(prev => ({ ...prev, cost: v })); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
              </div>
              {groups.length > 0 && (
                <GroupSelector groups={groups} selectedGroupId={editForm.group_id}
                  onSelectGroup={(groupId) => setEditForm(prev => ({ ...prev, group_id: groupId }))} />
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
                <input type="text" value={newDayForm.date} onChange={(e) => setNewDayForm({ ...newDayForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="例：1/24 (六)" />
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
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" /> 為此日新增組別（可選）
                </h4>
                {groups.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {groups.map(g => {
                      const colors = getColorClasses(g.color);
                      return <span key={g.id} className={`px-2 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>{g.name}</span>;
                    })}
                  </div>
                )}
                <GroupManagementPanel groups={newDayForm.newGroups || []}
                  onAddGroup={(gd) => { const ng = { id: `group-${Date.now()}`, ...gd }; setNewDayForm({ ...newDayForm, newGroups: [...(newDayForm.newGroups || []), ng] }); }}
                  onUpdateGroup={(gid, u) => { setNewDayForm({ ...newDayForm, newGroups: (newDayForm.newGroups || []).map(g => g.id === gid ? { ...g, ...u } : g) }); }}
                  onRemoveGroup={(gid) => { setNewDayForm({ ...newDayForm, newGroups: (newDayForm.newGroups || []).filter(g => g.id !== gid) }); }}
                />
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
                <input type="text" value={newEventForm.time} onChange={(e) => { const v = e.target.value; setNewEventForm(prev => ({ ...prev, time: v })); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="例：10:00" />
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
                <input type="text" value={newEventForm.location} onChange={(e) => { const v = e.target.value; setNewEventForm(prev => ({ ...prev, location: v })); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="地點名稱" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">類型</label>
                <select value={newEventForm.type} onChange={(e) => { const v = e.target.value; setNewEventForm(prev => ({ ...prev, type: v })); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {typeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">花費 ({sym})</label>
                <input type="number" min="0" step="1" value={newEventForm.cost} onChange={(e) => { const v = e.target.value; setNewEventForm(prev => ({ ...prev, cost: v })); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
              </div>
              {groups.length > 0 && (
                <GroupSelector groups={groups} selectedGroupId={newEventForm.group_id}
                  onSelectGroup={(groupId) => setNewEventForm(prev => ({ ...prev, group_id: groupId }))} />
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
