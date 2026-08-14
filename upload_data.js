const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://cioxbjknpsygisrkaiie.supabase.co/rest/v1/SiteData";
const SUPABASE_ANON_KEY = "sb_publishable_I1eGFkRGitv0Z0jWXXnVQw_toNrH3CM";

try {
  const rawData = fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8');
  const data = JSON.parse(rawData);

  const payload = {
    id: 1,
    "mainResult": data.mainResult || "-",
    "mainResultTime": data.mainResultTime || "-",
    "mainTodayResult": data.mainTodayResult || "-",
    "summaryMorning": data.summaryMorning || "-",
    "summaryDay": data.summaryDay || "-",
    "summaryEvening": data.summaryEvening || "-",
    "summaryNight": data.summaryNight || "-",
    "liveMarkets": data.liveMarkets || [],
    "weekly": data.weekly || {},
    "hotNumbers": data.hotNumbers || [],
    "chartHistory": data.chartHistory || [],
    "marketHistory": data.marketHistory || {}
  };

  fetch(SUPABASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(payload)
  })
  .then(async res => {
    if (!res.ok) {
      console.error("HTTP Error:", res.status, await res.text());
    } else {
      console.log("Successfully uploaded to Supabase!");
    }
  })
  .catch(console.error);
} catch (e) {
  console.error(e);
}
