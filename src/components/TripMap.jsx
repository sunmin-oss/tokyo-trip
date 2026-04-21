import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader, Navigation, AlertCircle } from 'lucide-react';

// Fix Leaflet default marker icon missing in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Colored marker icons via SVG data URI
const createColoredIcon = (color) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41">
    <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 2.4.7 4.6 1.9 6.5L12.5 41l10.6-22C24.3 17.1 25 14.9 25 12.5 25 5.6 19.4 0 12.5 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12.5" cy="12.5" r="5" fill="#fff"/>
  </svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
  });
};

const themeToColor = {
  'bg-blue-500': '#3b82f6', 'bg-red-500': '#ef4444', 'bg-green-500': '#22c55e',
  'bg-yellow-500': '#eab308', 'bg-purple-500': '#a855f7', 'bg-orange-500': '#f97316',
  'bg-indigo-500': '#6366f1', 'bg-teal-500': '#14b8a6', 'bg-cyan-500': '#06b6d4',
  'bg-pink-500': '#ec4899', 'bg-emerald-500': '#10b981',
};

const typeEmojis = {
  transport: '🚃', food: '🍜', shopping: '🛍️', sight: '📍', fun: '🎮', stay: '🏠',
};

// Geocode cache persisted in sessionStorage
const CACHE_KEY = 'tripmap_geocode_cache';
const getCache = () => {
  try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
};
const setCache = (cache) => {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch { /* ignore */ }
};

// Throttled Nominatim geocoder (1 request per second, free, no API key)
const geocodeQueue = [];
let processing = false;

const processQueue = async () => {
  if (processing || geocodeQueue.length === 0) return;
  processing = true;
  while (geocodeQueue.length > 0) {
    const { location, resolve } = geocodeQueue.shift();
    const cache = getCache();
    if (cache[location]) { resolve(cache[location]); continue; }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'zh-TW,ja,en' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name };
        cache[location] = coords;
        setCache(cache);
        resolve(coords);
      } else {
        cache[location] = null;
        setCache(cache);
        resolve(null);
      }
    } catch {
      resolve(null);
    }
    // Rate limit: 1 req/sec
    if (geocodeQueue.length > 0) await new Promise(r => setTimeout(r, 1100));
  }
  processing = false;
};

const geocode = (location) => {
  const cache = getCache();
  if (cache[location] !== undefined) return Promise.resolve(cache[location]);
  return new Promise((resolve) => {
    geocodeQueue.push({ location, resolve });
    processQueue();
  });
};

// Sub-component to auto-fit bounds
const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 15);
    } else {
      map.fitBounds(L.latLngBounds(positions), { padding: [40, 40], maxZoom: 15 });
    }
  }, [map, positions]);
  return null;
};

/**
 * TripMap - Interactive Leaflet map for trip events
 * Props: schedule, activeDay (1-indexed), currency symbol (sym)
 */
