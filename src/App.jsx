import React, { useState, useEffect } from 'react';
import { 
  Plane, 
  MapPin, 
  Utensils, 
  ShoppingBag, 
  Train, 
  Clock, 
  Moon, 
  Sun, 
  Camera, 
  Music, 
  Gamepad2, 
  Coffee,
  Users,
  ExternalLink,
  Edit2,
  Save,
  X,
  Plus
} from 'lucide-react';

const TokyoTrip = () => {
  const [activeDay, setActiveDay] = useState(1);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isAddingDay, setIsAddingDay] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newDayForm, setNewDayForm] = useState({ date: '', title: '', theme: 'bg-green-500' });
  const [newEventForm, setNewEventForm] = useState({ time: '', title: '', desc: '', type: 'sight' });

  // 監聽滾動以改變導航欄樣式
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openMap = (location) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');
  };

  const initialSchedule = [
    {
      day: 1,
      date: "1/18 (日)",
      title: "抵達 & 宵夜採購",
      theme: "bg-blue-500",
      events: [
        { time: "18:30", icon: <Plane className="w-5 h-5" />, title: "抵達成田機場 (NRT)", desc: "航班 CI108", type: "transport" },
        { time: "19:30", icon: <Train className="w-5 h-5" />, title: "專車接送", desc: "機場 → 足立區民宿", type: "transport" },
        { time: "21:00", icon: <MapPin className="w-5 h-5" />, title: "民宿 Check-in", desc: "地點：柳原2丁目", location: "柳原2丁目", type: "stay" },
        { time: "21:30", icon: <Utensils className="w-5 h-5" />, title: "北海道拉麵 みそ熊", desc: "北千住 | 推薦：招牌味噌拉麵、炸雞塊 (麵量加大免費)", location: "北海道ラーメン みそ熊 北千住店", type: "food" },
        { time: "22:30", icon: <ShoppingBag className="w-5 h-5" />, title: "唐吉訶德 北千住店", desc: "任務：買酒、零食 | 營業至凌晨 04:00", location: "唐吉訶德 北千住店", type: "shopping" },
      ]
    },
    {
      day: 2,
      date: "1/19 (一)",
      title: "購物、電玩與居酒屋",
      theme: "bg-red-500",
      events: [
        { time: "09:00", icon: <MapPin className="w-5 h-5" />, title: "小網神社", desc: "強運除厄 | 人形町", location: "小網神社", type: "sight" },
        { time: "10:30", icon: <Gamepad2 className="w-5 h-5" />, title: "秋葉原", desc: "動漫聖地巡禮", location: "秋葉原", type: "fun" },
        { time: "12:30", icon: <Utensils className="w-5 h-5" />, title: "秋葉原午餐 (二選一)", desc: "A: 炸牛排 壱弐参 (自烤炸牛排)\nB: Roast Beef Ohno (和牛丼)", location: "秋葉原", type: "food" },
        { time: "14:00", icon: <Gamepad2 className="w-5 h-5" />, title: "秋葉原 自由探索", desc: "繼續敗家", location: "秋葉原", type: "fun" },
        { time: "16:00", icon: <ShoppingBag className="w-5 h-5" />, title: "Yodobashi Camera (7F)", desc: "GU & Uniqlo 買衣服", location: "Yodobashi Camera Akiba", type: "shopping" },
        { time: "20:30", icon: <Utensils className="w-5 h-5" />, title: "元氣七輪燒肉 牛繁", desc: "北千住 | 17:00-23:00", location: "牛繁 北千住店", type: "food" },
        { time: "22:30", icon: <Users className="w-5 h-5" />, title: "續攤 (二選一)", desc: "A: 鳥貴族 (均一價燒鳥)\nB: 磯丸水產 (24H 自烤海鮮)", location: "北千住", type: "food" },
      ]
    },
    {
      day: 3,
      date: "1/20 (二)",
      title: "淺草雷門 & 玩具模型",
      theme: "bg-amber-500",
      events: [
        { time: "09:30", icon: <Camera className="w-5 h-5" />, title: "淺草寺 & 雷門", desc: "東京必去地標", location: "雷門", type: "sight" },
        { time: "12:00", icon: <Utensils className="w-5 h-5" />, title: "淺草午餐 (二選一)", desc: "A: 淺草 炸牛排 (雷門對面)\nB: 大黑家 天婦羅 (百年老店)", location: "淺草", type: "food" },
        { time: "13:30", icon: <Train className="w-5 h-5" />, title: "前往 東雲", desc: "搭乘百合海鷗號欣賞沿途風景", type: "transport" },
        { time: "15:00", icon: <ShoppingBag className="w-5 h-5" />, title: "Ricoland Tokyo Bay", desc: "重機騎士聖地 | 東雲店", location: "Ricoland Tokyo Bay", type: "shopping" },
        { time: "18:00", icon: <Train className="w-5 h-5" />, title: "前往 上野", desc: "", type: "transport" },
        { time: "18:30", icon: <ShoppingBag className="w-5 h-5" />, title: "上野 購物行程", desc: "Yamashiroya (玩具專賣店)\n二木的菓子 (阿美橫丁伴手禮)", location: "Yamashiroya 上野", type: "shopping" },
        { time: "20:00", icon: <Utensils className="w-5 h-5" />, title: "鴨 to 蔥", desc: "上野御徒町 | 備案：一蘭拉麵或居酒屋", location: "鴨to蔥", type: "food" },
        { time: "22:00", icon: <Moon className="w-5 h-5" />, title: "回北千住休息", desc: "明天迪士尼組需早起，早點睡！", type: "stay" },
      ]
    },
    {
      day: 4,
      date: "1/21 (三)",
      title: "分組行動日",
      theme: "bg-purple-500",
      isSplit: true,
      splitEvents: [
        {
          time: "早晨",
          groupA: { time: "08:00", title: "睡飽一點", desc: "約 09:30 出門" },
          groupB: { time: "07:30", title: "出發衝入園", desc: "北千住→八丁堀→舞濱" }
        },
        {
          time: "10:00",
          groupA: { title: "JOJO World Quizzes", desc: "池袋 太陽城 3F", location: "Sunshine City" },
          groupB: { title: "迪士尼樂園 / 海洋", desc: "開始狂玩設施、抽 DPA", location: "Tokyo Disney Resort" }
        },
        {
          time: "11:30",
          groupA: { title: "太陽城 Sunshine City", desc: "寶可夢中心、One Piece、最大扭蛋店" },
          groupB: { title: "繼續玩設施", desc: "夢幻國度探索中" }
        },
        {
          time: "13:00",
          groupA: { title: "無敵家拉麵", desc: "池袋必吃超濃厚豚骨", location: "無敵家" },
          groupB: { title: "園區午餐", desc: "補充體力" }
        },
        {
          time: "14:30",
          groupA: { title: "新宿 黑膠大採購", desc: "Disk Union + Tower Records", location: "Disk Union Shinjuku" },
          groupB: { title: "遊行 / 設施", desc: "享受歡樂時光" }
        },
        {
          time: "18:00",
          groupA: { title: "東急歌舞伎町塔", desc: "Namco Tokyo 賽博朋克氛圍", location: "東急歌舞伎町塔" },
          groupB: { title: "繼續玩設施", desc: "把握最後時光" }
        },
        {
          time: "19:00",
          groupA: { title: "敘敘苑 燒肉 (新宿)", desc: "記得依人數訂位", location: "敘敘苑 新宿" },
          groupB: { title: "夜間遊行 / 煙火", desc: "晚餐在園區解決" }
        },
        {
          time: "21:30",
          groupA: { title: "悠閒搭車回北千住", desc: "" },
          groupB: { title: "21:00 閉園", desc: "約 22:00 回到北千住" }
        }
      ]
    },
    {
      day: 5,
      date: "1/22 (四)",
      title: "澀谷潮流 & A5和牛",
      theme: "bg-indigo-500",
      events: [
        { time: "11:00", icon: <Train className="w-5 h-5" />, title: "前往 澀谷", desc: "Shibuya", type: "transport" },
        { time: "11:30", icon: <ShoppingBag className="w-5 h-5" />, title: "Parco 百貨 (6F)", desc: "任天堂、寶可夢、Jump Shop", location: "Shibuya Parco", type: "shopping" },
        { time: "13:00", icon: <Utensils className="w-5 h-5" />, title: "午餐 (二選一)", desc: "挽肉與米 (需券) 或 美登利壽司", location: "澀谷", type: "food" },
        { time: "14:30", icon: <Music className="w-5 h-5" />, title: "Tower Records 澀谷店", desc: "6F 尋寶", location: "Tower Records Shibuya", type: "shopping" },
        { time: "16:00", icon: <Camera className="w-5 h-5" />, title: "宮下公園", desc: "MIYASHITA PARK", location: "MIYASHITA PARK", type: "sight" },
        { time: "17:40", icon: <Camera className="w-5 h-5" />, title: "SHIBUYA SKY", desc: "絕美日落與夜景 (需預約)", location: "SHIBUYA SKY", type: "sight" },
        { time: "19:45", icon: <Utensils className="w-5 h-5" />, title: "燒肉京城 北千住店", desc: "完美結尾：A5 和牛燒肉", location: "燒肉京城 北千住店", type: "food" },
        { time: "22:30", icon: <Music className="w-5 h-5" />, title: "卡拉OK Big Echo", desc: "北千住店 | 歡唱最後一晚", location: "Big Echo 北千住", type: "fun" },
      ]
    },
    {
      day: 6,
      date: "1/23 (五)",
      title: "輕鬆返台",
      theme: "bg-teal-500",
      events: [
        { time: "10:00", icon: <MapPin className="w-5 h-5" />, title: "退房 & 上行李", desc: "檢查護照與隨身物品", type: "stay" },
        { time: "11:00", icon: <Train className="w-5 h-5" />, title: "專車接送", desc: "民宿 → 羽田機場 (HND)", type: "transport" },
        { time: "12:00", icon: <Plane className="w-5 h-5" />, title: "抵達機場", desc: "辦理登機手續", location: "羽田機場", type: "transport" },
        { time: "12:30", icon: <Utensils className="w-5 h-5" />, title: "機場午餐", desc: "最後的美食", type: "food" },
        { time: "14:15", icon: <Plane className="w-5 h-5" />, title: "起飛 (CI221)", desc: "返回溫暖的家", type: "transport" },
      ]
    },
  ];

  const [schedule, setSchedule] = useState(initialSchedule);

  const updateEventTime = (dayIndex, eventIndex, newTime) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].events[eventIndex].time = newTime;
    setSchedule(newSchedule);
  };

  const updateEventTitle = (dayIndex, eventIndex, newTitle) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].events[eventIndex].title = newTitle;
    setSchedule(newSchedule);
  };

  const updateEventDesc = (dayIndex, eventIndex, newDesc) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].events[eventIndex].desc = newDesc;
    setSchedule(newSchedule);
  };

  const currentDayData = schedule.find(d => d.day === activeDay);

  const openEditModal = (dayIdx, eventIdx, event) => {
    setIsEditingEvent({ dayIdx, eventIdx });
    setEditForm({
      time: event.time,
      title: event.title,
      desc: event.desc
    });
  };

  const closeEditModal = () => {
    setIsEditingEvent(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (isEditingEvent) {
      const { dayIdx, eventIdx } = isEditingEvent;
      updateEventTime(dayIdx, eventIdx, editForm.time);
      updateEventTitle(dayIdx, eventIdx, editForm.title);
      updateEventDesc(dayIdx, eventIdx, editForm.desc);
      closeEditModal();
    }
  };

  const addNewDay = () => {
    const newDay = {
      day: schedule.length + 1,
      date: newDayForm.date,
      title: newDayForm.title,
      theme: newDayForm.theme,
      events: []
    };
    setSchedule([...schedule, newDay]);
    setActiveDay(newDay.day);
    setIsAddingDay(false);
    setNewDayForm({ date: '', title: '', theme: 'bg-green-500' });
  };

  const addNewEvent = () => {
    const dayIdx = activeDay - 1;
    const newEvent = {
      time: newEventForm.time,
      title: newEventForm.title,
      desc: newEventForm.desc,
      type: newEventForm.type,
      icon: <MapPin className="w-5 h-5" />
    };
    const newSchedule = [...schedule];
    newSchedule[dayIdx].events.push(newEvent);
    setSchedule(newSchedule);
    setIsAddingEvent(false);
    setNewEventForm({ time: '', title: '', desc: '', type: 'sight' });
  };

  const themeOptions = [
    { value: 'bg-blue-500', label: '藍色' },
    { value: 'bg-red-500', label: '紅色' },
    { value: 'bg-amber-500', label: '琥珀色' },
    { value: 'bg-purple-500', label: '紫色' },
    { value: 'bg-indigo-500', label: '靛色' },
    { value: 'bg-teal-500', label: '青色' },
    { value: 'bg-green-500', label: '綠色' },
    { value: 'bg-pink-500', label: '粉紅色' }
  ];

  const typeOptions = [
    { value: 'transport', label: '交通' },
    { value: 'food', label: '食物' },
    { value: 'shopping', label: '購物' },
    { value: 'sight', label: '景點' },
    { value: 'fun', label: '娛樂' },
    { value: 'stay', label: '住宿' }
  ];

  return (
    <div className="min-h-screen bg-slate-100 pb-10 font-sans text-slate-800">
      
      {/* Hero Header */}
      <div className="relative h-64 bg-slate-900 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=2994&auto=format&fit=crop" 
          alt="Tokyo" 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6 text-white w-full">
          <p className="text-yellow-400 font-bold tracking-widest text-sm mb-2 uppercase">Tokyo Trip 2025</p>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-2">東京六日究極之旅</h1>
          <div className="flex items-center text-sm md:text-base text-slate-200">
            <span className="bg-slate-800/80 px-3 py-1 rounded-full backdrop-blur-sm border border-slate-700">
              1/18 (日) - 1/23 (五)
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Navigation */}
      <div className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between gap-3">
          <div className="overflow-x-auto no-scrollbar flex space-x-3 snap-x flex-1">
            {schedule.map((day) => (
              <button
                key={day.day}
                onClick={() => {
                  setActiveDay(day.day);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`snap-center flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border ${
                  activeDay === day.day 
                    ? `${day.theme} text-white border-transparent shadow-lg scale-105` 
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="block text-xs opacity-80 font-medium">Day {day.day}</span>
                <span>{day.date.split(' ')[0]}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsAddingDay(true)}
            className="flex-shrink-0 p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            title="新增日程"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-2xl mx-auto px-4 mt-6">
        
        {/* Day Header */}
        <div className="mb-8 flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900">{currentDayData.date}</h2>
            <p className={`inline-block mt-2 px-4 py-1 rounded-full text-white text-sm font-medium ${currentDayData.theme}`}>
              {currentDayData.title}
            </p>
          </div>
          <button
            onClick={() => setIsAddingEvent(true)}
            className="flex-shrink-0 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2 font-semibold"
            title="新增事件"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">新增事件</span>
          </button>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          
          {/* Regular Timeline (Day 1, 2, 3, 5, 6) */}
          {!currentDayData.isSplit && currentDayData.events.map((event, idx) => (
            <div key={idx} className="flex group animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
              {/* Time Column */}
              <div className="w-16 flex-shrink-0 flex flex-col items-center">
                <span className="text-sm font-bold text-slate-500 group-hover:text-slate-800 transition-colors">{event.time}</span>
                <div className="h-full w-0.5 bg-slate-200 mt-2 mb-2 group-last:bg-transparent relative">
                   <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${currentDayData.theme.replace('bg-', 'bg-')}`}></div>
                </div>
              </div>
              
              {/* Card */}
              <div className="flex-1 pb-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300 relative overflow-hidden">
                  {/* Decorative Icon Background */}
                  <div className="absolute -right-4 -bottom-4 text-slate-50 opacity-10 transform rotate-12 scale-150">
                    {event.icon}
                  </div>

                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${currentDayData.theme} bg-opacity-10 text-${currentDayData.theme.split('-')[1]}-600`}>
                        {event.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-800 leading-tight">{event.title}</h3>
                        <div className="mt-1 text-slate-600 text-sm whitespace-pre-line">{event.desc}</div>
                        
                        {event.location && (
                          <button 
                            onClick={() => openMap(event.location)}
                            className="mt-3 inline-flex items-center text-xs font-semibold text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                          >
                            <MapPin className="w-3 h-3 mr-1" />
                            打開地圖
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => openEditModal(activeDay - 1, idx, event)}
                      className="flex-shrink-0 ml-2 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="編輯行程"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Split Timeline (Day 4) */}
          {currentDayData.isSplit && (
            <div className="space-y-4">
               {/* Split Header */}
               <div className="grid grid-cols-2 gap-4 mb-6 sticky top-28 z-30">
                  <div className="bg-pink-100 text-pink-800 p-2 rounded-lg text-center font-bold shadow-sm border-2 border-pink-200">
                    A 組<br/><span className="text-xs font-normal">JOJO + 黑膠</span>
                  </div>
                  <div className="bg-sky-100 text-sky-800 p-2 rounded-lg text-center font-bold shadow-sm border-2 border-sky-200">
                    B 組<br/><span className="text-xs font-normal">迪士尼</span>
                  </div>
               </div>

               {currentDayData.splitEvents.map((slot, idx) => (
                 <div key={idx} className="relative animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                    {/* Time Badge */}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-3 z-20">
                      <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                        {slot.time}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      {/* Group A Card */}
                      <div className="bg-white p-3 rounded-xl shadow-sm border-l-4 border-pink-400 hover:shadow-md transition-all">
                        <h4 className="font-bold text-slate-800 text-sm mb-1">{slot.groupA.title}</h4>
                        <p className="text-xs text-slate-500 mb-2">{slot.groupA.desc}</p>
                        {slot.groupA.location && (
                           <button onClick={() => openMap(slot.groupA.location)} className="text-pink-500 hover:text-pink-600">
                             <ExternalLink className="w-3 h-3" />
                           </button>
                        )}
                      </div>

                      {/* Group B Card */}
                      <div className="bg-white p-3 rounded-xl shadow-sm border-l-4 border-sky-400 hover:shadow-md transition-all">
                        <h4 className="font-bold text-slate-800 text-sm mb-1">{slot.groupB.title}</h4>
                        <p className="text-xs text-slate-500 mb-2">{slot.groupB.desc}</p>
                        {slot.groupB.location && (
                           <button onClick={() => openMap(slot.groupB.location)} className="text-sky-500 hover:text-sky-600">
                             <ExternalLink className="w-3 h-3" />
                           </button>
                        )}
                      </div>
                    </div>
                 </div>
               ))}
            </div>
          )}

        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-2xl mx-auto px-6 mt-12 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
           <h3 className="font-bold text-slate-800 mb-4 flex items-center">
             <Coffee className="w-5 h-5 mr-2 text-slate-400"/> 
             旅遊小筆記
           </h3>
           <ul className="space-y-2 text-sm text-slate-600 list-disc pl-5">
             <li><span className="font-semibold text-slate-800">Day 1</span> 記得去唐吉訶德買水和零食。</li>
             <li><span className="font-semibold text-slate-800">Day 4</span> 迪士尼組 07:30 準時出發，不要賴床！</li>
             <li><span className="font-semibold text-slate-800">Day 5</span> 挽肉與米如果沒票，直接去排美登利壽司。</li>
             <li>日本電壓 100V，台灣電器通常可直接用 (注意吹風機)。</li>
           </ul>
        </div>
        <p className="text-center text-slate-400 text-xs mt-8">
           Have a nice trip! ✈️
        </p>
      </div>

      {/* Edit Modal */}
      {isEditingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">編輯行程</h3>
              <button
                onClick={closeEditModal}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">時間</label>
                <input
                  type="text"
                  value={editForm.time}
                  onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：18:30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">標題</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="活動標題"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">描述</label>
                <textarea
                  value={editForm.desc}
                  onChange={(e) => setEditForm({ ...editForm, desc: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="4"
                  placeholder="活動描述"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={saveEdit}
                  className="flex-1 px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  儲存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Day Modal */}
      {isAddingDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">新增日程</h3>
              <button
                onClick={() => setIsAddingDay(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">日期</label>
                <input
                  type="text"
                  value={newDayForm.date}
                  onChange={(e) => setNewDayForm({ ...newDayForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="例：1/24 (六)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">主題</label>
                <input
                  type="text"
                  value={newDayForm.title}
                  onChange={(e) => setNewDayForm({ ...newDayForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="例：自由探索"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">顏色</label>
                <select
                  value={newDayForm.theme}
                  onChange={(e) => setNewDayForm({ ...newDayForm, theme: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {themeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsAddingDay(false)}
                  className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={addNewDay}
                  className="flex-1 px-4 py-2 text-white bg-green-500 hover:bg-green-600 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  新增
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Event Modal */}
      {isAddingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">新增事件</h3>
              <button
                onClick={() => setIsAddingEvent(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">時間</label>
                <input
                  type="text"
                  value={newEventForm.time}
                  onChange={(e) => setNewEventForm({ ...newEventForm, time: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：10:00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">標題</label>
                <input
                  type="text"
                  value={newEventForm.title}
                  onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="活動標題"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">描述</label>
                <textarea
                  value={newEventForm.desc}
                  onChange={(e) => setNewEventForm({ ...newEventForm, desc: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="3"
                  placeholder="活動描述"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">類型</label>
                <select
                  value={newEventForm.type}
                  onChange={(e) => setNewEventForm({ ...newEventForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {typeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsAddingEvent(false)}
                  className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={addNewEvent}
                  className="flex-1 px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  新增
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default TokyoTrip;