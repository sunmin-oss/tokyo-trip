import { supabase } from './supabaseClient';

/**
 * Supabase 服務層 - 處理所有數據庫操作
 */

// ===== Trips =====
export const tripService = {
  async getTrip(tripId) {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createTrip(tripData) {
    const { data, error } = await supabase
      .from('trips')
      .insert([tripData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async updateTrip(tripId, updates) {
    const { data, error } = await supabase
      .from('trips')
      .update(updates)
      .eq('id', tripId)
      .select();
    
    if (error) throw error;
    return data[0];
  }
};

// ===== Groups =====
export const groupService = {
  async getGroupsByTrip(tripId) {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('trip_id', tripId)
      .order('order_index', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async createGroup(tripId, groupData) {
    const { data, error } = await supabase
      .from('groups')
      .insert([{ trip_id: tripId, ...groupData }])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async updateGroup(groupId, updates) {
    const { data, error } = await supabase
      .from('groups')
      .update(updates)
      .eq('id', groupId)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async deleteGroup(groupId) {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);
    
    if (error) throw error;
  }
};

// ===== Days =====
export const dayService = {
  async getDaysByTrip(tripId) {
    const { data, error } = await supabase
      .from('days')
      .select('*')
      .eq('trip_id', tripId)
      .order('day_number', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async createDay(tripId, dayData) {
    const { data, error } = await supabase
      .from('days')
      .insert([{ trip_id: tripId, ...dayData }])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async updateDay(dayId, updates) {
    const { data, error } = await supabase
      .from('days')
      .update(updates)
      .eq('id', dayId)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async deleteDay(dayId) {
    const { error } = await supabase
      .from('days')
      .delete()
      .eq('id', dayId);
    
    if (error) throw error;
  }
};

// ===== Events =====
export const eventService = {
  async getEventsByDay(dayId) {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        groups:group_id (
          id,
          name,
          color
        )
      `)
      .eq('day_id', dayId)
      .order('order_index', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async getEventsByTrip(tripId) {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        groups:group_id (
          id,
          name,
          color
        )
      `)
      .eq('trip_id', tripId);
    
    if (error) throw error;
    return data;
  },

  async createEvent(dayId, tripId, eventData) {
    const { data, error } = await supabase
      .from('events')
      .insert([{
        day_id: dayId,
        trip_id: tripId,
        ...eventData
      }])
      .select(`
        *,
        groups:group_id (
          id,
          name,
          color
        )
      `);
    
    if (error) throw error;
    return data[0];
  },

  async updateEvent(eventId, updates) {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select(`
        *,
        groups:group_id (
          id,
          name,
          color
        )
      `);
    
    if (error) throw error;
    return data[0];
  },

  async deleteEvent(eventId) {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);
    
    if (error) throw error;
  }
};

// ===== 複合查詢 =====
export const aggregateService = {
  /**
   * 一次性載入一整個行程的完整資料（包含所有天數、組別、事件）
   */
  async getFullTrip(tripId) {
    const trip = await tripService.getTrip(tripId);
    const days = await dayService.getDaysByTrip(tripId);
    const groups = await groupService.getGroupsByTrip(tripId);
    
    // 為每個 day 載入其對應的 events
    const daysWithEvents = await Promise.all(
      days.map(async (day) => {
        const events = await eventService.getEventsByDay(day.id);
        return { ...day, events };
      })
    );
    
    return {
      ...trip,
      groups,
      days: daysWithEvents
    };
  }
};
