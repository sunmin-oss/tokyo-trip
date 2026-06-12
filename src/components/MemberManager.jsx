import React, { useState } from 'react';
import { Plus, X, Edit2, Save, Users, Mail, User } from 'lucide-react';

/**
 * MemberManager - 成員名單管理面板
 */
export const MemberManager = ({ members, onAddMember, onUpdateMember, onRemoveMember }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', note: '' });

  const resetForm = () => {
    setForm({ name: '', email: '', note: '' });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!form.name.trim()) return;
    onAddMember({ name: form.name.trim(), email: form.email.trim(), note: form.note.trim() });
    resetForm();
  };

  const handleStartEdit = (member) => {
    setEditingId(member.id);
    setForm({ name: member.name, email: member.email || '', note: member.note || '' });
  };

  const handleSaveEdit = () => {
    if (!form.name.trim()) return;
    onUpdateMember(editingId, { name: form.name.trim(), email: form.email.trim(), note: form.note.trim() });
    resetForm();
  };

  // 取得名字首字作為頭像
  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  const avatarColors = [
    'bg-blue-500', 'bg-pink-500', 'bg-green-500', 'bg-purple-500',
    'bg-amber-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
    'bg-cyan-500', 'bg-red-500', 'bg-sky-500'
  ];

  return (
    <div>
      {/* 成員列表 */}
      {members.length > 0 ? (
        <div className="space-y-2 mb-4">
          {members.map((member, idx) => {
            const isEditing = editingId === member.id;
            const avatarColor = avatarColors[idx % avatarColors.length];

            if (isEditing) {
              return (
                <div key={member.id} className="p-3 rounded-xl border-2 border-blue-300 bg-blue-50 space-y-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">姓名 *</label>
                    <input type="text" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" autoFocus />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="example@gmail.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">備註</label>
                    <input type="text" value={form.note} onChange={(e) => setForm(prev => ({ ...prev, note: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="例：負責攝影" />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={resetForm} className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg transition">取消</button>
                    <button onClick={handleSaveEdit} className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition flex items-center gap-1">
                      <Save className="w-3 h-3" /> 儲存
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition">
                <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {getInitial(member.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{member.name}</div>
                  {member.email && (
                    <div className="text-xs text-slate-400 truncate flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {member.email}
                    </div>
                  )}
                  {member.note && (
                    <div className="text-xs text-slate-400 truncate">{member.note}</div>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handleStartEdit(member)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition" title="編輯">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onRemoveMember(member.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="移除">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-400 text-center py-4 mb-4">尚未新增成員</p>
      )}

      {/* 新增成員表單 */}
      {showAddForm ? (
        <div className="p-3 rounded-xl border-2 border-dashed border-green-300 bg-green-50 space-y-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">姓名 *</label>
            <input type="text" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="成員姓名" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="example@gmail.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">備註</label>
            <input type="text" value={form.note} onChange={(e) => setForm(prev => ({ ...prev, note: e.target.value }))}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="例：負責攝影" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={resetForm} className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg transition">取消</button>
            <button onClick={handleAdd} disabled={!form.name.trim()}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 disabled:bg-slate-300 rounded-lg transition flex items-center gap-1">
              <Plus className="w-3 h-3" /> 新增
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => { resetForm(); setShowAddForm(true); }}
          className="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm font-semibold text-slate-500 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition flex items-center justify-center gap-1.5">
          <Plus className="w-4 h-4" /> 新增成員
        </button>
      )}
    </div>
  );
};

/**
 * MemberSelector - 事件成員選擇器（多選）
 */
export const MemberSelector = ({ members, selectedMemberIds = [], onChangeMembers }) => {
  if (!members || members.length === 0) return null;

  const toggleMember = (memberId) => {
    if (selectedMemberIds.includes(memberId)) {
      onChangeMembers(selectedMemberIds.filter(id => id !== memberId));
    } else {
      onChangeMembers([...selectedMemberIds, memberId]);
    }
  };

  const selectAll = () => onChangeMembers(members.map(m => m.id));
  const selectNone = () => onChangeMembers([]);

  const avatarColors = [
    'bg-blue-500', 'bg-pink-500', 'bg-green-500', 'bg-purple-500',
    'bg-amber-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
    'bg-cyan-500', 'bg-red-500', 'bg-sky-500'
  ];

  const allSelected = selectedMemberIds.length === members.length;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
          <Users className="w-4 h-4" /> 參加成員
        </h4>
        <button onClick={allSelected ? selectNone : selectAll}
          className="text-xs text-blue-500 hover:text-blue-600 font-medium">
          {allSelected ? '取消全選' : '全選'}
        </button>
      </div>
      <div className="space-y-1.5">
        {members.map((member, idx) => {
          const isSelected = selectedMemberIds.includes(member.id);
          const avatarColor = avatarColors[idx % avatarColors.length];
          return (
            <label key={member.id}
              className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition ${isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'}`}>
              <input type="checkbox" checked={isSelected} onChange={() => toggleMember(member.id)}
                className="w-4 h-4 rounded text-blue-500 cursor-pointer" />
              <div className={`w-6 h-6 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-slate-700">{member.name}</span>
                {member.note && <span className="text-xs text-slate-400 ml-1.5">({member.note})</span>}
              </div>
            </label>
          );
        })}
      </div>
      {selectedMemberIds.length === 0 && (
        <p className="text-xs text-slate-400 italic mt-2">未選擇 = 全員參加</p>
      )}
    </div>
  );
};

export default MemberManager;
