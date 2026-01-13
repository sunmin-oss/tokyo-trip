import React, { useState } from 'react';
import { Plus, X, Edit2 } from 'lucide-react';
import { getColorClasses } from '../utils/dataTransform';

/**
 * GroupManagementPanel 組件
 * 
 * 用於在新增/編輯日程時，動態新增、編輯、刪除組別
 */
export const GroupManagementPanel = ({
  groups,
  onAddGroup,
  onUpdateGroup,
  onRemoveGroup
}) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const availableColors = [
    'pink', 'sky', 'amber', 'purple', 'indigo', 'teal', 'cyan', 'rose', 'green', 'red', 'blue'
  ];

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;

    const color = availableColors[groups.length % availableColors.length];
    onAddGroup({
      name: newGroupName,
      color
    });

    setNewGroupName('');
  };

  const handleStartEdit = (group) => {
    setEditingGroupId(group.id);
    setEditingName(group.name);
  };

  const handleSaveEdit = () => {
    if (!editingName.trim()) return;

    onUpdateGroup(editingGroupId, {
      name: editingName
    });

    setEditingGroupId(null);
    setEditingName('');
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200">
      <h3 className="font-bold text-slate-800 mb-4">組別管理</h3>

      {/* 現有組別列表 */}
      {groups.length > 0 && (
        <div className="space-y-2 mb-4">
          {groups.map((group) => {
            const colorClasses = getColorClasses(group.color);
            const isEditing = editingGroupId === group.id;

            return (
              <div
                key={group.id}
                className={`
                  flex items-center justify-between p-3 rounded-lg
                  ${colorClasses.bg} border-2 ${colorClasses.border}
                `}
              >
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-3 h-3 rounded-full ${colorClasses.badge}`}
                  />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className={`font-semibold text-sm ${colorClasses.text}`}>
                      {group.name}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveEdit}
                        className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition"
                      >
                        儲存
                      </button>
                      <button
                        onClick={() => setEditingGroupId(null)}
                        className="px-2 py-1 bg-slate-300 text-slate-700 text-xs rounded hover:bg-slate-400 transition"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStartEdit(group)}
                        className="p-1 text-slate-500 hover:text-slate-700"
                        title="編輯"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRemoveGroup(group.id)}
                        className="p-1 text-slate-500 hover:text-red-600"
                        title="移除"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 新增組別表單 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddGroup()}
          placeholder="輸入組別名稱（例：攝影組）"
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={handleAddGroup}
          disabled={!newGroupName.trim()}
          className="px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white rounded-lg text-sm font-semibold transition flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          新增
        </button>
      </div>

      {groups.length === 0 && (
        <p className="text-xs text-slate-500 italic">尚未新增組別</p>
      )}
    </div>
  );
};

/**
 * GroupSelector 組件
 * 
 * 用於在新增事件時，選擇該事件屬於哪個組別（或全員）
 */
export const GroupSelector = ({
  groups,
  selectedGroupId,
  onSelectGroup
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200">
      <h4 className="font-semibold text-slate-800 mb-3 text-sm">分配到組別</h4>

      <div className="space-y-2">
        {/* 全員選項 */}
        <label className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
          <input
            type="radio"
            name="group-selection"
            value="all"
            checked={selectedGroupId === null || selectedGroupId === undefined}
            onChange={() => onSelectGroup(null)}
            className="w-4 h-4 text-green-500 cursor-pointer"
          />
          <div>
            <div className="font-semibold text-sm text-slate-700">全員參加</div>
            <div className="text-xs text-slate-500">此時段對所有組別開放</div>
          </div>
        </label>

        {/* 分組選項 */}
        {groups.map((group) => {
          const colorClasses = require('../utils/dataTransform').getColorClasses(group.color);
          const isSelected = selectedGroupId === group.id;

          return (
            <label
              key={group.id}
              className={`
                flex items-center gap-3 p-2 rounded cursor-pointer transition
                ${isSelected ? `${colorClasses.bg} border-2 ${colorClasses.border}` : 'hover:bg-slate-50'}
              `}
            >
              <input
                type="radio"
                name="group-selection"
                value={group.id}
                checked={isSelected}
                onChange={() => onSelectGroup(group.id)}
                className="w-4 h-4 cursor-pointer"
              />
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${colorClasses.badge}`} />
                <span className={`font-semibold text-sm ${colorClasses.text}`}>
                  {group.name}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default GroupManagementPanel;
