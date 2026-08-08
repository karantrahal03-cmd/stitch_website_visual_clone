const fs = require('fs');

let html = fs.readFileSync('code.html', 'utf8');

// 1. Add missing IDs to code.html
html = html.replace('<div class="text-5xl font-black text-gray-800">-</div>', '<div id="main-today-result" class="text-5xl font-black text-gray-800">-</div>');
html = html.replace('<div class="">09:00 AM</div>', '<div id="live-open-time" class="">09:00 AM</div>');
html = html.replace('<div class="">07:00 PM</div>', '<div id="live-close-time" class="">07:00 PM</div>');

html = html.replace(/<div class="text-xs font-semibold text-gray-600 mb-2">MON<\/div>\n<div class="text-arkGreen font-bold">---<\/div>/, `<div class="text-xs font-semibold text-gray-600 mb-2">MON</div>\n<div id="weekly-mon" class="text-arkGreen font-bold">---</div>`);
html = html.replace(/<div class="text-xs font-semibold text-gray-600 mb-2">TUE<\/div>\n<div class="text-arkGreen font-bold">---<\/div>/, `<div class="text-xs font-semibold text-gray-600 mb-2">TUE</div>\n<div id="weekly-tue" class="text-arkGreen font-bold">---</div>`);
html = html.replace(/<div class="text-xs font-semibold text-gray-600 mb-2">WED<\/div>\n<div class="text-arkGreen font-bold">---<\/div>/, `<div class="text-xs font-semibold text-gray-600 mb-2">WED</div>\n<div id="weekly-wed" class="text-arkGreen font-bold">---</div>`);
html = html.replace(/<div class="text-xs font-semibold text-gray-600 mb-2">THU<\/div>\n<div class="text-arkGreen font-bold">---<\/div>/, `<div class="text-xs font-semibold text-gray-600 mb-2">THU</div>\n<div id="weekly-thu" class="text-arkGreen font-bold">---</div>`);
html = html.replace(/<div class="text-xs font-semibold text-gray-600 mb-2">FRI<\/div>\n<div class="text-arkGreen font-bold">---<\/div>/, `<div class="text-xs font-semibold text-gray-600 mb-2">FRI</div>\n<div id="weekly-fri" class="text-arkGreen font-bold">---</div>`);
html = html.replace(/<div class="text-xs font-semibold text-gray-600 mb-2">SAT<\/div>\n<div class="text-arkGreen font-bold">---<\/div>/, `<div class="text-xs font-semibold text-gray-600 mb-2">SAT</div>\n<div id="weekly-sat" class="text-arkGreen font-bold">---</div>`);
html = html.replace(/<div class="text-xs font-semibold text-red-600 mb-2">SUN<\/div>\n<div class="text-arkGreen font-bold">---<\/div>/, `<div class="text-xs font-semibold text-red-600 mb-2">SUN</div>\n<div id="weekly-sun" class="text-arkGreen font-bold">---</div>`);

