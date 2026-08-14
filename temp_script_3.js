
  const serverUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'https://ankbazar.onrender.com' : '';
  
  if (window.supabaseClient) {
    window.supabaseClient.channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'SiteData' }, payload => {
        updateUI(payload.new);
      })
      .subscribe();
  }
  
  window.appState = {};
  window.fullChartHistory = [];
  
  function renderChartHistory(items) {
    const historyContainer = document.getElementById('chart-history-container');
    if (items.length === 0) {
      historyContainer.innerHTML = '<div class="text-center text-gray-500 py-4">No results found for this date.</div>';
      return;
    }
    historyContainer.innerHTML = items.map(item => `<div class="bg-gray-50 border rounded-md flex items-center justify-between px-6 py-3">
        <div class="flex-1 text-center font-bold text-gray-700">${item.date} <button onclick="editHistory('${item.id}', 'date')" class="ml-2 text-[10px] bg-white border px-1 rounded shadow hover:bg-gray-100">✏️</button></div>
        <div class="flex-1 text-center font-bold text-arkGreen text-lg">${item.result} <button onclick="editHistory('${item.id}', 'result')" class="ml-2 text-[10px] bg-white border px-1 rounded shadow hover:bg-gray-100">✏️</button></div>
        <div class="w-[100px] text-right">
          <button onclick="deleteHistory('${item.id}')" class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded border border-red-300 shadow hover:bg-red-200">🗑️ Delete</button>
        </div>
      </div>`).join('');
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('chart-search-btn').addEventListener('click', () => {
      const dateInput = document.getElementById('chart-date-input').value;
      if (!dateInput) return;
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        const filtered = window.fullChartHistory.filter(item => item.date === formattedDate);
        renderChartHistory(filtered);
      }
    });

    document.getElementById('chart-clear-btn').addEventListener('click', () => {
      document.getElementById('chart-date-input').value = '';
      renderChartHistory(window.fullChartHistory.slice(0, 3));
    });
  });

  function updateUI(data) {
    try {
      if (!data) return;
      window.appState = data;
      const safeText = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.innerText = String(txt || "-");
      };
      safeText('main-result-time', 'at ' + (data.mainResultTime || ""));
      if (document.getElementById('main-result-display')) document.getElementById('main-result-display').innerText = data.mainResult || "-";
      else safeText('main-result', data.mainResult || "-");
      safeText('main-today-result', data.mainTodayResult || "-");
      
      if (liveContainer) {
        liveContainer.innerHTML = (data.liveMarkets || []).map(m => `
            <!-- Mobile View (Admin) -->
            <div class="sm:hidden border-b border-gray-100 p-4 space-y-3 relative">
              <div class="flex justify-between items-center">
                <div>
                  <div class="font-bold flex items-center space-x-2 text-base text-gray-900">
                    <span>${m.name}</span>
                    <i class="fa-solid fa-star text-arkYellow text-xs"></i>
                  </div>
                  <div class="mt-1"><button onclick="editLiveMarket('${m.id}', 'name')" class="text-[10px] bg-white border border-gray-400 text-gray-700 px-2 py-0.5 rounded shadow hover:bg-gray-100">✏️ Edit</button></div>
                </div>
                <span class="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-1 rounded border border-gray-300 uppercase">${m.status}</span>
              </div>
              <div class="flex flex-col space-y-2 text-xs text-gray-600 bg-gray-50 p-3 rounded">
                <div class="flex justify-between items-center">
                  <span>Open: <span class="font-semibold text-gray-900">${m.openTime}</span></span>
                  <button onclick="editLiveMarket('${m.id}', 'openTime')" class="text-[10px] bg-white border border-gray-400 text-gray-700 px-2 py-0.5 rounded shadow hover:bg-gray-100">✏️ Edit</button>
                </div>
                <div class="flex justify-between items-center">
                  <span>Close: <span class="font-semibold text-gray-900">${m.closeTime}</span></span>
                  <button onclick="editLiveMarket('${m.id}', 'closeTime')" class="text-[10px] bg-white border border-gray-400 text-gray-700 px-2 py-0.5 rounded shadow hover:bg-gray-100">✏️ Edit</button>
                </div>
              </div>
              <div class="flex justify-between items-center px-2">
                <div class="text-xs font-bold text-gray-500 uppercase">Result:</div>
                <div class="flex flex-col items-center">
                  <div class="font-black text-arkGreen text-2xl">${m.result}</div>
                  <div class="mt-1"><button onclick="editLiveMarket('${m.id}', 'result')" class="text-[10px] bg-white border border-gray-400 text-gray-700 px-2 py-0.5 rounded shadow hover:bg-gray-100">✏️ Edit</button></div>
                </div>
                <button onclick="deleteLiveMarket('${m.id}')" class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded border border-red-300 shadow hover:bg-red-200">🗑️ Delete</button>
              </div>
            </div>
            <!-- Desktop View (Admin) -->
            <div class="hidden sm:grid grid-cols-6 gap-4 py-4 px-6 border-b border-gray-100 items-center text-center text-sm hover:bg-gray-50 transition-colors">
              <div class="col-span-1 text-left flex flex-col justify-center">
                <div class="font-bold flex items-center space-x-2 text-gray-900">
                  <span>${m.name}</span>
                  <i class="fa-solid fa-star text-arkYellow text-xs"></i>
                </div>
                <div class="mt-1"><button onclick="editLiveMarket('${m.id}', 'name')" class="text-[10px] bg-white border border-gray-400 text-gray-700 px-2 py-0.5 rounded shadow hover:bg-gray-100">✏️ Edit</button></div>
              </div>
              <div class="flex flex-col justify-center text-gray-700">
                <div>${m.openTime}</div>
                <div class="mt-1 flex justify-center"><button onclick="editLiveMarket('${m.id}', 'openTime')" class="text-[10px] bg-white border border-gray-400 text-gray-700 px-2 py-0.5 rounded shadow hover:bg-gray-100">✏️ Edit</button></div>
              </div>
              <div class="flex flex-col justify-center text-gray-700">
                <div>${m.closeTime}</div>
                <div class="mt-1 flex justify-center"><button onclick="editLiveMarket('${m.id}', 'closeTime')" class="text-[10px] bg-white border border-gray-400 text-gray-700 px-2 py-0.5 rounded shadow hover:bg-gray-100">✏️ Edit</button></div>
              </div>
              <div class="flex flex-col justify-center">
                <div class="font-bold text-arkGreen text-xl">${m.result}</div>
                <div class="mt-1 flex justify-center"><button onclick="editLiveMarket('${m.id}', 'result')" class="text-[10px] bg-white border border-gray-400 text-gray-700 px-2 py-0.5 rounded shadow hover:bg-gray-100">✏️ Edit</button></div>
              </div>
              <div class="flex flex-col justify-center">
                <span class="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded border border-gray-300 w-max mx-auto font-medium uppercase">${m.status}</span>
              </div>
              <div class="flex flex-col justify-center">
                <button onclick="deleteLiveMarket('${m.id}')" class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded border border-red-300 shadow hover:bg-red-200 transition-colors">🗑️ Delete</button>
              </div>
            </div>
          `).join('');
      }
      
      safeText('weekly-mon', data.weekly?.mon || "-");
      safeText('weekly-tue', data.weekly?.tue || "-");
      safeText('weekly-wed', data.weekly?.wed || "-");
      safeText('weekly-thu', data.weekly?.thu || "-");
      safeText('weekly-fri', data.weekly?.fri || "-");
      safeText('weekly-sat', data.weekly?.sat || "-");
      safeText('weekly-sun', data.weekly?.sun || "-");
      
      // Render auto-calculated hot numbers
      const hotContainer = document.getElementById('hot-numbers-container');
      if (hotContainer) {
        const hots = data.hotNumbers || [];
        if(hots.length === 0) {
           hotContainer.innerHTML = '<div class="text-gray-500 text-sm italic w-full">No hot numbers available.</div>';
        } else {
           hotContainer.innerHTML = hots.map(num => `<span class="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm hover-lift cursor-default transition-all duration-300">${num}</span>`).join('');
        }
      }
      
      window.fullChartHistory = data.chartHistory || [];
      if (!document.getElementById('chart-date-input') || !document.getElementById('chart-date-input').value) {
        renderChartHistory(window.fullChartHistory.slice(0, 3));
      } else {
        const dateInput = document.getElementById('chart-date-input').value;
        const parts = dateInput.split('-');
        if (parts.length === 3) {
          const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          const filtered = window.fullChartHistory.filter(item => item.date === formattedDate);
          renderChartHistory(filtered);
        } else {
          renderChartHistory(window.fullChartHistory.slice(0, 3));
        }
      }
    } catch (err) {
      console.error("updateUI error:", err);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    try {
      if (window.__INITIAL_STATE__) {
        updateUI(window.__INITIAL_STATE__);
      }
    } catch(e) { console.error("Initial state error:", e); }
    
    fetch((serverUrl ? serverUrl : '') + '/api/state?t=' + new Date().getTime())
      .then(res => res.json())
      .then(data => updateUI(data))
      .catch(err => console.error("Error fetching initial state:", err));
  });



  function editField(field, type='field') {
    const val = prompt("Enter new value:");
    if (val !== null) {
      processUpdate( { type: type, field: field, value: val || '-' });
    }
  }
  function editNested(parent, field) {
    const val = prompt("Enter new value:");
    if (val !== null) {
      processUpdate( { type: 'nested', parent: parent, field: field, value: val || '-' });
    }
  }
  function addHotNumber() {
    const val = prompt("Enter hot number (e.g. 15):");
    if (val !== null && val.trim() !== "") {
      processUpdate( { type: 'array_add', target: 'hotNumbers', value: val });
    }
  }
  function editArray(target, index) {
    const val = prompt("Enter new value:");
    if (val !== null) {
      processUpdate( { type: 'array_edit', target: target, index: index, value: val || '--' });
    }
  }
  function deleteArray(target, index) {
    if(confirm("Delete this?")) processUpdate( { type: 'array_delete', target: target, index: index });
  }
  function addHistoryRow() {
    const date = prompt("Enter date (e.g. 05-08-2026):");
    if (!date) return;
    const result = prompt("Enter result (e.g. 100-20):");
    if (!result) return;
    processUpdate( { type: 'history_add', date: date, result: result });
  }
  function editHistory(id, field) {
    const val = prompt("Enter new value:");
    if (val !== null) {
      processUpdate( { type: 'history_edit', id: id, field: field, value: val || '-' });
    }
  }
  function deleteHistory(id) {
    if(confirm("Delete this row?")) processUpdate( { type: 'history_delete', id: id });
  }
  function addLiveMarket() {
    processUpdate( { type: 'market_add' });
  }
  function editLiveMarket(id, field) {
    const val = prompt("Enter new value:");
    if (val !== null) {
      processUpdate( { type: 'market_edit', id: id, field: field, value: val || '-' });
    }
  }
  function deleteLiveMarket(id) {
    if(confirm("Delete this market?")) processUpdate( { type: 'market_delete', id: id });
  }
  
  function recalcHotNumbers() {
    const counts = {};
    (window.appState.chartHistory || []).forEach(item => {
      const res = String(item.result).trim();
      if (res && res !== "-" && res !== "--") {
        counts[res] = (counts[res] || 0) + 1;
      }
    });
    const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    window.appState.hotNumbers = sorted.slice(0, 5);
  }

  function processUpdate(payload) {
    if (!window.appState) return;
    if (payload.type === 'field') {
      window.appState[payload.field] = payload.value;
      if (payload.field === 'mainResult' || payload.field === 'mainTodayResult') {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const dateStr = `${day}-${month}-${year}`;

        const existing = window.appState.chartHistory.find(x => x.date === dateStr);
        if (existing) {
          existing.result = payload.value;
        } else {
          window.appState.chartHistory.unshift({ id: Date.now().toString(), date: dateStr, result: payload.value });
        }
      }
    } else if (payload.type === 'nested') {
      if (window.appState[payload.parent]) window.appState[payload.parent][payload.field] = payload.value;
    } else if (payload.type === 'array_edit') {
      window.appState[payload.target][payload.index] = payload.value;
    } else if (payload.type === 'array_delete') {
      window.appState[payload.target].splice(payload.index, 1);
    } else if (payload.type === 'array_add') {
      window.appState[payload.target].push(payload.value);
    } else if (payload.type === 'history_edit') {
      const item = window.appState.chartHistory.find(x => x.id === payload.id);
      if (item) item[payload.field] = payload.value;
    } else if (payload.type === 'history_delete') {
      window.appState.chartHistory = window.appState.chartHistory.filter(x => x.id !== payload.id);
    } else if (payload.type === 'history_add') {
      window.appState.chartHistory.unshift({ id: Date.now().toString(), date: payload.date, result: payload.result });
    } else if (payload.type === 'market_add') {
      if (!window.appState.liveMarkets) window.appState.liveMarkets = [];
      window.appState.liveMarkets.push({ id: Date.now().toString(), name: "New Market", openTime: "09:00 AM", closeTime: "07:00 PM", result: "-", status: "CLOSED" });
    } else if (payload.type === 'market_delete') {
      window.appState.liveMarkets = window.appState.liveMarkets.filter(m => m.id !== payload.id);
    } else if (payload.type === 'market_edit') {
      const m = window.appState.liveMarkets.find(m => m.id === payload.id);
      if (m) m[payload.field] = payload.value;
    }

    recalcHotNumbers();
    
    // Save to Supabase 
    if (window.supabaseClient) {
      const toSave = { ...window.appState };
      const _id = toSave.id || 1;
      
      // Assume the table uses integer 'id' primary key or uuid.
      // If it's a settings table, typically there's only 1 row anyway.
      // Make sure we delete any _id from MongoDB so it doesn't break Postgres inserts
      delete toSave._id; 

      window.supabaseClient.from('SiteData').update(toSave).eq('id', _id)
        .then(({error}) => { 
           if(error) {
             console.error("Error saving to Supabase:", error); 
             alert("Error saving data: " + error.message);
           }
        });
        
      // Optimistic UI update
      updateUI(window.appState);
    }
  }
