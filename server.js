const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let appState = {
  mainResult: "113-46",
  mainTodayResult: "-",
  summaryMorning: "-",
  summaryDay: "-",
  summaryEvening: "-",
  summaryNight: "113-46",
  liveMarkets: [
    { id: "m1", name: "Ark Bazar", openTime: "09:00 AM", closeTime: "07:00 PM", result: "-", status: "CLOSED" }
  ],
  weekly: { mon: "---", tue: "---", wed: "---", thu: "---", fri: "---", sat: "---", sun: "---" },
  hotNumbers: ["--", "--", "--"],
  chartHistory: (function() {
    const startDate = new Date(2021, 0, 9); // Jan 9, 2021
    const endDate = new Date(); // Present date
    let dates = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      const day = String(current.getDate()).padStart(2, '0');
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const year = current.getFullYear();
      dates.push(`${day}-${month}-${year}`);
      current.setDate(current.getDate() + 1);
    }
    // Newest to oldest
    dates.reverse();
    // Random selection of numbers 1-100
    return dates.map((dateStr, index) => ({
      id: String(index + 1),
      date: dateStr,
      result: String(Math.floor(Math.random() * 100) + 1)
    }));
  })(),
  lastKnownDate: ""
};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static assets from root directory
app.use(express.static(__dirname));

// Root route - explicitly serve code.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'code.html'), (err) => {
    if (err) {
      console.error("Error sending code.html:", err);
      res.status(500).send("Error loading page");
    }
  });
});

// Legal page route
app.get('/legal', (req, res) => {
  res.sendFile(path.join(__dirname, 'legal.html'));
});

// Secret Admin route
app.get('/dash-xyz987', (req, res) => {
  const { key } = req.query;
  if (key !== 'super_secret_token_2026') {
    return res.status(403).send('403 Forbidden');
  }
  res.sendFile(path.join(__dirname, 'admin.html'));
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

// WebSocket logic
io.on('connection', (socket) => {
  socket.emit('site_data_updated', appState);

  socket.on('update_site_data', (payload) => {
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
    io.emit('site_data_updated', appState);
  });
});

// Midnight Reset & Live Status
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
      appState.mainResult = "-";
      appState.mainTodayResult = "-";
      appState.summaryMorning = "-";
      appState.summaryDay = "-";
      appState.summaryEvening = "-";
      appState.summaryNight = "-";
      appState.liveMarkets.forEach(m => m.result = "-");
      appState.lastKnownDate = currentDateStr;
      stateChanged = true;
    }

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
