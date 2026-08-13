const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const siteDataSchema = new mongoose.Schema({}, { strict: false });
const SiteData = mongoose.model('SiteData', siteDataSchema);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const DATA_FILE = path.join(__dirname, 'data.json');

const defaultState = { mainResult: "-", mainTodayResult: "-", summaryMorning: "-", summaryDay: "-", summaryEvening: "-", summaryNight: "-", liveMarkets: [], chartHistory: [] };

let appState = { ...defaultState };

(async () => {
  try {
    await mongoose.connect("mongodb+srv://karantrahal03_db_user:6MEdEBLBTos0EZ1J@cluster0.5tn4tim.mongodb.net/arkbazar?appName=Cluster0");
    console.log('MongoDB connected');
    const count = await SiteData.countDocuments();
    if (count === 0) {
      const defaultData = { mainResult: "113-46", mainTodayResult: "-", summaryMorning: "-", summaryDay: "-", summaryEvening: "-", summaryNight: "113-46", liveMarkets: [], chartHistory: [] };
      await SiteData.create(defaultData);
    }
    const dbState = await SiteData.findOne();
    appState = dbState.toObject ? dbState.toObject() : dbState;
  } catch (err) {
    console.error('MongoDB init error:', err);
  }
})();

// Function to link Yesterday Summary with mainResult
function updateYesterdaySummaryFromMainResult() {
  appState.summaryMorning = "-";
  appState.summaryDay = "-";
  appState.summaryEvening = "-";
  appState.summaryNight = "-";
  if (appState.mainResult && appState.mainResult !== "-") {
    const t = parseTimes(appState.mainResultTime)[0];
    if (t !== undefined && t !== -1) {
      if (t < 12 * 60) appState.summaryMorning = appState.mainResult;
      else if (t < 17 * 60) appState.summaryDay = appState.mainResult;
      else if (t < 20 * 60) appState.summaryEvening = appState.mainResult;
      else appState.summaryNight = appState.mainResult;
    }
  }
}

// Ensure summaries are perfectly in sync with mainResult on startup



const parseTimes = (timeStr) => {
  if(!timeStr) return [];
  return timeStr.split(',').map(t => {
    t = t.trim();
    if(!t.includes(':')) return -1;
    const [time, modifier] = t.split(' ');
    if(!modifier) return -1;
    let [h, m] = time.split(':');
    h = parseInt(h);
    m = parseInt(m);
    if (h === 12 && modifier.toUpperCase() === 'AM') h = 0;
    if (h !== 12 && modifier.toUpperCase() === 'PM') h += 12;
    return h * 60 + m;
  }).filter(v => v !== -1);
};



app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(__dirname, { index: false }));

app.get('/', (req, res) => {
  fs.readFile(path.join(__dirname, 'code.html'), 'utf8', (err, html) => {
    if (err) {
      console.error("Error sending code.html:", err);
      return res.status(500).send("Error loading page");
    }
    const injected = html.replace('</head>', `<script>window.__INITIAL_STATE__ = ${JSON.stringify(appState)};</script></head>`);
    res.send(injected);
  });
});

app.get('/legal', (req, res) => {
  res.sendFile(path.join(__dirname, 'legal.html'));
});

app.get('/api/state', (req, res) => {
  res.json(appState);
});

app.get('/dash-xyz987', (req, res) => {
  const { key } = req.query;
  if (key !== 'super_secret_token_2026') {
    return res.status(403).send('403 Forbidden');
  }
  fs.readFile(path.join(__dirname, 'admin.html'), 'utf8', (err, html) => {
    if (err) {
      console.error("Error sending admin.html:", err);
      return res.status(500).send("Error loading page");
    }
    const injected = html.replace('</head>', `<script>window.__INITIAL_STATE__ = ${JSON.stringify(appState)};</script></head>`);
    res.send(injected);
  });
});

function calculateHotNumbers() {
  const counts = {};
  appState.chartHistory.forEach(item => {
    const res = String(item.result).trim();
    if (res && res !== "-" && res !== "--") {
      counts[res] = (counts[res] || 0) + 1;
    }
  });
  const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  appState.hotNumbers = sorted.slice(0, 5);
}

calculateHotNumbers();

