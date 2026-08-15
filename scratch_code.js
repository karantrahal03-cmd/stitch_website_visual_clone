
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            arkGreen: '#036c46',
            arkTeal: '#37b993',
            arkYellow: '#fcbe2d',
            arkLightYellow: '#FDE68A',
            arkDarkGrey: '#3f3f3f',
            arkLightGrey: '#F5F5F5'
          },
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
          },
        }
      }
    }
  

    // Tab logic
    document.addEventListener("DOMContentLoaded", () => {
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

    // Data fetching logic
    const serverUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'https://ankbazar.onrender.com' : '';

    if (window.supabaseClient) {
      window.supabaseClient.channel('custom-all-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'SiteData' }, payload => {
          updateUI(payload.new);
        })
        .subscribe();
    }

    window.fullChartHistory = [];

    function renderChartHistory(items) {
      const historyContainer = document.getElementById('chart-history-container');
      if (items.length === 0) {
        historyContainer.innerHTML = '<div class="text-center text-gray-500 py-4">No results found for this date.</div>';
        return;
      }
      historyContainer.innerHTML = items.map(item => `<div class="border border-gray-200 rounded-md flex items-center justify-between px-6 py-3 mb-2">
        <div class="flex-1 text-center font-bold text-gray-700">${item.date}</div>
        <div class="flex-1 text-center font-bold text-arkGreen text-lg">${item.result}</div>
      </div>`).join('');
    }

    document.addEventListener("DOMContentLoaded", () => {
      document.getElementById('chart-search-btn').addEventListener('click', () => {
        const dateInput = document.getElementById('chart-date-input').value;
        if (!dateInput || dateInput === 'dd-mm-yyyy') return;
        const parts = dateInput.split('-');
        if (parts.length === 3) {
          const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          const filtered = window.fullChartHistory.filter(item => item.date === formattedDate);
          renderChartHistory(filtered);
        }
      });

      document.getElementById('chart-clear-btn').addEventListener('click', () => {
        document.getElementById('chart-date-input').value = 'dd-mm-yyyy';
        renderChartHistory(window.fullChartHistory.slice(0, 3));
      });
    });

    function updateUI(data) {
      try {
        if (!data) return;

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
            <div class="grid grid-cols-7 gap-4 py-4 px-6 border-b border-gray-100 items-center text-center text-sm hover:bg-gray-50 transition-colors">
              <div class="col-span-1 font-bold text-left flex items-center space-x-2 text-gray-900">
                <span>${m.marketName || m.name}</span>
                <i class="fa-solid fa-star text-arkYellow text-xs"></i>
              </div>
              <div class="text-gray-700">${m.openTime}</div>
              <div class="text-gray-700">${m.closeTime}</div>
              <div>
                <a href="market_chart.html?marketId=${m.id}" class="inline-block bg-arkGreen text-white text-[10px] font-bold px-3 py-1 rounded shadow hover:bg-green-800 transition-colors uppercase">List</a>
              </div>
              <div class="font-bold text-arkGreen text-xl">${m.result}</div>
              <div>
                ${statusBadge}
              </div>
              <div>
                <button class="text-arkTeal hover:text-green-700 transition-colors"><i class="fa-regular fa-message text-lg"></i></button>
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

        const hotContainer = document.getElementById('hot-numbers-container');
        if (hotContainer) {
          const hots = data.hotNumbers || [];
          if (hots.length === 0) {
            hotContainer.innerHTML = '<div class="text-gray-500 text-sm italic w-full">No hot numbers available for the current selection.</div>';
          } else {
            hotContainer.innerHTML = hots.map(num => `<span class="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm hover-lift cursor-default transition-all duration-300">${num}</span>`).join('');
          }
        }

        window.fullChartHistory = data.chartHistory || [];
        if (!document.getElementById('chart-date-input') || document.getElementById('chart-date-input').value === 'dd-mm-yyyy') {
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


  