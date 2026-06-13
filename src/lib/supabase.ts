import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  'https://oqumowdcsjbsmhquxnpk.supabase.co',
  'sb_publishable_DUo1Ij_A4f01MKZ4uXKG5w_bNirmyCu',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
