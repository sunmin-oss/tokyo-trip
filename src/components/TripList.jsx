import React, { useState, useEffect } from 'react';
import { Plus, Plane, Calendar, Trash2, LogOut, MapPin, ChevronRight, Sparkles } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

// ==================== 行程範本 ====================
const tripTemplates = [
  {
    title: '東京五天四夜初體驗',
    description: '經典東京必去景點 + 美食購物行程',
    days: 5,
    schedule: [
      { date: 'Day 1', title: '抵達 & 新宿探索', theme: 'bg-blue-500', events: [
        { time: '14:00', title: '成田機場抵達', desc: '搭 NEX 到新宿', type: 'transport', location: '成田國際機場', cost: 3250 },
        { time: '17:00', title: '新宿逛街', desc: '歌舞伎町、東口商圈', type: 'shopping', location: '新宿', cost: 5000 },
        { time: '19:00', title: '一蘭拉麵', desc: '必吃經典豚骨拉麵', type: 'food', location: '一蘭拉麵 新宿中央東口店', cost: 1290 },
        { time: '21:00', title: '飯店 Check-in', desc: '', type: 'stay', location: '新宿', cost: 8000 },
      ]},
      { date: 'Day 2', title: '淺草 & 晴空塔', theme: 'bg-red-500', events: [
        { time: '09:00', title: '淺草寺', desc: '雷門、仲見世通', type: 'sight', location: '淺草寺', cost: 0 },
        { time: '11:30', title: '抹茶甜點', desc: '淺草老牌甜品店', type: 'food', location: '淺草', cost: 800 },
        { time: '13:00', title: '晴空塔', desc: '天望甲板 350m', type: 'sight', location: '東京晴空塔', cost: 2100 },
        { time: '16:00', title: '秋葉原', desc: '電器街 & 動漫周邊', type: 'shopping', location: '秋葉原', cost: 3000 },
        { time: '19:00', title: '迴轉壽司', desc: '', type: 'food', location: '秋葉原', cost: 2500 },
      ]},
      { date: 'Day 3', title: '原宿 & 澀谷', theme: 'bg-pink-500', events: [
        { time: '10:00', title: '明治神宮', desc: '東京最大神社', type: 'sight', location: '明治神宮', cost: 0 },
        { time: '12:00', title: '竹下通', desc: '原宿文化、可麗餅', type: 'shopping', location: '竹下通', cost: 2000 },
        { time: '14:00', title: '表參道', desc: '精品街散步', type: 'sight', location: '表參道', cost: 0 },
        { time: '17:00', title: '澀谷十字路口', desc: '忠犬八公像', type: 'sight', location: '澀谷十字路口', cost: 0 },
        { time: '19:00', title: '燒肉晚餐', desc: '和牛燒肉放題', type: 'food', location: '澀谷', cost: 5000 },
      ]},
      { date: 'Day 4', title: '台場 & 豐洲', theme: 'bg-purple-500', events: [
        { time: '09:00', title: '豐洲市場', desc: '新鮮海鮮早餐', type: 'food', location: '豐洲市場', cost: 3000 },
        { time: '12:00', title: 'TeamLab Planets', desc: '數位藝術體驗', type: 'fun', location: 'TeamLab Planets Tokyo', cost: 3200 },
        { time: '15:00', title: '台場海濱公園', desc: '自由女神 & 彩虹大橋', type: 'sight', location: '台場海濱公園', cost: 0 },
        { time: '17:00', title: 'DiverCity', desc: '鋼彈立像 & 購物', type: 'shopping', location: 'DiverCity Tokyo Plaza', cost: 4000 },
        { time: '19:30', title: '拉麵國技館', desc: '各地名店拉麵', type: 'food', location: 'DiverCity Tokyo Plaza', cost: 1200 },
      ]},
      { date: 'Day 5', title: '上野 & 回程', theme: 'bg-green-500', events: [
        { time: '09:00', title: '上野阿美橫丁', desc: '最後購物機會', type: 'shopping', location: '阿美橫丁', cost: 5000 },
        { time: '11:00', title: '上野公園', desc: '散步、拍照', type: 'sight', location: '上野公園', cost: 0 },
        { time: '12:30', title: '蕎麥麵午餐', desc: '', type: 'food', location: '上野', cost: 1100 },
        { time: '14:00', title: '前往機場', desc: '搭 Skyliner 到成田', type: 'transport', location: '成田國際機場', cost: 2520 },
      ]},
    ],
    packingItems: ['護照', '身分證', '機票/電子票', '手機 & 充電線', '行動電源', '轉接頭', '現金', '信用卡', '換洗衣物', '盥洗用品', '雨具', '藥品', 'Wi-Fi 分享器'],
  },
  {
    title: '首爾三天兩夜購物行',
    description: '明洞、弘大、江南購物美食之旅',
    days: 3,
    schedule: [
      { date: 'Day 1', title: '明洞購物', theme: 'bg-red-500', events: [
        { time: '12:00', title: '仁川機場抵達', desc: '搭 AREX 前往首爾站', type: 'transport', location: '仁川國際機場', cost: 9500 },
        { time: '15:00', title: '明洞逛街', desc: '美妝、服飾', type: 'shopping', location: '明洞', cost: 50000 },
        { time: '18:00', title: '部隊鍋晚餐', desc: '韓式經典', type: 'food', location: '明洞', cost: 12000 },
        { time: '20:00', title: '南山塔夜景', desc: '首爾塔觀景台', type: 'sight', location: 'N首爾塔', cost: 16000 },
      ]},
      { date: 'Day 2', title: '弘大 & 汝矣島', theme: 'bg-purple-500', events: [
        { time: '10:00', title: '弘大自由市場', desc: '文創小物、街頭表演', type: 'shopping', location: '弘大入口', cost: 20000 },
        { time: '12:30', title: '韓式烤肉', desc: '五花肉一人份', type: 'food', location: '弘大', cost: 15000 },
        { time: '14:30', title: 'The Hyundai Seoul', desc: '最美百貨公司', type: 'shopping', location: 'The Hyundai Seoul', cost: 30000 },
        { time: '18:00', title: '汝矣島漢江公園', desc: '炸雞配啤酒', type: 'food', location: '汝矣島漢江公園', cost: 25000 },
      ]},
      { date: 'Day 3', title: '景福宮 & 回程', theme: 'bg-teal-500', events: [
        { time: '09:00', title: '景福宮', desc: '穿韓服免費入場', type: 'sight', location: '景福宮', cost: 20000 },
        { time: '11:30', title: '北村韓屋村', desc: '傳統韓屋拍照', type: 'sight', location: '北村韓屋村', cost: 0 },
        { time: '13:00', title: '人蔘雞湯', desc: '景福宮附近名店', type: 'food', location: '景福宮', cost: 16000 },
        { time: '15:00', title: '返回機場', desc: '', type: 'transport', location: '仁川國際機場', cost: 9500 },
      ]},
    ],
    packingItems: ['護照', '身分證', '機票/電子票', '手機 & 充電線', '行動電源', '韓幣現金', '信用卡', '換洗衣物', '盥洗用品', '雨具', 'Wi-Fi 分享器', 'T-money 卡'],
  },
  {
    title: '大阪京都四日遊',
    description: '關西經典路線：大阪美食 + 京都文化巡禮',
    days: 4,
    schedule: [
      { date: 'Day 1', title: '大阪道頓堀', theme: 'bg-orange-500', events: [
        { time: '13:00', title: '關西機場抵達', desc: '搭南海電鐵到難波', type: 'transport', location: '關西國際機場', cost: 1270 },
        { time: '16:00', title: '道頓堀', desc: '章魚燒、大阪燒', type: 'food', location: '道頓堀', cost: 2000 },
        { time: '18:00', title: '心齋橋筋', desc: '購物商店街', type: 'shopping', location: '心齋橋', cost: 5000 },
        { time: '20:00', title: '串炸達摩', desc: '大阪名物', type: 'food', location: '新世界', cost: 1500 },
      ]},
      { date: 'Day 2', title: '大阪城 & 環球影城', theme: 'bg-blue-500', events: [
        { time: '09:00', title: '日本環球影城', desc: '哈利波特園區、瑪利歐世界', type: 'fun', location: '日本環球影城', cost: 8600 },
        { time: '19:00', title: '大阪燒晚餐', desc: '鐵板燒', type: 'food', location: '大阪', cost: 1800 },
      ]},
      { date: 'Day 3', title: '京都寺廟巡禮', theme: 'bg-green-500', events: [
        { time: '08:00', title: '搭 JR 到京都', desc: '新快速 30 分', type: 'transport', location: '京都車站', cost: 570 },
        { time: '09:30', title: '伏見稻荷大社', desc: '千本鳥居', type: 'sight', location: '伏見稻荷大社', cost: 0 },
        { time: '12:00', title: '錦市場', desc: '京都的廚房', type: 'food', location: '錦市場', cost: 2000 },
        { time: '14:00', title: '清水寺', desc: '音羽瀑布、清水舞台', type: 'sight', location: '清水寺', cost: 400 },
        { time: '16:30', title: '花見小路', desc: '祇園藝妓文化', type: 'sight', location: '花見小路', cost: 0 },
        { time: '18:30', title: '抹茶百匯', desc: '中村藤吉', type: 'food', location: '京都', cost: 1400 },
      ]},
      { date: 'Day 4', title: '嵐山 & 回程', theme: 'bg-amber-500', events: [
        { time: '09:00', title: '嵐山竹林', desc: '竹林小徑', type: 'sight', location: '嵐山竹林', cost: 0 },
        { time: '10:30', title: '渡月橋', desc: '嵐山地標', type: 'sight', location: '渡月橋', cost: 0 },
        { time: '12:00', title: '湯豆腐', desc: '京都傳統料理', type: 'food', location: '嵐山', cost: 1500 },
        { time: '14:00', title: '返回關西機場', desc: '', type: 'transport', location: '關西國際機場', cost: 1270 },
      ]},
    ],
    packingItems: ['護照', '身分證', '機票/電子票', '手機 & 充電線', '行動電源', '轉接頭', '現金', '信用卡', '換洗衣物', '盥洗用品', '雨具', '藥品', 'Wi-Fi 分享器', 'ICOCA 卡'],
  },
];

