(function() {
  const STORAGE_KEY = 'pf_tx_v1';

  const txForm = document.getElementById('tx-form');
  const txList = document.getElementById('tx-list');
  const balanceEl = document.getElementById('balance');
  const sumIncomeEl = document.getElementById('sum-income');
  const sumExpenseEl = document.getElementById('sum-expense');
  const sumSavingsEl = document.getElementById('sum-savings');
  const pieCanvas = document.getElementById('pie');
  const legendEl = document.getElementById('legend');
  const clearAllBtn = document.getElementById('clear-all');

  let txs = load();

  if (!txs || txs.length === 0) {
    txs = [
      { id: uid(), type: 'income', category: 'Salary', amount: 50000, date: today(-2), note: 'September salary' },
      { id: uid(), type: 'expense', category: 'Rent', amount: 15000, date: today(-25), note: '' },
      { id: uid(), type: 'expense', category: 'Groceries', amount: 4200, date: today(-8), note: 'Weekly groceries' },
      { id: uid(), type: 'expense', category: 'Transport', amount: 800, date: today(-3), note: 'Fuel' }
    ];
    save();
  }

  render();

  txForm.addEventListener('submit', e => {
    e.preventDefault();
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value.trim() || 'Misc';
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('date').value || new Date().toISOString().slice(0, 10);
    const note = document.getElementById('note').value.trim();
    if (isNaN(amount) || amount <= 0) return alert('Enter valid amount');

    const tx = { id: uid(), type, category, amount, date, note };
    txs.unshift(tx);
    save();
    txForm.reset();
    render();
  });

  clearAllBtn.addEventListener('click', () => {
    if (!confirm('Clear all transactions? This cannot be undone.')) return;
    txs = [];
    save();
    render();
  });

  function render() {
    txList.innerHTML = '';
    txs.forEach(tx => {
      const li = document.createElement('li');
      li.className = 'tx-item';
      li.innerHTML = `
        <div class="tx-left">
          <div class="cat-badge" style="background:${colorFor(tx.category)}">${tx.category.charAt(0).toUpperCase()}</div>
          <div class="tx-meta">
            <div class="cat">${escapeHtml(tx.category)}</div>
            <div class="date muted">${tx.date} ${tx.note ? '• ' + escapeHtml(tx.note) : ''}</div>
          </div>
        </div>
        <div>
          <div class="tx-amount ${tx.type === 'expense' ? 'expense' : 'income'}">${tx.type === 'expense' ? '- ' : '+'}₱${format(tx.amount)}</div>
          <div style="text-align:right;margin-top:6px"><button data-id="${tx.id}" class="btn ghost small delete">Delete</button></div>
        </div>`;
      txList.appendChild(li);
    });

    Array.from(document.querySelectorAll('.delete')).forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        txs = txs.filter(t => t.id !== id);
        save();
        render();
      });
    });

    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;
    sumIncomeEl.textContent = `₱${format(income)}`;
    sumExpenseEl.textContent = `₱${format(expense)}`;
    sumSavingsEl.textContent = `₱${format(Math.max(0, balance))}`;
    balanceEl.textContent = `₱${format(balance)}`;

    drawPie();
  }

  function drawPie() {
    const ctx = pieCanvas.getContext('2d');
    const w = pieCanvas.width, h = pieCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const expenses = txs.filter(t => t.type === 'expense');
    const byCat = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
    const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
      ctx.font = '16px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('No expense data', w / 2 - 50, h / 2);
      legendEl.innerHTML = '';
      return;
    }
    const total = entries.reduce((s, e) => s + e[1], 0);
    const colors = entries.map(([k]) => colorFor(k));

    let start = -Math.PI / 2;
    entries.forEach(([k, val], i) => {
      const slice = val / total * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2);
      ctx.arc(w / 2, h / 2, Math.min(w, h) / 2 - 10, start, start + slice);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();
      start += slice;
    });

    legendEl.innerHTML = '';
    entries.forEach(([k, val], i) => {
      const percent = (val / total * 100).toFixed(1);
      const div = document.createElement('div');
      div.className = 'leg';
      div.innerHTML = `<div class="sw" style="background:${colors[i]}"></div><div>${escapeHtml(k)} • ₱${format(val)} (${percent}%)</div>`;
      legendEl.appendChild(div);
    });
  }

  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(txs)); }
  function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { return []; } }

  function uid() { return Math.random().toString(36).slice(2, 10); }
  function format(n) { return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function today(offset = 0) { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); }
  function colorFor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const h = Math.abs(hash) % 360;
    return `hsl(${h} 80% 45% / 0.95)`;
  }
  function escapeHtml(s) { return (s || '').replace(/[&<>\"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[c]); }

})();