const TripMap = ({ schedule, activeDay, sym }) => {
  const [dayFilter, setDayFilter] = useState('current'); // 'current' | 'all' | day number
  const [geocoded, setGeocoded] = useState([]); // { lat, lng, event, day, color }
  const [loading, setLoading] = useState(false);
  const [failedLocations, setFailedLocations] = useState([]);

  // Collect events with locations based on filter
  const eventsWithLocation = useMemo(() => {
    const result = [];
    const days = dayFilter === 'all' ? schedule : dayFilter === 'current'
      ? schedule.filter(d => d.day === activeDay) : schedule.filter(d => d.day === dayFilter);
    days.forEach(day => {
      (day.events || []).forEach((evt, idx) => {
        if (evt.location) {
          result.push({ ...evt, _dayNumber: day.day, _dayTheme: day.theme, _dayTitle: day.title, _eventIndex: idx });
        }
      });
    });
    return result;
  }, [schedule, activeDay, dayFilter]);

  // Geocode all events
  useEffect(() => {
    if (eventsWithLocation.length === 0) {
      queueMicrotask(() => { setGeocoded([]); setFailedLocations([]); });
      return;
    }
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) setLoading(true); });
    const run = async () => {
      const results = [];
      const failed = [];
      for (const evt of eventsWithLocation) {
        if (cancelled) return;
        const coords = await geocode(evt.location);
        if (coords) {
          results.push({
            lat: coords.lat, lng: coords.lng,
            event: evt,
            color: themeToColor[evt._dayTheme] || '#3b82f6',
          });
        } else {
          failed.push(evt.location);
        }
      }
      if (!cancelled) { setGeocoded(results); setFailedLocations(failed); setLoading(false); }
    };
    run();
    return () => { cancelled = true; };
  }, [eventsWithLocation]);

  const positions = geocoded.map(g => [g.lat, g.lng]);

  return (
    <div className="animate-fade-in space-y-4">
      {/* Day filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-slate-700">顯示範圍：</span>
        <button onClick={() => setDayFilter('current')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${dayFilter === 'current' ? 'bg-blue-500 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
          當天 (Day {activeDay})
        </button>
        <button onClick={() => setDayFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${dayFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
          全部日程
        </button>
        {schedule.length > 1 && schedule.map(day => (
          <button key={day.day} onClick={() => setDayFilter(day.day)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${dayFilter === day.day ? `${day.theme} text-white` : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
            Day {day.day}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative" style={{ height: '450px' }}>
        {loading && (
          <div className="absolute inset-0 bg-white/80 z-[1000] flex items-center justify-center">
            <div className="flex items-center gap-2 text-slate-600">
              <Loader className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">定位景點中...</span>
            </div>
          </div>
        )}
        {eventsWithLocation.length === 0 && !loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-[1000]">
            <div className="text-center text-slate-400">
              <Navigation className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="font-semibold">沒有包含地點的事件</p>
              <p className="text-xs mt-1">在事件中填寫地點名稱即可顯示於地圖</p>
            </div>
          </div>
        ) : null}
        <MapContainer
          center={[35.6762, 139.6503]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {positions.length > 0 && <FitBounds positions={positions} />}
          {/* Route polyline */}
          {positions.length > 1 && (
            <Polyline
              positions={positions}
              color="#3b82f6"
              weight={3}
              opacity={0.6}
              dashArray="8, 8"
            />
          )}
          {/* Markers */}
          {geocoded.map((g, idx) => (
            <Marker key={`${g.event._dayNumber}-${g.event._eventIndex}-${idx}`}
              position={[g.lat, g.lng]}
              icon={createColoredIcon(g.color)}>
              <Popup>
                <div className="min-w-[180px]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-lg">{typeEmojis[g.event.type] || '📍'}</span>
                    <strong className="text-sm">{g.event.title}</strong>
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <p>🕐 {g.event.time} · Day {g.event._dayNumber}</p>
                    {g.event.desc && <p>{g.event.desc}</p>}
                    {g.event.cost > 0 && <p>💰 {sym}{g.event.cost.toLocaleString()}</p>}
                    <p className="text-gray-400 mt-1">📍 {g.event.location}</p>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                    <span className="text-[10px] text-gray-400">{g.event._dayTitle}</span>
                    <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 rounded font-semibold ml-auto">#{idx + 1}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Failed locations warning */}
      {failedLocations.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-700">以下地點無法定位：</p>
            <p className="text-amber-600 text-xs mt-1">{failedLocations.join('、')}</p>
            <p className="text-amber-500 text-xs mt-1">建議使用更具體的地點名稱（如「東京鐵塔」→「Tokyo Tower」）</p>
          </div>
        </div>
      )}

      {/* Legend */}
      {geocoded.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <h4 className="text-sm font-bold text-slate-700 mb-2">景點路線</h4>
          <div className="space-y-1.5">
            {geocoded.map((g, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold" style={{ backgroundColor: g.color }}>
                  {idx + 1}
                </span>
                <span className="text-slate-600">{g.event.time}</span>
                <span className="font-semibold text-slate-800">{g.event.title}</span>
                <span className="text-slate-400 ml-auto">{g.event.location}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TripMap;
