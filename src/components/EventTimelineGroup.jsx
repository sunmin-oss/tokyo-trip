import React from 'react';
import { MapPin, ExternalLink, Edit2, Trash2 } from 'lucide-react';
import {
  getColorClasses,
  hasGroupedEvents,
  hasAllGroupsEvents,
  getGridColsClass
} from '../utils/dataTransform';

/**
 * EventTimelineGroup 組件
 * 
 * 用於顯示「同一時段的事件」，支持：
 * 1. 全員事件（佔滿整行）
 * 2. 分組事件（並排顯示）
 */
export const EventTimelineGroup = ({
  timeEvent,
  groupCount,
  onEditEvent,
  onDeleteEvent,
  openMap
}) => {
  const hasAllGroups = hasAllGroupsEvents(timeEvent);
  const hasGrouped = hasGroupedEvents(timeEvent);
  
  return (
    <div className="relative">
      {/* 時間標籤 */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-3 z-20">
        <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
          {timeEvent.time}
        </span>
      </div>

      <div className="pt-4 space-y-4">
        {/* 全員事件區域 - 佔滿整行 */}
        {hasAllGroups && (
          <div className="col-span-full space-y-2">
            {timeEvent.allGroupsEvents.map((event, idx) => (
              <EventCard
                key={`all-${idx}`}
                event={event}
                isAllGroups={true}
                onEdit={() => onEditEvent(event)}
                onDelete={() => onDeleteEvent(event.id)}
                openMap={openMap}
              />
            ))}
          </div>
        )}

        {/* 分組事件區域 - 按組別並排顯示 */}
        {hasGrouped && (
          <div className={`grid ${getGridColsClass(timeEvent.groupLayout.length)} gap-3`}>
            {timeEvent.groupLayout.map((groupColumn) => (
              <div key={groupColumn.groupId} className="space-y-2">
                {/* 組別標籤 */}
                <div className={`
                  text-center text-xs font-bold px-2 py-1 rounded-lg
                  ${getColorClasses(groupColumn.color).bg}
                  ${getColorClasses(groupColumn.color).text}
                  border-2 ${getColorClasses(groupColumn.color).border}
                `}>
                  {groupColumn.groupName}
                </div>

                {/* 該組別在此時段的事件 */}
                {groupColumn.events.map((event, idx) => (
                  <EventCard
                    key={`${groupColumn.groupId}-${idx}`}
                    event={event}
                    groupColor={groupColumn.color}
                    isGroupedEvent={true}
                    onEdit={() => onEditEvent(event)}
                    onDelete={() => onDeleteEvent(event.id)}
                    openMap={openMap}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * EventCard 組件
 * 
 * 單個事件的卡片展示
 */
const EventCard = ({
  event,
  isAllGroups = false,
  isGroupedEvent = false,
  groupColor,
  onEdit,
  onDelete,
  openMap
}) => {
  const colorClasses = isGroupedEvent ? getColorClasses(groupColor) : {
    bg: 'bg-white',
    border: 'border-l-4 border-blue-400',
    text: 'text-slate-800'
  };

  return (
    <div className={`
      p-3 rounded-xl shadow-sm hover:shadow-md transition-all
      ${colorClasses.bg}
      ${isGroupedEvent ? `border-l-4 ${colorClasses.border}` : 'border border-slate-100'}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className={`font-bold text-sm mb-1 ${colorClasses.text}`}>
            {event.title}
          </h4>
          {event.description && (
            <p className="text-xs text-slate-500 mb-2">{event.description}</p>
          )}
          
          {/* 位置按鈕 */}
          {event.location && (
            <button
              onClick={() => openMap(event.location)}
              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
            >
              <MapPin className="w-3 h-3" />
              查看地圖
            </button>
          )}
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-1 ml-2">
          <button
            onClick={onEdit}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
            title="編輯"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="刪除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventTimelineGroup;
