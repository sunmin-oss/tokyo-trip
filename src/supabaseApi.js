import { supabase, isSupabaseConfigured } from './supabaseClient';

// ==================== TRIPS 表操作 ====================

/**
 * 創建新的行程
 */
export const createTrip = async (tripData) => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase 未配置，只在本地存儲');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('trips')
      .insert([tripData])
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error('創建行程失敗:', error.message);
    return null;
  }
};

/**
 * 獲取所有行程
 */
export const fetchTrips = async () => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase 未配置');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('獲取行程失敗:', error.message);
    return [];
  }
};

/**
 * 獲取單個行程及其所有日程和事件
 */
export const fetchTripWithDetails = async (tripId) => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase 未配置');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        schedules (
          *,
          events (*)
        )
      `)
      .eq('id', tripId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('獲取行程詳情失敗:', error.message);
    return null;
  }
};

/**
 * 更新行程
 */
export const updateTrip = async (tripId, updates) => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase 未配置');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('trips')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', tripId)
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error('更新行程失敗:', error.message);
    return null;
  }
};

// ==================== SCHEDULES 表操作 ====================

/**
 * 創建新的日程
 */
export const createSchedule = async (scheduleData) => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase 未配置');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('schedules')
      .insert([scheduleData])
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error('創建日程失敗:', error.message);
    return null;
  }
};

/**
 * 更新日程
 */
export const updateSchedule = async (scheduleId, updates) => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase 未配置');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('schedules')
      .update(updates)
      .eq('id', scheduleId)
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error('更新日程失敗:', error.message);
    return null;
  }
};

// ==================== EVENTS 表操作 ====================

/**
 * 創建新的事件
 */
export const createEvent = async (eventData) => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase 未配置');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error('創建事件失敗:', error.message);
    return null;
  }
};

/**
 * 更新事件 (用於編輯時間、標題、描述)
 */
export const updateEvent = async (eventId, updates) => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase 未配置');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', eventId)
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error('更新事件失敗:', error.message);
    return null;
  }
};

/**
 * 刪除事件
 */
export const deleteEvent = async (eventId) => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase 未配置');
    return true;
  }

  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('刪除事件失敗:', error.message);
    return false;
  }
};

/**
 * 獲取日程的所有事件
 */
export const fetchScheduleEvents = async (scheduleId) => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase 未配置');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('time', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('獲取事件失敗:', error.message);
    return [];
  }
};
