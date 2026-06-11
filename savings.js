(function () {
    const KEY = 'navaja_savings';
    let goals = App.load(KEY, []);
    let editingId = null;

    function save() { App.save(KEY, goals); }

    function renderHome() {
        const section = document.getElementById('savingsHome');
        const list = document.getElementById('savingsHomeList');
        if (!section || !list) return;
        section.hidden = goals.length === 0;
        if (!goals.length) return;
        list.innerHTML = goals.map((g, i) => {
            const pct = g.target > 0 ? Math.min((g.current / g.target) * 100, 100) : 0;
            const remaining = Math.max(0, g.target - g.current);
            const color = pct >= 100 ? 'var(--success)' : 'var(--primary)';
            let deadlineStr = '';
            if (g.deadline) {
                const d = new Date(g.deadline + 'T12:00:00');
                deadlineStr = d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
            }
            return '<div class="b-item" style="cursor:pointer;animation:itemIn 0.3s ease both;animation-delay:' + (i * 0.06) + 's" data-gid="' + g.id + '">' +
                '<div class="b-head"><span>' + esc(g.name) + '</span><span style="color:var(--text)">$' + g.current.toFixed(0) + ' / $' + g.target.toFixed(0) + '</span></div>' +
                '<div class="b-track"><div class="b-bar" style="width:' + pct + '%;background:' + color + '"></div></div>' +
                '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-tertiary);margin-top:4px;">' +
                '<span>' + pct.toFixed(0) + '% completado</span>' +
                (deadlineStr ? '<span>Meta: ' + deadlineStr + '</span>' : '') +
                (remaining > 0 ? '<span>Faltan $' + remaining.toFixed(0) + '</span>' : '<span style="color:var(--success)">✓ Completado</span>') +
                '</div></div>';
        }).join('');
        list.querySelectorAll('.b-item').forEach(el => {
            el.addEventListener('click', () => {
                const g = goals.find(x => x.id === el.dataset.gid);
                if (g) openEditor(g.id);
            });
        });
    }

    function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    function openEditor(id) {
        const g = id ? goals.find(x => x.id === id) : null;
        editingId = id;
        document.getElementById('savingsModalTitle').textContent = g ? 'Editar meta' : 'Nueva meta';
        document.getElementById('savingsNameInput').value = g ? g.name : '';
        document.getElementById('savingsTargetInput').value = g ? g.target : '';
        document.getElementById('savingsCurrentInput').value = g ? g.current : 0;
        document.getElementById('savingsDeadlineInput').value = g ? (g.deadline || '') : '';
        document.getElementById('savingsDeleteBtn').style.display = g ? 'flex' : 'none';
        document.getElementById('savingsModal').classList.add('open');
        setTimeout(() => document.getElementById('savingsNameInput').focus(), 300);
    }

    function closeEditor() {
        document.getElementById('savingsModal').classList.remove('open');
        editingId = null;
    }

    document.getElementById('savingsAddHomeBtn')?.addEventListener('click', () => openEditor(null));
    document.getElementById('savingsModalClose')?.addEventListener('click', closeEditor);
    document.getElementById('savingsModal')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeEditor(); });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && document.getElementById('savingsModal').classList.contains('open') && document.activeElement?.closest('#savingsModal')) {
            e.preventDefault();
            document.getElementById('savingsSaveBtn')?.click();
        }
    });
    document.getElementById('savingsSaveBtn')?.addEventListener('click', () => {
        const name = document.getElementById('savingsNameInput').value.trim();
        const target = parseFloat(document.getElementById('savingsTargetInput').value);
        const current = parseFloat(document.getElementById('savingsCurrentInput').value) || 0;
        const deadline = document.getElementById('savingsDeadlineInput').value || null;
        if (!name || !target || target <= 0) return;
        if (editingId) {
            const g = goals.find(x => x.id === editingId);
            if (g) { g.name = name; g.target = target; g.current = current; g.deadline = deadline; }
        } else {
            goals.push({ id: App.uid(), name, target, current, deadline, createdAt: new Date().toISOString().slice(0, 10) });
        }
        save();
        renderHome();
        closeEditor();
    });

    document.getElementById('savingsDeleteBtn')?.addEventListener('click', () => {
        if (!editingId) return;
        const removed = goals.find(g => g.id === editingId);
        const idx = goals.indexOf(removed);
        goals.splice(idx, 1);
        save();
        renderHome();
        closeEditor();
        App.toast('Meta eliminada', 'Deshacer', () => {
            goals.splice(idx, 0, removed);
            save(); renderHome();
        });
    });

    renderHome();
})();
