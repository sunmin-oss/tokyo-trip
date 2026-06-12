import React, { useState } from 'react';
import { Plus, X, Edit2, Save, Users, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { getColorClasses } from '../utils/dataTransform';

const availableColors = [
  'pink', 'sky', 'amber', 'purple', 'indigo', 'teal', 'cyan', 'rose', 'green', 'red', 'blue'
];

/**
 * GroupManagementPanel 組件
 * 
 * 用於管理組別：名稱、顏色、成員
 */
export const GroupManagementPanel = ({
  groups,
  onAddGroup,
  onUpdateGroup,
  onRemoveGroup
}) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('pink');
  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', color: '' });
  const [newMemberName, setNewMemberName] = useState('');

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    onAddGroup({ name: newGroupName, color: newGroupColor, members: [] });
    setNewGroupName('');
    setNewGroupColor(availableColors[(groups.length + 1) % availableColors.length]);
  };

  const handleStartEdit = (group) => {
    setEditingGroupId(group.id);
    setEditForm({ name: group.name, color: group.color });
  };

  const handleSaveEdit = () => {
    if (!editForm.name.trim()) return;
    onUpdateGroup(editingGroupId, { name: editForm.name, color: editForm.color });
    setEditingGroupId(null);
    setEditForm({ name: '', color: '' });
  };

  const handleAddMember = (groupId) => {
    if (!newMemberName.trim()) return;
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const members = [...(group.members || []), newMemberName.trim()];
    onUpdateGroup(groupId, { members });
    setNewMemberName('');
  };

  const handleRemoveMember = (groupId, memberIndex) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const members = [...(group.members || [])];
    members.splice(memberIndex, 1);
    onUpdateGroup(groupId, { members });
  };

  const toggleExpand = (groupId) => {
    setExpandedGroupId(prev => prev === groupId ? null : groupId);
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5" /> 組別管理
      </h3>

      {/* 現有組別列表 */}
      {groups.length > 0 && (
        <div className="space-y-3 mb-4">
          {groups.map((group) => {
            const colorClasses = getColorClasses(group.color);
            const isEditing = editingGroupId === group.id;
            const isExpanded = expandedGroupId === group.id;
            const members = group.members || [];

            return (
              <div key={group.id} className={`rounded-xl border-2 ${colorClasses.border} overflow-hidden`}>
                {/* 組別標頭 */}
                <div className={`flex items-center justify-between p-3 ${colorClasses.bg}`}>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${colorClasses.badge}`} />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm min-w-0"
                        autoFocus
                      />
                    ) : (
                      <span className={`font-semibold text-sm ${colorClasses.text} truncate`}>
                        {group.name}
                      </span>
                    )}
                    {members.length > 0 && !isEditing && (
                      <span className="text-xs text-slate-400 flex-shrink-0">({members.length}人)</span>
                    )}
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    {isEditing ? (
                      <>
                        <button onClick={handleSaveEdit}
                          className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition" title="儲存">
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingGroupId(null)}
                          className="p-1.5 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition" title="取消">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => toggleExpand(group.id)}
                          className="p-1 text-slate-500 hover:text-slate-700 transition" title="展開/收合">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleStartEdit(group)}
                          className="p-1 text-slate-500 hover:text-slate-700 transition" title="編輯">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => onRemoveGroup(group.id)}
                          className="p-1 text-slate-500 hover:text-red-600 transition" title="刪除">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 編輯模式：顏色選擇 */}
                {isEditing && (
                  <div className="px-3 py-2 bg-slate-50 border-t border-slate-200">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">顏色</label>
                    <div className="flex flex-wrap gap-1.5">
                      {availableColors.map(c => {
                        const cc = getColorClasses(c);
                        return (
                          <button key={c} onClick={() => setEditForm(prev => ({ ...prev, color: c }))}
                            className={`w-7 h-7 rounded-full ${cc.badge} transition-all ${editForm.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-110'}`}
                            title={c} />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 展開區域：成員列表 */}
                {isExpanded && !isEditing && (
                  <div className="px-3 py-2 bg-white border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-600 mb-2">成員</p>
                    {members.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {members.map((member, mi) => (
                          <span key={mi} className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${colorClasses.bg} ${colorClasses.text}`}>
                            {member}
                            <button onClick={() => handleRemoveMember(group.id, mi)}
                              className="hover:text-red-600 transition ml-0.5">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic mb-2">尚未新增成員</p>
                    )}
                    <div className="flex gap-1.5">
                      <input type="text" value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddMember(group.id)}
                        placeholder="輸入成員名稱"
                        className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                      <button onClick={() => handleAddMember(group.id)}
                        disabled={!newMemberName.trim()}
                        className="px-2 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1">
                        <UserPlus className="w-3 h-3" /> 新增
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 新增組別表單 */}
      <div className="border border-dashed border-slate-300 rounded-xl p-3">
        <p className="text-xs font-semibold text-slate-500 mb-2">新增組別</p>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
            placeholder="組別名稱（例：攝影組）"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleAddGroup}
            disabled={!newGroupName.trim()}
            className="px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white rounded-lg text-sm font-semibold transition flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> 新增
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {availableColors.map(c => {
            const cc = getColorClasses(c);
            return (
              <button key={c} onClick={() => setNewGroupColor(c)}
                className={`w-6 h-6 rounded-full ${cc.badge} transition-all ${newGroupColor === c ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : 'hover:scale-105'}`}
                title={c} />
            );
          })}
        </div>
      </div>

      {groups.length === 0 && (
        <p className="text-xs text-slate-400 italic mt-2">尚未新增組別</p>
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
          const colorClasses = getColorClasses(group.color);
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
                <div>
                  <span className={`font-semibold text-sm ${colorClasses.text}`}>
                    {group.name}
                  </span>
                  {group.members && group.members.length > 0 && (
                    <span className="text-xs text-slate-400 ml-1">({group.members.join('、')})</span>
                  )}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default GroupManagementPanel;
