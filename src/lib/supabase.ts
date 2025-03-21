import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = 'https://owrxyoixtuerbskhdeel.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93cnh5b2l4dHVlcmJza2hkZWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMTU5NTUsImV4cCI6MjA1Nzg5MTk1NX0.xrgrMCb1_yYd4H5Nui5PhowxBVDUOOq7UpIgrbZlJ5Q';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please click the "Connect to Supabase" button in the top right to set up your Supabase project.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: true
  }
});