/**
 * TripList - 行程列表首頁
 */
const TripList = ({ user, onSelectTrip, onSignOut }) => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTrip, setNewTrip] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: ''
  });
  const isCloudEnabled = isSupabaseConfigured() && !!user;

  useEffect(() => {
    loadTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadTrips = async () => {
    setLoading(true);
    try {
      if (isCloudEnabled) {
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setTrips(data || []);
      } else {
        // 本地模式：從 localStorage 載入
        const saved = localStorage.getItem('localTrips');
        if (saved) {
          setTrips(JSON.parse(saved));
        }
      }
    } catch (err) {
      console.error('載入行程失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTrip = async () => {
    if (!newTrip.title || !newTrip.start_date || !newTrip.end_date) return;

    try {
      if (isCloudEnabled) {
        const { data, error } = await supabase
          .from('trips')
          .insert([{
            title: newTrip.title,
            description: newTrip.description,
            start_date: newTrip.start_date,
            end_date: newTrip.end_date,
            user_id: user.id
          }])
          .select();
        
        if (error) throw error;
        setTrips([data[0], ...trips]);
      } else {
        // 本地模式
        const localTrip = {
          id: `local-${Date.now()}`,
          ...newTrip,
          created_at: new Date().toISOString()
        };
        const updated = [localTrip, ...trips];
        setTrips(updated);
        localStorage.setItem('localTrips', JSON.stringify(updated));
      }

      setIsAdding(false);
      setNewTrip({ title: '', description: '', start_date: '', end_date: '' });
    } catch (err) {
      console.error('建立行程失敗:', err);
    }
  };

  const deleteTrip = async (tripId) => {
    if (!confirm('確定要刪除此行程？所有日程和事件都會被永久刪除。')) return;

    try {
      if (isCloudEnabled) {
        const { error } = await supabase
          .from('trips')
          .delete()
          .eq('id', tripId);
        
        if (error) throw error;
      }

      const updated = trips.filter(t => t.id !== tripId);
      setTrips(updated);
      if (!isCloudEnabled) {
        localStorage.setItem('localTrips', JSON.stringify(updated));
      }
    } catch (err) {
      console.error('刪除行程失敗:', err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const getDayCount = (start, end) => {
    if (!start || !end) return 0;
    const diff = new Date(end) - new Date(start);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  // ==================== 範本套用 ====================
  const applyTemplate = async (template) => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() + 7); // 一週後出發
    const end = new Date(start);
    end.setDate(end.getDate() + template.days - 1);
    const fmt = (d) => d.toISOString().split('T')[0];

    const tripData = {
      title: template.title,
      description: template.description,
      start_date: fmt(start),
      end_date: fmt(end),
    };

    try {
      if (isCloudEnabled) {
        // 1) 建立 trip
        const { data: tripRows, error: tripErr } = await supabase
          .from('trips')
          .insert([{ ...tripData, user_id: user.id }])
          .select();
        if (tripErr) throw tripErr;
        const dbTrip = tripRows[0];

        // 2) 建立 days
        const dayInserts = template.schedule.map((day, di) => {
          const d = new Date(start);
          d.setDate(start.getDate() + di);
          return {
            trip_id: dbTrip.id,
            day_number: di + 1,
            date: fmt(d),
            day_title: day.title,
            theme: day.theme,
          };
        });

        const { data: dayRows, error: dayErr } = await supabase
          .from('days')
          .insert(dayInserts)
          .select();
        if (dayErr) throw dayErr;

        // 3) 建立 events
        const dayMap = new Map((dayRows || []).map((d) => [d.day_number, d.id]));
        const eventInserts = [];
        template.schedule.forEach((day, di) => {
          const dayId = dayMap.get(di + 1);
          (day.events || []).forEach((evt, ei) => {
            eventInserts.push({
              day_id: dayId,
              trip_id: dbTrip.id,
              time: evt.time,
              title: evt.title,
              description: evt.desc || '',
              event_type: evt.type || 'sight',
              location: evt.location || null,
              group_id: null,
              cost: evt.cost || 0,
              order_index: ei,
            });
          });
        });

        if (eventInserts.length > 0) {
          const { error: evtErr } = await supabase.from('events').insert(eventInserts);
          if (evtErr) throw evtErr;
        }

        setTrips([dbTrip, ...trips]);
        onSelectTrip(dbTrip);
        return;
      }

      const localTrip = {
        id: `local-${Date.now()}`,
        ...tripData,
        created_at: new Date().toISOString(),
      };

      // Build schedule with generated IDs
      const scheduleData = template.schedule.map((day, di) => ({
        _id: `day-${Date.now()}-${di}`,
        day: di + 1,
        date: day.date,
        title: day.title,
        theme: day.theme,
        events: day.events.map((evt, ei) => ({
          ...evt,
          _id: `evt-${Date.now()}-${di}-${ei}`,
          group_id: null,
        })),
      }));

      const packingData = (template.packingItems || []).map((text, i) => ({
        id: Date.now() + i,
        text,
        checked: false,
      }));

      // Save trip to list
      const updated = [localTrip, ...trips];
      setTrips(updated);
      localStorage.setItem('localTrips', JSON.stringify(updated));

      // Save trip detail data
      localStorage.setItem(`trip_${localTrip.id}`, JSON.stringify({
        schedule: scheduleData,
        groups: [],
        packingItems: packingData,
        currency: template.title.includes('首爾') ? 'KRW' : 'JPY',
      }));

      // Auto-enter the trip
      onSelectTrip(localTrip);
    } catch (err) {
      console.error('套用範本失敗:', err);
    }
  };

  const themeColors = ['bg-blue-500', 'bg-red-500', 'bg-amber-500', 'bg-purple-500', 'bg-indigo-500', 'bg-teal-500', 'bg-pink-500', 'bg-green-500'];

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Trip Planner</h1>
              <p className="text-xs text-slate-500">
                {user ? user.email : '本地模式'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              新增行程
            </button>
            {user && onSignOut && (
              <button
                onClick={onSignOut}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="登出"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Trip Cards */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-12">
            <Plane className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-500 mb-2">還沒有任何行程</h2>
            <p className="text-slate-400 mb-6">建立你的第一個旅行計畫，或直接套用範本吧！</p>
            <button
              onClick={() => setIsAdding(true)}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> 從頭建立
            </button>

            {/* Template Cards */}
            <div className="mt-10 text-left">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2 justify-center">
                <Sparkles className="w-4 h-4 text-amber-400" /> 一鍵套用範本
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                {tripTemplates.map((tpl, idx) => {
                  const colors = ['from-blue-500 to-indigo-600', 'from-rose-500 to-pink-600', 'from-amber-500 to-orange-600'];
                  const totalCost = tpl.schedule.reduce((s, d) => s + d.events.reduce((s2, e) => s2 + (e.cost || 0), 0), 0);
                  const totalEvents = tpl.schedule.reduce((s, d) => s + d.events.length, 0);
                  return (
                    <button key={idx} onClick={() => applyTemplate(tpl)}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all text-left overflow-hidden group">
                      <div className={`h-20 bg-gradient-to-r ${colors[idx % 3]} flex items-end p-4`}>
                        <h4 className="text-white font-bold text-base drop-shadow-sm">{tpl.title}</h4>
                      </div>
                      <div className="p-4 space-y-2">
                        <p className="text-xs text-slate-500">{tpl.description}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>{tpl.days} 天</span>
                          <span>{totalEvents} 個景點</span>
                          <span>¥{totalCost.toLocaleString()}</span>
                        </div>
                        <p className="text-xs font-semibold text-blue-500 group-hover:text-blue-600 transition-colors flex items-center gap-1 mt-2">
                          <Sparkles className="w-3 h-3" /> 一鍵套用
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {trips.map((trip, index) => (
              <div
                key={trip.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer group overflow-hidden"
                onClick={() => onSelectTrip(trip)}
              >
                {/* Color Bar */}
                <div className={`h-2 ${themeColors[index % themeColors.length]}`} />

                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {trip.title}
                      </h3>
                      {trip.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{trip.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {getDayCount(trip.start_date, trip.end_date)} 天
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTrip(trip.id); }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="刪除行程"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Trip Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <h3 className="text-xl font-bold text-slate-800 mb-6">建立新行程</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">行程名稱</label>
                <input
                  type="text"
                  value={newTrip.title}
                  onChange={(e) => setNewTrip({ ...newTrip, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：東京六日遊"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">描述（可選）</label>
                <textarea
                  value={newTrip.description}
                  onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="2"
                  placeholder="簡短描述這趟旅程..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">出發日期</label>
                  <input
                    type="date"
                    value={newTrip.start_date}
                    onChange={(e) => setNewTrip({ ...newTrip, start_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">回程日期</label>
                  <input
                    type="date"
                    value={newTrip.end_date}
                    onChange={(e) => setNewTrip({ ...newTrip, end_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={createTrip}
                  disabled={!newTrip.title || !newTrip.start_date || !newTrip.end_date}
                  className="flex-1 px-4 py-2.5 text-white bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  建立
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default TripList;
