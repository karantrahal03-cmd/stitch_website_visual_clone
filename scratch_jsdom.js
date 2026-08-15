const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('admin.html', 'utf8');

const dom = new JSDOM(html, { 
  runScripts: "dangerously",
  resources: "usable",
  url: "http://localhost:3001/admin.html"
});

const window = dom.window;
const document = window.document;

// Mock prompt and alert and confirm
window.prompt = () => "Mock Value";
window.alert = (msg) => console.log("ALERT:", msg);
window.confirm = () => true;

// Mock supabase client
window.supabaseClient = {
  from: (table) => ({
    update: (data) => {
      console.log("SUPABASE UPDATE TABLE:", table, "DATA:", JSON.stringify(data));
      return { eq: (field, val) => {
        console.log("EQ:", field, val);
        return Promise.resolve({ error: null });
      }};
    },
    select: () => ({
      limit: () => ({
        single: () => Promise.resolve({ data: { id: 1, liveMarkets: [] }, error: null })
      })
    })
  }),
  channel: () => ({
    on: () => ({
      subscribe: () => {}
    })
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: true } }),
    onAuthStateChange: () => {}
  }
};

window.addEventListener('load', () => {
  console.log("Page loaded.");
  
  // Call updateUI to set initial state like the app does
  window.updateUI({
    id: 1,
    liveMarkets: [],
    chartHistory: []
  });
  
  console.log("Initial markets count:", document.querySelectorAll('.grid-cols-6').length);
  
  const btn = document.getElementById('add-market-btn');
  if (btn) {
    console.log("Clicking button");
    try {
      btn.click();
      console.log("Clicked successfully.");
    } catch (e) {
      console.log("Error clicking:", e.message);
    }
  } else {
    console.log("Button not found.");
  }
  
  // Delay slightly to let async promises resolve
  setTimeout(() => {
    console.log("Final markets count:", document.querySelectorAll('.grid-cols-6').length);
    if (document.querySelectorAll('.grid-cols-6').length > 0) {
       console.log("HTML OF FIRST MARKET:", document.querySelectorAll('.grid-cols-6')[0].outerHTML);
    }
  }, 1000);
});

// Catch errors
window.addEventListener('error', (event) => {
  console.error("JSDOM ERROR:", event.error);
});
