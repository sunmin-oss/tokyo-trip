import { createClient } from '@supabase/supabase-js';

// 獲取環境變數
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 檢查環境變數是否設定
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase 環境變數未設定。如要使用資料庫功能，請在 .env 文件中設定 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
}

// 創建 Supabase 客戶端
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// 檢查是否正確配置
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};
