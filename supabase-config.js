// supabase-config.js

// TODO: Replace these with your actual Supabase Project URL and Anon Key
const SUPABASE_URL = 'https://cioxbjknpsygisrkaiie.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_I1eGFkRGitv0Z0jWXXnVQw_toNrH3CM';

// Initialize the Supabase client
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
