import React from 'react';
import {
  Plus,
  Trash2,
  CheckSquare,
  Square,
  PackageCheck,
} from 'lucide-react';

const DEFAULT_PACKING_ITEMS = [
  '護照', '身分證', '機票/電子票', '手機 & 充電線', '行動電源', '轉接頭',
  '現金', '信用卡', '換洗衣物', '盥洗用品', '雨具', '藥品', 'Wi-Fi 分享器',
];

/**
 * PackingTab
 * 打包清單分頁。狀態由父層管理（受控元件）。
 */
const PackingTab = ({
  packingItems,
  setPackingItems,
  newPackingItem,
  setNewPackingItem,
}) => {
  const addPackingItem = (text) => {
    if (!text.trim()) return;
    setPackingItems((prev) => [
      ...prev,
      { id: Date.now(), text: text.trim(), checked: false },
    ]);
    setNewPackingItem('');
  };

  const togglePackingItem = (id) => {
    setPackingItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const deletePackingItem = (id) => {
    setPackingItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addDefaultItems = () => {
    const existing = new Set(packingItems.map((i) => i.text));
    const additions = DEFAULT_PACKING_ITEMS
      .filter((t) => !existing.has(t))
      .map((text, i) => ({ id: Date.now() + i, text, checked: false }));
    setPackingItems((prev) => [...prev, ...additions]);
  };

  const checkedCount = packingItems.filter((i) => i.checked).length;
  const progress = packingItems.length > 0
    ? (checkedCount / packingItems.length) * 100
    : 0;

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <PackageCheck className="w-5 h-5 text-amber-500" /> 打包清單
        </h3>
        <span className="text-sm text-slate-400">
          {checkedCount}/{packingItems.length} 已完成
        </span>
      </div>

      {packingItems.length > 0 && (
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className="h-3 rounded-full bg-amber-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newPackingItem}
          onChange={(e) => setNewPackingItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addPackingItem(newPackingItem)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
          placeholder="新增打包物品..."
          aria-label="新增打包物品"
        />
        <button
          onClick={() => addPackingItem(newPackingItem)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-sm transition-colors"
          aria-label="送出新增"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {packingItems.length === 0 && (
        <button
          onClick={addDefaultItems}
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-amber-400 hover:text-amber-600 transition-colors text-sm font-semibold"
        >
          一鍵加入常用物品（護照、充電線、藥品…）
        </button>
      )}

      <div className="space-y-2">
        {packingItems.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 bg-white rounded-xl px-4 py-3 border shadow-sm transition-all ${
              item.checked
                ? 'border-emerald-200 bg-emerald-50/50'
                : 'border-slate-200'
            }`}
          >
            <button
              onClick={() => togglePackingItem(item.id)}
              className="flex-shrink-0"
              aria-label={item.checked ? '取消勾選' : '勾選完成'}
            >
              {item.checked ? (
                <CheckSquare className="w-5 h-5 text-emerald-500" />
              ) : (
                <Square className="w-5 h-5 text-slate-300 hover:text-slate-500" />
              )}
            </button>
            <span
              className={`flex-1 text-sm ${
                item.checked
                  ? 'line-through text-slate-400'
                  : 'text-slate-700'
              }`}
            >
              {item.text}
            </span>
            <button
              onClick={() => deletePackingItem(item.id)}
              className="p-1 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
              aria-label="刪除物品"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {packingItems.length > 0 &&
        packingItems.length < DEFAULT_PACKING_ITEMS.length && (
          <button
            onClick={addDefaultItems}
            className="text-sm text-amber-500 hover:text-amber-600 font-semibold transition-colors"
          >
            + 補充常用物品
          </button>
        )}
    </div>
  );
};

export default PackingTab;
