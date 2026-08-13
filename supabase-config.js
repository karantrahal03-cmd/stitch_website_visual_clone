// supabase-config.js

// TODO: Replace these with your actual Supabase Project URL and Anon Key
const SUPABASE_URL = 'https://srelyiijdiozvfagktx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyZWx5aWlqZGlvenF2ZmFna3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0OTM3NTYsImV4cCI6MjEwMTA2OTc1Nn0.0XCcXLF6YKuHeXjTsX5LOqO-tgjZXFkjatqWa2wZ6PI';

// Initialize the Supabase client
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
