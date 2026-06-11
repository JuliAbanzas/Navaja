(function () {
    window.Home = { refresh };

    function refresh() {
        const dateEl = document.getElementById('homeDate');
        if (dateEl) {
            const d = new Date();
            dateEl.textContent = d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
        }

        const blueRate = App.load('navaja_bluerate', 0);
        const toArs = (t) => t.currency === 'USD' ? Number(t.amount) * (blueRate || 1) : Number(t.amount);

        // Balance
        const tx = App.load('navaja_expenses', []);
        const income = tx.filter(t => t.type === 'income').reduce((s, t) => s + toArs(t), 0);
        const expense = tx.filter(t => t.type === 'expense').reduce((s, t) => s + toArs(t), 0);
        const balance = income - expense;
        const balEl = document.getElementById('homeBalance');
        if (balEl) balEl.textContent = (balance >= 0 ? '' : '-') + '$' + Math.abs(balance).toFixed(2);

        // Month expense
        const now = new Date().toISOString().slice(0, 7);
        const mExpense = tx.filter(t => t.type === 'expense' && t.date.startsWith(now)).reduce((s, t) => s + toArs(t), 0);
        const expEl = document.getElementById('homeExpense');
        if (expEl) expEl.textContent = '$' + mExpense.toFixed(2);

        // Notes count
        const notes = App.load('navaja_notes', []);
        const notesEl = document.getElementById('homeNotes');
        if (notesEl) notesEl.textContent = notes.length;

        // Reminders count
        const reminders = App.load('navaja_reminders', []);
        const remEl = document.getElementById('homeReminders');
        if (remEl) remEl.textContent = reminders.length;

        // Insights
        const day = new Date().getDate();
        const daily = day > 0 ? mExpense / day : 0;
        const dEl = document.getElementById('insightDaily');
        if (dEl) dEl.textContent = '$' + daily.toFixed(2);

        // Top category this month
        const monthTxs = tx.filter(t => t.type === 'expense' && t.date.startsWith(now));
        const byCat = {};
        monthTxs.forEach(t => { const c = t.category || 'Otro'; byCat[c] = (byCat[c] || 0) + toArs(t); });
        const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
        const tcEl = document.getElementById('insightTopCat');
        if (tcEl) tcEl.textContent = sorted.length ? sorted[0][0] : '—';

        const txEl = document.getElementById('insightTxCount');
        if (txEl) txEl.textContent = monthTxs.length;

        // Daily limit bar
        const limit = App.load('navaja_dailyLimit', 0);
        const limitBar = document.getElementById('dailyLimitBar');
        if (limitBar) {
            if (limit > 0) {
                const today = new Date().toISOString().slice(0, 10);
                const todayTotal = tx.filter(t => t.type === 'expense' && t.date === today).reduce((s, t) => s + toArs(t), 0);
                const rawPct = (todayTotal / limit) * 100;
                const pct = Math.min(rawPct, 100);
                const colorClass = rawPct > 100 ? 'danger' : rawPct > 75 ? 'warn' : '';
                limitBar.innerHTML = '<div class="limit-bar"><div class="limit-bar-head"><span>Gastado hoy: $' + todayTotal.toFixed(2) + '</span><span>Límite: $' + limit.toFixed(2) + '</span></div><div class="limit-track"><div class="limit-fill ' + colorClass + '" style="width:' + pct + '%"></div></div></div>';
            } else {
                limitBar.innerHTML = '';
            }
        }
    }

    document.addEventListener('DOMContentLoaded', refresh);
})();
