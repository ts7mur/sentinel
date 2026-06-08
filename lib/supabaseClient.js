import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rrkqccwjvawkqngnkfwf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJya3FjY3dqdmF3a3FuZ25rZndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODI1MDQsImV4cCI6MjA5NjI1ODUwNH0.NmDKzo-1Pb_nAYXh9EHaeECML9ZWEjdG5qyZWDmntCY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: true, persistSession: false, detectSessionInUrl: false },
});