io.on('connection', (socket) => {
  socket.emit('site_data_updated', appState);

  socket.on('request_initial_state', () => {
    socket.emit('site_data_updated', appState);
  });

  socket.on('update_site_data', async (payload) => {
    if (payload.type === 'field') {
      appState[payload.field] = payload.value;
      if (payload.field === 'mainResult' || payload.field === 'mainTodayResult') {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' });
        const parts = formatter.formatToParts(now);
        const day = parts.find(p => p.type === 'day').value;
        const month = parts.find(p => p.type === 'month').value;
        const year = parts.find(p => p.type === 'year').value;
        const dateStr = `${day}-${month}-${year}`;

        const existing = appState.chartHistory.find(x => x.date === dateStr);
        if (existing) {
          existing.result = payload.value;
        } else {
          appState.chartHistory.unshift({ id: Date.now().toString(), date: dateStr, result: payload.value });
        }
      }
    } else if (payload.type === 'nested') {
      if (appState[payload.parent]) appState[payload.parent][payload.field] = payload.value;
    } else if (payload.type === 'array_edit') {
      appState[payload.target][payload.index] = payload.value;
    } else if (payload.type === 'array_delete') {
      appState[payload.target].splice(payload.index, 1);
    } else if (payload.type === 'array_add') {
      appState[payload.target].push(payload.value);
    } else if (payload.type === 'history_edit') {
      const item = appState.chartHistory.find(x => x.id === payload.id);
      if (item) item[payload.field] = payload.value;
    } else if (payload.type === 'history_delete') {
      appState.chartHistory = appState.chartHistory.filter(x => x.id !== payload.id);
    } else if (payload.type === 'history_add') {
      appState.chartHistory.unshift({ id: Date.now().toString(), date: payload.date, result: payload.result });
    } else if (payload.type === 'market_add') {
      appState.liveMarkets.push({ id: Date.now().toString(), name: "New Market", openTime: "09:00 AM", closeTime: "07:00 PM", result: "-", status: "CLOSED" });
    } else if (payload.type === 'market_delete') {
      appState.liveMarkets = appState.liveMarkets.filter(m => m.id !== payload.id);
    } else if (payload.type === 'market_edit') {
      const m = appState.liveMarkets.find(m => m.id === payload.id);
      if (m) m[payload.field] = payload.value;
    }

    calculateHotNumbers();
    await SiteData.findOneAndUpdate({}, appState, { upsert: true, new: true, strict: false })
      .catch(err => console.error("Error saving state to MongoDB:", err));
    io.emit('site_data_updated', appState);
  });

});

function updateLiveStatus() {
  try {
    const now = new Date();
    const formatterTime = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', hour12: false });
    const partsTime = formatterTime.formatToParts(now);
    const hourStr = partsTime.find(p => p.type === 'hour').value;
    const minute = parseInt(partsTime.find(p => p.type === 'minute').value);
    const hour = parseInt(hourStr) === 24 ? 0 : parseInt(hourStr);
    const currentTime = hour * 60 + minute;

    const formatterDate = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' });
    const partsDate = formatterDate.formatToParts(now);
    const day = partsDate.find(p => p.type === 'day').value;
    const month = partsDate.find(p => p.type === 'month').value;
    const year = partsDate.find(p => p.type === 'year').value;
    const currentDateStr = `${day}-${month}-${year}`;

    let stateChanged = false;

    if (!appState.lastKnownDate) {
      appState.lastKnownDate = currentDateStr;
    } else if (appState.lastKnownDate !== currentDateStr) {

      appState.mainResult = appState.mainTodayResult !== "-" ? appState.mainTodayResult : appState.mainResult;
      appState.mainTodayResult = "-";
      
      appState.liveMarkets.forEach(m => m.result = "-");
      appState.lastKnownDate = currentDateStr;
      stateChanged = true;
    }


    appState.liveMarkets.forEach(market => {
      const openTimes = parseTimes(market.openTime);
      const closeTimes = parseTimes(market.closeTime);
      let newStatus = "CLOSED";

      for (let i = 0; i < openTimes.length; i++) {
        const oTime = openTimes[i];
        const cTime = closeTimes[i] !== undefined ? closeTimes[i] : (oTime + 60);
        if (currentTime >= oTime && currentTime < cTime) {
          newStatus = "LIVE";
          break;
        }
      }

      if (newStatus !== "LIVE" && closeTimes.length > 0) {
        const lastCloseTime = closeTimes[closeTimes.length - 1];
        if (currentTime >= lastCloseTime) {
          newStatus = "RESULT OUT";
        }
      }

      if (market.status !== newStatus) {
        market.status = newStatus;
        stateChanged = true;
      }
    });

    if (stateChanged) {
      SiteData.findOneAndUpdate({}, appState, { upsert: true, new: true, overwrite: true })
        .catch(err => console.error("Error saving state to MongoDB on live status update:", err));
      io.emit('site_data_updated', appState);
    }
  } catch (e) {
    console.error("Error updating live status:", e);
  }
}
setInterval(updateLiveStatus, 60000);
updateLiveStatus();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
