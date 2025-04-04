require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function setupDatabase() {
  console.log('Setting up database...\n');

  try {
    const supabase = createClient(
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

    console.log('Creating summaries table...');
    const { error: summariesError } = await supabase.rpc('create_summaries_table');
    
    if (summariesError) {
      console.error('Failed to create summaries table:', summariesError.message);
    } else {
      console.log('✅ Summaries table created successfully');
    }

    console.log('\nCreating analytics table...');
    const { error: analyticsError } = await supabase.rpc('create_analytics_table');
    
    if (analyticsError) {
      console.error('Failed to create analytics table:', analyticsError.message);
    } else {
      console.log('✅ Analytics table created successfully');
    }

    console.log('\nSetting up RLS policies...');
    const { error: rlsError } = await supabase.rpc('setup_rls_policies');
    
    if (rlsError) {
      console.error('Failed to set up RLS policies:', rlsError.message);
    } else {
      console.log('✅ RLS policies set up successfully');
    }

    console.log('\nDatabase setup completed successfully!');
  } catch (error) {
    console.error('\n❌ Database setup failed:');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

setupDatabase(); 