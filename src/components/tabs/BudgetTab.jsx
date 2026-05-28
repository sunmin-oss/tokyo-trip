import React, { useMemo } from 'react';
import {
  BASE_CURRENCY,
  formatCost,
  formatBaseHint,
} from '../../services/exchangeRate';

const TYPE_META = {
  transport: { emoji: '🚃', name: '交通' },
  food: { emoji: '🍜', name: '食物' },
  shopping: { emoji: '🛍️', name: '購物' },
  sight: { emoji: '📍', name: '景點' },
  fun: { emoji: '🎮', name: '娛樂' },
  stay: { emoji: '🏠', name: '住宿' },
};

/**
 * BudgetTab
 * 以 BASE_CURRENCY (JPY) 為基準的花費總覽分頁。
 * 顯示時依使用者選擇的幣別即時換算。
 */
const BudgetTab = ({ schedule, currency, onChangeCurrency, exchangeRates }) => {
  // 每日花費（以 base 計）
  const dayCosts = useMemo(
    () =>
      schedule.map((day) => ({
        day,
        cost: (day.events || []).reduce((sum, e) => sum + (e.cost || 0), 0),
      })),
    [schedule]
  );

  // 全程總花費
  const tripCost = useMemo(
    () => dayCosts.reduce((s, d) => s + d.cost, 0),
    [dayCosts]
  );

  // 分類花費
  const costByType = useMemo(() => {
    const map = {};
    schedule.forEach((day) =>
      day.events?.forEach((e) => {
        if (e.cost > 0) map[e.type] = (map[e.type] || 0) + e.cost;
      })
    );
    return map;
  }, [schedule]);

  const eventCount = useMemo(
    () => schedule.reduce((s, d) => s + (d.events?.length || 0), 0),
    [schedule]
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <label className="text-sm font-semibold text-slate-700">幣別</label>
        <select
          value={currency}
          onChange={(e) => onChangeCurrency(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="JPY">¥ JPY 日圓</option>
          <option value="TWD">NT$ TWD 台幣</option>
          <option value="USD">$ USD 美元</option>
          <option value="EUR">€ EUR 歐元</option>
          <option value="KRW">₩ KRW 韓圓</option>
        </select>
        <span className="text-xs text-slate-400">
          基準幣別：{BASE_CURRENCY}
        </span>
      </div>

      {/* Trip Total */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg">
        <p className="text-emerald-100 text-sm font-medium mb-1">全程總花費</p>
        <p className="text-4xl font-extrabold">
          {formatCost(tripCost, currency, exchangeRates)}
        </p>
        {formatBaseHint(tripCost, currency) && (
          <p className="text-emerald-100 text-sm mt-1 font-medium">
            {formatBaseHint(tripCost, currency)}
          </p>
        )}
        <p className="text-emerald-100 text-xs mt-2">
          {schedule.length} 天 · {eventCount} 個事件
        </p>
      </div>

      {/* Per Day */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-800">每日花費</h3>
        {dayCosts.map(({ day, cost }) => {
          const pct = tripCost > 0 ? (cost / tripCost) * 100 : 0;
          return (
            <div
              key={day.day}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${day.theme}`} />
                  <span className="font-semibold text-sm text-slate-800">
                    Day {day.day} · {day.title}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600">
                    {formatCost(cost, currency, exchangeRates)}
                  </span>
                  {formatBaseHint(cost, currency) && (
                    <span className="block text-xs text-slate-400">
                      {formatBaseHint(cost, currency)}
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${day.theme} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Per Type */}
      {Object.keys(costByType).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-800">分類花費</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(costByType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, cost]) => {
                const meta = TYPE_META[type] || { emoji: '📦', name: type };
                return (
                  <div
                    key={type}
                    className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm text-center"
                  >
                    <p className="text-2xl mb-1">{meta.emoji}</p>
                    <p className="text-xs text-slate-500 mb-1">{meta.name}</p>
                    <p className="font-bold text-slate-800">
                      {formatCost(cost, currency, exchangeRates)}
                    </p>
                    {formatBaseHint(cost, currency) && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatBaseHint(cost, currency)}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetTab;
