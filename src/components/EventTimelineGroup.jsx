import React from 'react';
import { MapPin, Edit2, Trash2, DollarSign } from 'lucide-react';
import { formatCost, formatBaseHint } from '../services/exchangeRate';
import {
  getGridColsClass
} from '../utils/dataTransform';

/**
 * EventTimelineGroup 組件
 * 時間軸統一在左側，事件卡片在右側
 */
export const EventTimelineGroup = ({
  timeEvent,
  onEditEvent,
  onDeleteEvent,
  openMap,
  currency,
  exchangeRates,
  members
}) => {
  const events = timeEvent.allGroupsEvents || [];

  return (
    <div className="flex">
      {/* 左側時間軸 */}
      <div className="w-16 flex-shrink-0 flex flex-col items-center pt-1">
        <span className="text-sm font-bold text-slate-600 whitespace-nowrap">
          {timeEvent.time}
        </span>
        <div className="w-0.5 bg-slate-200 flex-1 min-h-[24px] mt-1 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
        </div>
        {timeEvent.endTime && (
          <span className="text-xs text-slate-400 font-medium mt-0.5">
            {timeEvent.endTime}
          </span>
        )}
      </div>

      {/* 右側事件內容 */}
      <div className="flex-1 pb-2 space-y-3">
        {events.length > 1 ? (
          <div className={`grid ${getGridColsClass(events.length)} gap-3`}>
            {events.map((event, idx) => (
              <EventCard
                key={`evt-${idx}`}
                event={event}
                onEdit={() => onEditEvent(event)}
                onDelete={() => onDeleteEvent(event)}
                openMap={openMap}
                currency={currency}
                exchangeRates={exchangeRates}
                members={members}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event, idx) => (
              <EventCard
                key={`evt-${idx}`}
                event={event}
                onEdit={() => onEditEvent(event)}
                onDelete={() => onDeleteEvent(event)}
                openMap={openMap}
                currency={currency}
                exchangeRates={exchangeRates}
                members={members}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * EventCard 組件 - 單個事件的卡片展示
 */
const EventCard = ({
  event,
  onEdit,
  onDelete,
  openMap,
  currency,
  exchangeRates,
  members = []
}) => {
  return (
    <div className="p-3 rounded-xl shadow-sm hover:shadow-md transition-all bg-white border border-slate-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-bold text-sm mb-1 text-slate-800">
            {event.title}
          </h4>
          {event.endTime && (
            <p className="text-xs text-slate-400 mb-1">⏱ {event.time} ~ {event.endTime}</p>
          )}
          {event.description && (
            <p className="text-xs text-slate-500 mb-2">{event.description}</p>
          )}
          
          {event.location && (
            <button
              onClick={() => openMap(event.location)}
              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
            >
              <MapPin className="w-3 h-3" />
              查看地圖
            </button>
          )}
          {event.cost > 0 && (
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded ml-1">
              <DollarSign className="w-3 h-3" />
              {formatCost(event.cost, currency, exchangeRates)}
              {formatBaseHint(event.cost, currency) && (
                <span className="ml-1 text-slate-400 font-normal">{formatBaseHint(event.cost, currency)}</span>
              )}
            </span>
          )}
          {event.assignees && event.assignees.length > 0 && members.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {event.assignees.map(mid => {
                const m = members.find(mm => mm.id === mid);
                return m ? (
                  <span key={mid} className="inline-flex items-center text-xs font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-full">
                    {m.name}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>

        <div className="flex gap-1 ml-2">
          <button onClick={onEdit}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors" title="編輯">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete}
            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="刪除">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventTimelineGroup;
