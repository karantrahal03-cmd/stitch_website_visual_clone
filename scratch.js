
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            arkGreen: '#006141',
            arkTeal: '#2CB18A',
            arkYellow: '#FBC02D',
            arkLightYellow: '#FDE68A',
            arkDarkGrey: '#333333',
            arkLightGrey: '#F5F5F5'
          },
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
          },
          backgroundImage: {
            'abstract-pattern': "url('https://placehold.co/1920x1080/e5e5e5/e5e5e5?text=Abstract+Wavy+Background')"
          }
        }
      }
    }
  

    // Check auth immediately
    async function requireAuth() {
      if (localStorage.getItem('admin_auth') === 'true') return;
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
          window.location.href = 'login.html';
        }
      } catch (e) {
        window.location.href = 'login.html';
      }
    }
    requireAuth();

    // Listen to auth changes
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (localStorage.getItem('admin_auth') === 'true') return;
      if (event === 'SIGNED_OUT' || !session) {
        window.location.href = 'login.html';
      }
    });

    function handleLogout() {
      localStorage.removeItem('admin_auth');
      supabaseClient.auth.signOut().finally(() => {
        window.location.href = 'login.html';
      });
    }
  

    document.addEventListener("DOMContentLoaded", () => {
      const sections = document.querySelectorAll("main[id], section[id]");
      const navLinks = document.querySelectorAll(".nav-link");
      const header = document.getElementById("header-wrapper") || document.querySelector("header");

      function onScroll() {
        const scrollPos = window.scrollY;
        const headerHeight = header.offsetHeight;
        let currentSectionId = "home";

        sections.forEach((section) => {
          const sectionTop = section.offsetTop - headerHeight - 100;

          if (scrollPos >= sectionTop) {
            currentSectionId = section.getAttribute("id");
          }
        });

        if ((window.innerHeight + Math.round(window.scrollY)) >= document.body.offsetHeight - 20) {
          currentSectionId = "contact";
        }

        navLinks.forEach((link) => {
          link.classList.remove("active", "text-white");
          link.classList.add("text-gray-200");

          if (link.getAttribute("href") === `#${currentSectionId}`) {
            link.classList.add("active", "text-white");
            link.classList.remove("text-gray-200");
          }
        });
      }

      navLinks.forEach(link => {
        link.addEventListener("click", function (e) {
          e.preventDefault();
          const targetId = this.getAttribute("href").substring(1);
          const targetElement = document.getElementById(targetId);

          if (targetElement) {
            window.scrollTo({
              top: targetElement.offsetTop - header.offsetHeight - 20,
              behavior: "smooth"
            });
          }
        });
      });

      window.addEventListener("scroll", onScroll);
      onScroll();

      // Market Analysis Tabs
      const tabWeekly = document.getElementById('tab-weekly');
      const tabHot = document.getElementById('tab-hot');
      const contentWeekly = document.getElementById('content-weekly');
      const contentHot = document.getElementById('content-hot');

      if (tabWeekly && tabHot) {
        tabWeekly.addEventListener('click', () => {
          tabWeekly.classList.add('text-arkGreen', 'border-arkGreen');
          tabWeekly.classList.remove('text-gray-500', 'border-transparent');
          tabHot.classList.remove('text-arkGreen', 'border-arkGreen');
          tabHot.classList.add('text-gray-500', 'border-transparent');

          contentWeekly.classList.remove('hidden');
          contentWeekly.classList.add('flex');
          contentHot.classList.add('hidden');
        });

        tabHot.addEventListener('click', () => {
          tabHot.classList.add('text-arkGreen', 'border-arkGreen');
          tabHot.classList.remove('text-gray-500', 'border-transparent');
          tabWeekly.classList.remove('text-arkGreen', 'border-arkGreen');
          tabWeekly.classList.add('text-gray-500', 'border-transparent');

          contentHot.classList.remove('hidden');
          contentWeekly.classList.add('hidden');
          contentWeekly.classList.remove('flex');
        });
      }
    });
  

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

        // Auto-reset logic at midnight
        const todayStr = new Date().toDateString();
        if (data.lastResetDate !== todayStr) {
          if (data.lastResetDate) {
            if (data.mainTodayResult && data.mainTodayResult !== "-") {
              data.mainResult = data.mainTodayResult;
            }
          }
          data.mainTodayResult = "-";
          if (data.liveMarkets) {
            data.liveMarkets.forEach(m => m.result = "-");
          }
          data.lastResetDate = todayStr;

          if (window.supabaseClient) {
            const toSave = { ...data };
            delete toSave._id;
            delete toSave.__v;

            if (toSave.liveMarkets && toSave.liveMarkets.length > 0) {
              const m = toSave.liveMarkets[0];
              toSave.marketName = m.name;
              toSave.openTime = m.openTime;
              toSave.closeTime = m.closeTime;
              toSave.result = m.result;
            }

            window.supabaseClient.from('SiteData').upsert({ ...toSave, id: 1 }).then(() => { });
          }
        }

        const safeText = (id, txt) => {
          const el = document.getElementById(id);
          if (el) el.innerText = String(txt || "-");
        };
        safeText('main-result-time', 'at ' + (data.mainResultTime || ""));
        if (document.getElementById('main-result-display')) document.getElementById('main-result-display').innerText = data.mainResult || "-";
        else safeText('main-result', data.mainResult || "-");
        safeText('main-today-result', data.mainTodayResult || "-");

        function getMarketStatus(m) {
          if (m.result && m.result !== "-" && m.result !== "--") return "RESULT OUT";
          const now = new Date();
          const parseT = (str) => {
            if (!str) return null;
            const parts = str.trim().split(/\s+/);
            if (parts.length < 2) return null;
            let [h, mins] = parts[0].split(':').map(Number);
            const ampm = parts[1].toUpperCase();
            if (ampm === 'PM' && h < 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            const d = new Date(now);
            d.setHours(h, mins, 0, 0);
            return d;
          };
          const op = parseT(m.openTime);
          const cl = parseT(m.closeTime);
          if (!op || !cl) return "CLOSED";
          if (now < op) return "CLOSED";
          if (now >= op && now < cl) return "LIVE";
          return "RESULT OUT";
        }

        const liveContainer = document.getElementById('live-markets-container');
        if (liveContainer) {
          const markets = data.liveMarkets || [];
          if (markets.length === 0) {
            liveContainer.innerHTML = '<div class="text-center py-8 text-gray-500 font-medium bg-gray-50 m-4 rounded">No live markets available.</div>';
          } else {
            liveContainer.innerHTML = markets.map(m => {
              const dynamicStatus = getMarketStatus(m);
            let statusBadge = '';
            if (dynamicStatus === 'LIVE') {
              statusBadge = '<span class="bg-red-100 text-red-600 font-bold text-[10px] px-2 py-0.5 rounded border border-red-300 animate-pulse uppercase">LIVE</span>';
            } else if (dynamicStatus === 'RESULT OUT') {
              statusBadge = '<span class="bg-green-100 text-green-700 font-bold text-[10px] px-2 py-0.5 rounded border border-green-300 uppercase">RESULT OUT</span>';
            } else {
              statusBadge = '<span class="bg-gray-200 text-gray-700 font-bold text-[10px] px-2 py-0.5 rounded border border-gray-300 uppercase">CLOSED</span>';
            }
            return `
            <!-- Mobile View (Admin) -->
            <div class="sm:hidden border-b border-gray-100 p-4 space-y-3 relative">
              <div class="flex justify-between items-center">
                <div>
                  <div class="font-bold flex items-center space-x-2 text-base text-gray-900">
                    <span>${m.marketName || m.name}</span>
                    <i class="fa-solid fa-star text-arkYellow text-xs"></i>
                  </div>
                  <div class="mt-1"><button onclick="editLiveMarket('${m.id}', 'marketName')" class="text-[10px] bg-white border border-gray-400 text-gray-700 px-2 py-0.5 rounded shadow hover:bg-gray-100">✏️ Edit</button></div>
                </div>
                ${statusBadge}
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
                <div class="flex space-x-2">
                  <a href="admin_market_chart.html?marketId=${m.id}" class="text-xs bg-arkGreen text-white px-2 py-1 rounded shadow hover:bg-green-800 uppercase font-bold">List</a>
                  <button onclick="deleteLiveMarket('${m.id}')" class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded border border-red-300 shadow hover:bg-red-200">🗑️ Delete</button>
                </div>
                <div class="flex flex-col items-end">
                  <div class="text-[10px] font-bold text-gray-500 uppercase">Result:</div>
                  <div class="font-black text-arkGreen text-2xl">${m.result}</div>
                  <div class="mt-1"><button onclick="editLiveMarket('${m.id}', 'result')" class="text-[10px] bg-white border border-gray-400 text-gray-700 px-2 py-0.5 rounded shadow hover:bg-gray-100">✏️ Edit</button></div>
                </div>
              </div>
            </div>
            <!-- Desktop View (Admin) -->
            <div class="hidden sm:grid grid-cols-6 gap-4 py-4 px-6 border-b border-gray-100 items-center text-center text-sm hover:bg-gray-50 transition-colors">
              <div class="col-span-1 text-left flex flex-col justify-center">
                <div class="font-bold flex items-center space-x-2 text-gray-900">
                  <span>${m.marketName || m.name}</span>
                  <i class="fa-solid fa-star text-arkYellow text-xs"></i>
                </div>
                <div class="mt-1"><button onclick="editLiveMarket('${m.id}', 'marketName')" class="text-[10px] bg-white border border-gray-400 text-gray-700 px-2 py-0.5 rounded shadow hover:bg-gray-100">✏️ Edit</button></div>
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
                <a href="admin_market_chart.html?marketId=${m.id}" class="inline-block bg-arkGreen text-white text-[10px] font-bold px-3 py-1 rounded shadow hover:bg-green-800 transition-colors uppercase w-max mx-auto">List</a>
              </div>
              <div class="flex flex-col justify-center">
                <div class="font-bold text-arkGreen text-xl">${m.result}</div>
                <div class="mt-1 flex justify-center"><button onclick="editLiveMarket('${m.id}', 'result')" class="text-[10px] bg-white border border-gray-400 text-gray-700 px-2 py-0.5 rounded shadow hover:bg-gray-100">✏️ Edit</button></div>
              </div>
              <div class="flex flex-col justify-center">
                ${statusBadge}
              </div>
              <div class="flex flex-col justify-center">
                <button onclick="deleteLiveMarket('${m.id}')" class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded border border-red-300 shadow hover:bg-red-200 transition-colors">🗑️ Delete</button>
              </div>
            </div>
            `;
          }).join('');
          }
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
          if (hots.length === 0) {
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
      } catch (e) { console.error("Initial state error:", e); }
      // Fetch initial state directly from Supabase
      if (window.supabaseClient) {
        window.supabaseClient.from('SiteData').select('*').limit(1).single()
          .then(({ data, error }) => {
            if (!error && data) {
              updateUI(data);
            } else {
              console.error("Failed to load initial state from Supabase:", error);
            }
          });
      } else {
        // Fallback for local development if Supabase client is missing
        fetch((serverUrl ? serverUrl : '') + '/api/state?t=' + new Date().getTime())
          .then(res => res.json())
          .then(data => updateUI(data))
          .catch(err => console.error("Error fetching initial state:", err));
      }
    });



    function editField(field, type = 'field') {
      const val = prompt("Enter new value:");
      if (val !== null) {
        processUpdate({ type: type, field: field, value: val || '-' });
      }
    }
    function editNested(parent, field) {
      const val = prompt("Enter new value:");
      if (val !== null) {
        processUpdate({ type: 'nested', parent: parent, field: field, value: val || '-' });
      }
    }
    function addHotNumber() {
      const val = prompt("Enter hot number (e.g. 15):");
      if (val !== null && val.trim() !== "") {
        processUpdate({ type: 'array_add', target: 'hotNumbers', value: val });
      }
    }
    function editArray(target, index) {
      const val = prompt("Enter new value:");
      if (val !== null) {
        processUpdate({ type: 'array_edit', target: target, index: index, value: val || '--' });
      }
    }
    function deleteArray(target, index) {
      if (confirm("Delete this?")) processUpdate({ type: 'array_delete', target: target, index: index });
    }
    function addHistoryRow() {
      const date = prompt("Enter date (e.g. 05-08-2026):");
      if (!date) return;
      const result = prompt("Enter result (e.g. 100-20):");
      if (!result) return;
      processUpdate({ type: 'history_add', date: date, result: result });
    }
    function editHistory(id, field) {
      const val = prompt("Enter new value:");
      if (val !== null) {
        processUpdate({ type: 'history_edit', id: id, field: field, value: val || '-' });
      }
    }
    function deleteHistory(id) {
      if (confirm("Delete this row?")) processUpdate({ type: 'history_delete', id: id });
    }
    function addLiveMarket() {
      processUpdate({ type: 'market_add' });
    }
    function editLiveMarket(id, field) {
      const val = prompt("Enter new value:");
      if (val !== null) {
        processUpdate({ type: 'market_edit', id: id, field: field, value: val || '-' });
      }
    }
    function deleteLiveMarket(id) {
      if (confirm("Delete this market?")) processUpdate({ type: 'market_delete', id: id });
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
        window.appState.liveMarkets.push({ id: Date.now().toString(), marketName: "", openTime: "", closeTime: "", result: "", status: "" });
      } else if (payload.type === 'market_delete') {
        window.appState.liveMarkets = window.appState.liveMarkets.filter(m => m.id !== payload.id);
      } else if (payload.type === 'market_edit') {
        const m = window.appState.liveMarkets.find(m => m.id === payload.id);
        if (m) m[payload.field] = payload.value;
      }

      recalcHotNumbers();

      // Save to Supabase 
      if (window.supabaseClient) {
        const _id = window.appState.id || 1;
        
        const toUpdate = {};
        if (payload.type.startsWith('market_')) {
          toUpdate.liveMarkets = window.appState.liveMarkets;
        } else if (payload.type.startsWith('history_')) {
          toUpdate.chartHistory = window.appState.chartHistory;
        } else if (payload.type === 'field') {
          toUpdate[payload.field] = window.appState[payload.field];
        } else if (payload.type.startsWith('array_')) {
          toUpdate[payload.target] = window.appState[payload.target];
        } else {
          Object.assign(toUpdate, window.appState);
          delete toUpdate._id; delete toUpdate.__v; delete toUpdate.id;
        }

        window.supabaseClient.from('SiteData').update(toUpdate).eq('id', _id)
          .then(({ error }) => {
            if (error) {
              console.error("Error saving to Supabase:", error);
              alert("Error saving data: " + error.message);
            }
          });

        // Optimistic UI update
        updateUI(window.appState);
      }
    }
  