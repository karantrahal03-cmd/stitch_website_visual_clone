const url = 'https://srelyiijdiozvfagktx.supabase.co/auth/v1/signup';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyZWx5aWlqZGlvenF2ZmFna3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0OTM3NTYsImV4cCI6MjEwMTA2OTc1Nn0.0XCcXLF6YKuHeXjTsX5LOqO-tgjZXFkjatqWa2wZ6PI';

fetch(url, {
  method: 'POST',
  headers: {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'contact@arkbazar.in',
    password: 'ankbazar982'
  })
}).then(res => res.json()).then(console.log).catch(console.error);
