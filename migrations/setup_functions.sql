-- Function to create summaries table
CREATE OR REPLACE FUNCTION create_summaries_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.summaries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT NOT NULL,
    source_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_summaries_user_id ON public.summaries(user_id);
  CREATE INDEX IF NOT EXISTS idx_summaries_created_at ON public.summaries(created_at);
END;
$$;

-- Function to create analytics table
CREATE OR REPLACE FUNCTION create_analytics_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    summary_id UUID REFERENCES public.summaries(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    source_type TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics(user_id);
  CREATE INDEX IF NOT EXISTS idx_analytics_summary_id ON public.analytics(summary_id);
  CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON public.analytics(timestamp);
END;
$$;

-- Function to set up RLS policies
CREATE OR REPLACE FUNCTION setup_rls_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Enable RLS
  ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

  -- Summaries policies
  CREATE POLICY "Users can view their own summaries"
    ON public.summaries FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can create their own summaries"
    ON public.summaries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own summaries"
    ON public.summaries FOR UPDATE
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own summaries"
    ON public.summaries FOR DELETE
    USING (auth.uid() = user_id);

  -- Analytics policies
  CREATE POLICY "Users can view their own analytics"
    ON public.analytics FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can create their own analytics"
    ON public.analytics FOR INSERT
    WITH CHECK (auth.uid() = user_id);
END;
$$; 