html = html.replace(/<div id="content-hot" class="hidden.*?<\/div>\n<\/div>/s, `<div id="content-hot" class="hidden p-6 text-center bg-gray-50 border border-gray-200 rounded-md">
  <div id="hot-numbers-container" class="flex justify-center space-x-2 mt-4 flex-wrap gap-y-2"></div>
</div>`);

html = html.replace(/<div class="p-6">\n<div class="bg-arkYellow rounded-md overflow-hidden flex items-center justify-between px-6 py-3">\n<div class="font-semibold text-gray-800 flex-1 text-center border-r border-yellow-500">DATE<\/div>\n<div class="font-semibold text-gray-800 flex-1 text-center">ARK BAZAR<\/div>\n<button class="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded shadow text-sm font-medium flex items-center space-x-2">\n<i class="fa-solid fa-rotate-right"><\/i>\n<span class="">Refresh<\/span>\n<\/button>\n<\/div>\n<\/div>/s, `<div class="p-6">
<div class="bg-arkYellow rounded-md overflow-hidden flex items-center justify-between px-6 py-3 mb-2">
<div class="font-semibold text-gray-800 flex-1 text-center border-r border-yellow-500">DATE</div>
<div class="font-semibold text-gray-800 flex-1 text-center">ARK BAZAR</div>
</div>
<div id="chart-history-container" class="space-y-2"></div>
</div>`);

// 2. Client script for code.html
const clientScript = `
<script src="/socket.io/socket.io.js"></script>
<script>
  const socket = io();
  socket.on('site_data_updated', (data) => {
    document.getElementById('main-result').innerText = data.mainResult;
    document.getElementById('main-today-result').innerText = data.mainTodayResult;
    document.getElementById('summary-morning').innerText = data.morningSummary;
    document.getElementById('summary-day').innerText = data.daySummary;
    document.getElementById('summary-evening').innerText = data.eveningSummary;
    document.getElementById('summary-night').innerText = data.nightSummary;
    document.getElementById('live-open-time').innerText = data.liveOpenTime;
    document.getElementById('live-close-time').innerText = data.liveCloseTime;
    document.getElementById('live-result').innerText = data.liveResult;
    document.getElementById('live-status').innerText = data.liveStatus;
    
    document.getElementById('weekly-mon').innerText = data.weekly.mon;
    document.getElementById('weekly-tue').innerText = data.weekly.tue;
    document.getElementById('weekly-wed').innerText = data.weekly.wed;
    document.getElementById('weekly-thu').innerText = data.weekly.thu;
    document.getElementById('weekly-fri').innerText = data.weekly.fri;
    document.getElementById('weekly-sat').innerText = data.weekly.sat;
    document.getElementById('weekly-sun').innerText = data.weekly.sun;
    
    const hotContainer = document.getElementById('hot-numbers-container');
    hotContainer.innerHTML = '';
    if(data.hotNumbers.length === 0) {
       hotContainer.innerHTML = '<div class="text-gray-500 text-sm italic w-full">No hot numbers available for the current selection.</div>';
    } else {
       data.hotNumbers.forEach((num) => {
         hotContainer.innerHTML += \`<span class="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">\${num}</span>\`;
       });
    }
    
    const historyContainer = document.getElementById('chart-history-container');
    historyContainer.innerHTML = '';
    data.chartHistory.forEach((item) => {
      historyContainer.innerHTML += \`<div class="bg-gray-50 border rounded-md flex items-center justify-between px-6 py-3">
        <div class="flex-1 text-center font-semibold text-gray-700">\${item.date}</div>
        <div class="flex-1 text-center font-bold text-arkGreen text-lg">\${item.result}</div>
      </div>\`;
    });
  });
</script>
</body></html>
`;
html = html.replace(/<script src="\/socket\.io\/socket\.io\.js"><\/script>\n<script>[\s\S]*?<\/script>\n<\/body><\/html>/, clientScript);

// Save updated code.html
fs.writeFileSync('code.html', html);
console.log('Updated code.html');

// 3. Clone to admin.html and add buttons
let adminHtml = html;
adminHtml = adminHtml.replace('<main id="home"', `<main id="home"`);
adminHtml = adminHtml.replace('<!-- BEGIN: Today\'s Result -->', `<div class="bg-red-600 text-white font-bold text-center py-2 rounded mb-4 animate-pulse">ADMINISTRATOR MODE: CLICK "✏️ EDIT" TO UPDATE LIVE SITE</div>\n<!-- BEGIN: Today\'s Result -->`);
adminHtml = adminHtml.replace('<title>Ark Bazar - Results</title>', '<title>Admin Dashboard - Ark Bazar</title>');

const editBtn = (field, type='field') => `<div class="mt-1 flex justify-center"><button onclick="editField('${field}', '${type}')" class="text-[10px] bg-white border border-gray-400 text-gray-700 px-2 py-0.5 rounded shadow hover:bg-gray-100">✏️ Edit</button></div>`;
const editBtnNested = (parent, field) => `<div class="mt-1 flex justify-center"><button onclick="editNested('${parent}', '${field}')" class="text-[10px] bg-white border border-gray-400 text-gray-700 px-2 py-0.5 rounded shadow hover:bg-gray-100">✏️ Edit</button></div>`;

const idReplacements = [
  ['id="main-result"', 'mainResult'],
  ['id="main-today-result"', 'mainTodayResult'],
  ['id="summary-morning"', 'summaryMorning'],
  ['id="summary-day"', 'summaryDay'],
  ['id="summary-evening"', 'summaryEvening'],
  ['id="summary-night"', 'summaryNight'],
  ['id="live-open-time"', 'liveOpenTime'],
  ['id="live-close-time"', 'liveCloseTime'],
  ['id="live-result"', 'liveResult'],
  ['id="live-status"', 'liveStatus'],
];

idReplacements.forEach(([idStr, field]) => {
  adminHtml = adminHtml.replace(new RegExp(`(<[^>]+${idStr}[^>]*>.*?<\\/[^>]+>)`, 'g'), `$1\n${editBtn(field)}`);
});

adminHtml = adminHtml.replace(/(<div id="weekly-mon"[^>]*>.*?<\/div>)/, `$1\n${editBtnNested('weekly', 'mon')}`);
adminHtml = adminHtml.replace(/(<div id="weekly-tue"[^>]*>.*?<\/div>)/, `$1\n${editBtnNested('weekly', 'tue')}`);
adminHtml = adminHtml.replace(/(<div id="weekly-wed"[^>]*>.*?<\/div>)/, `$1\n${editBtnNested('weekly', 'wed')}`);
adminHtml = adminHtml.replace(/(<div id="weekly-thu"[^>]*>.*?<\/div>)/, `$1\n${editBtnNested('weekly', 'thu')}`);
adminHtml = adminHtml.replace(/(<div id="weekly-fri"[^>]*>.*?<\/div>)/, `$1\n${editBtnNested('weekly', 'fri')}`);
adminHtml = adminHtml.replace(/(<div id="weekly-sat"[^>]*>.*?<\/div>)/, `$1\n${editBtnNested('weekly', 'sat')}`);
adminHtml = adminHtml.replace(/(<div id="weekly-sun"[^>]*>.*?<\/div>)/, `$1\n${editBtnNested('weekly', 'sun')}`);

adminHtml = adminHtml.replace(/<div id="hot-numbers-container".*?<\/div>/s, `<div id="hot-numbers-container" class="flex justify-center space-x-2 mt-4 flex-wrap gap-y-2"></div>
  <button onclick="addHotNumber()" class="mt-4 text-xs bg-arkGreen text-white px-3 py-1 rounded shadow block mx-auto">➕ Add Hot Number</button>`);

adminHtml = adminHtml.replace(/<div id="chart-history-container" class="space-y-2"><\/div>/s, `<div id="chart-history-container" class="space-y-2"></div>
<button onclick="addHistoryRow()" class="mt-4 text-sm bg-arkGreen text-white px-4 py-2 rounded shadow block mx-auto">➕ Add History Row</button>`);

const adminScript = `
<script src="/socket.io/socket.io.js"></script>
<script>
  const socket = io();
  
  socket.on('site_data_updated', (data) => {
    document.getElementById('main-result').innerText = data.mainResult;
    document.getElementById('main-today-result').innerText = data.mainTodayResult;
    document.getElementById('summary-morning').innerText = data.morningSummary;
    document.getElementById('summary-day').innerText = data.daySummary;
    document.getElementById('summary-evening').innerText = data.eveningSummary;
    document.getElementById('summary-night').innerText = data.nightSummary;
    document.getElementById('live-open-time').innerText = data.liveOpenTime;
    document.getElementById('live-close-time').innerText = data.liveCloseTime;
    document.getElementById('live-result').innerText = data.liveResult;
    document.getElementById('live-status').innerText = data.liveStatus;
    
    document.getElementById('weekly-mon').innerText = data.weekly.mon;
    document.getElementById('weekly-tue').innerText = data.weekly.tue;
    document.getElementById('weekly-wed').innerText = data.weekly.wed;
    document.getElementById('weekly-thu').innerText = data.weekly.thu;
    document.getElementById('weekly-fri').innerText = data.weekly.fri;
    document.getElementById('weekly-sat').innerText = data.weekly.sat;
    document.getElementById('weekly-sun').innerText = data.weekly.sun;
    
    // Render hot numbers with edit buttons
    const hotContainer = document.getElementById('hot-numbers-container');
    hotContainer.innerHTML = '';
    data.hotNumbers.forEach((num, index) => {
      hotContainer.innerHTML += \`<div class="flex flex-col items-center">
        <span class="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">\${num}</span>
        <div class="mt-1 flex space-x-1">
          <button onclick="editArray('hotNumbers', \${index})" class="text-[9px] bg-white border px-1 rounded shadow">✏️</button>
          <button onclick="deleteArray('hotNumbers', \${index})" class="text-[9px] bg-white border px-1 rounded shadow text-red-600">🗑️</button>
        </div>
      </div>\`;
    });
    
    // Render chart history with edit buttons
    const historyContainer = document.getElementById('chart-history-container');
    historyContainer.innerHTML = '';
    data.chartHistory.forEach((item) => {
      historyContainer.innerHTML += \`<div class="bg-gray-50 border rounded-md flex items-center justify-between px-6 py-3">
        <div class="flex-1 text-center font-bold text-gray-700">\${item.date} <button onclick="editHistory('\${item.id}', 'date')" class="ml-2 text-[10px] bg-white border px-1 rounded shadow hover:bg-gray-100">✏️</button></div>
        <div class="flex-1 text-center font-bold text-arkGreen text-lg">\${item.result} <button onclick="editHistory('\${item.id}', 'result')" class="ml-2 text-[10px] bg-white border px-1 rounded shadow hover:bg-gray-100">✏️</button></div>
        <div class="w-[100px] text-right">
          <button onclick="deleteHistory('\${item.id}')" class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded border border-red-300 shadow hover:bg-red-200">🗑️ Delete</button>
        </div>
      </div>\`;
    });
  });

  function editField(field, type='field') {
    const val = prompt("Enter new value:");
    if (val !== null) {
      socket.emit('update_site_data', { type: type, field: field, value: val || '-' });
    }
  }
  function editNested(parent, field) {
    const val = prompt("Enter new value:");
    if (val !== null) {
      socket.emit('update_site_data', { type: 'nested', parent: parent, field: field, value: val || '-' });
    }
  }
  function addHotNumber() {
    const val = prompt("Enter hot number (e.g. 15):");
    if (val !== null && val.trim() !== "") {
      socket.emit('update_site_data', { type: 'array_add', target: 'hotNumbers', value: val });
    }
  }
  function editArray(target, index) {
    const val = prompt("Enter new value:");
    if (val !== null) {
      socket.emit('update_site_data', { type: 'array_edit', target: target, index: index, value: val || '--' });
    }
  }
  function deleteArray(target, index) {
    if(confirm("Delete this?")) socket.emit('update_site_data', { type: 'array_delete', target: target, index: index });
  }
  function addHistoryRow() {
    const date = prompt("Enter date (e.g. 05-08-2026):");
    if (!date) return;
    const result = prompt("Enter result (e.g. 100-20):");
    if (!result) return;
    socket.emit('update_site_data', { type: 'history_add', date: date, result: result });
  }
  function editHistory(id, field) {
    const val = prompt("Enter new value:");
    if (val !== null) {
      socket.emit('update_site_data', { type: 'history_edit', id: id, field: field, value: val || '-' });
    }
  }
  function deleteHistory(id) {
    if(confirm("Delete this row?")) socket.emit('update_site_data', { type: 'history_delete', id: id });
  }
</script>
</body></html>
`;

adminHtml = adminHtml.replace(/<script src="\/socket\.io\/socket\.io\.js"><\/script>\n<script>[\s\S]*?<\/script>\n<\/body><\/html>/, adminScript);

fs.writeFileSync('admin.html', adminHtml);
console.log('Updated admin.html');
