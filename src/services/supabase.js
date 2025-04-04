const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Ensure the URL is properly formatted
const supabaseUrl = process.env.SUPABASE_URL.trim();
const supabaseKey = process.env.SUPABASE_ANON_KEY.trim();

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

module.exports = supabase; 