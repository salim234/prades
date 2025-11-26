import { createClient } from '@supabase/supabase-js';

// Kredensial dari environment variables atau hardcoded (sesuai permintaan user)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://egfdhqjfglillivzomgm.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZmRocWpmZ2xpbGxpdnpvbWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwODM1MjAsImV4cCI6MjA3OTY1OTUyMH0.xdCSaGGeKO3swWMi8iBZQQjhaCz1mdIpQqi0syxXK9U';

export const supabase = createClient(supabaseUrl, supabaseKey);
