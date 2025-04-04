require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...\n');

  try {
    // Print environment variables (without sensitive data)
    console.log('Environment Configuration:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Supabase URL:', process.env.SUPABASE_URL);
    console.log('Service Role Key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('Anon Key present:', !!process.env.SUPABASE_ANON_KEY);

    // Initialize Supabase admin client
    console.log('\nInitializing Supabase admin client...');
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    );

    // Initialize regular client
    console.log('Initializing Supabase client...');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    );

    // Test auth connection
    console.log('\nTesting auth connection...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Auth connection test failed:', sessionError.message);
    } else {
      console.log('✅ Auth connection successful');
    }

    // Test user creation
    console.log('\nTesting user creation...');
    const testUser = {
      email: 'user@test.com',
      password: 'Test123!@#'
    };

    // First, try to delete the test user if it exists
    console.log('Cleaning up existing test user...');
    const { data: existingUsers, error: searchError } = await supabaseAdmin
      .from('auth.users')
      .select('id')
      .eq('email', testUser.email);

    if (existingUsers?.length > 0) {
      console.log('Found existing test user, deleting...');
      await supabaseAdmin.auth.admin.deleteUser(existingUsers[0].id);
    }

    console.log('Attempting to create user:', testUser.email);
    const { data: userData, error: userError } = await supabase.auth.signUp(testUser);

    if (userError) {
      console.error('❌ User creation failed:', userError.message);
      console.error('Error details:', userError);
    } else {
      console.log('✅ User creation successful');
      console.log('User data:', {
        id: userData.user.id,
        email: userData.user.email,
        created_at: userData.user.created_at
      });

      // Test login
      console.log('\nTesting login...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword(testUser);

      if (loginError) {
        console.error('❌ Login failed:', loginError.message);
      } else {
        console.log('✅ Login successful');
        console.log('Session:', {
          access_token: loginData.session.access_token ? '✓ Present' : '✗ Missing',
          expires_at: loginData.session.expires_at
        });
      }
    }

  } catch (error) {
    console.error('\n❌ Supabase connection test failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

testSupabaseConnection(); 