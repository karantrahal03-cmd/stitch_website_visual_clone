const SUPABASE_URL = "https://cioxbjknpsygisrkaiie.supabase.co/rest/v1/SiteData";
const SUPABASE_ANON_KEY = "sb_publishable_I1eGFkRGitv0Z0jWXXnVQw_toNrH3CM";

async function sync() {
  try {
    // 1. Fetch current data
    const res = await fetch(`${SUPABASE_URL}?id=eq.1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
      }
    });
    const rows = await res.json();
    if (!rows || rows.length === 0) {
      console.log("No data found");
      return;
    }
    const data = rows[0];

    // 2. Build marketHistory for 'm1' from chartHistory
    if (!data.marketHistory) data.marketHistory = {};
    if (!data.marketHistory['m1']) data.marketHistory['m1'] = {};
    
    (data.chartHistory || []).forEach(item => {
       const parts = item.date.split('-'); // DD-MM-YYYY
       if (parts.length === 3) {
         const day = parts[0];
         const month = parts[1];
         const year = parts[2];
         
         if (!data.marketHistory['m1'][year]) data.marketHistory['m1'][year] = {};
         if (!data.marketHistory['m1'][year][month]) data.marketHistory['m1'][year][month] = {};
         
         // Only set if not already set, or overwrite? User said "data should be same as history"
         data.marketHistory['m1'][year][month][day] = item.result;
       }
    });

    // 3. Upsert back to Supabase
    const payload = {
       id: 1,
       marketHistory: data.marketHistory
    };

    const updateRes = await fetch(SUPABASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });
    
    if (!updateRes.ok) {
       console.error("Update failed", updateRes.status, await updateRes.text());
    } else {
       console.log("Sync successful! All history copied to Ark Bazar market.");
    }

  } catch(e) {
    console.error(e);
  }
}
sync();
