const { createClient } = require('@supabase/supabase-js');

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase credentials. Please check your .env file.');
}

// Initialize Supabase client with proper configuration
const supabaseUrl = process.env.SUPABASE_URL.trim();
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'x-application-name': 'brevityiq-backend'
    }
  }
});

// Test the connection
supabase.auth.getSession().catch(error => {
  console.error('Supabase connection error:', error.message);
  process.exit(1);
});

module.exports = supabase; 