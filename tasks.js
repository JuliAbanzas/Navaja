(function () {
    const KEY = 'navaja_tasks';
    const form = document.getElementById('taskForm');
    const input = document.getElementById('taskInput');
    const dateInput = document.getElementById('taskDateInput');
    const list = document.getElementById('taskList');
    const empty = document.getElementById('tasksEmpty');

    let tasks = App.load(KEY, []);

    function save() { App.save(KEY, tasks); }

    function dueLabel(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr + 'T12:00:00');
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diff = Math.ceil((d - today) / 86400000);
        if (diff < 0) return 'Vencida';
        if (diff === 0) return 'Hoy';
        if (diff === 1) return 'Mañana';
        if (diff <= 6) return d.toLocaleDateString('es', { weekday: 'short' });
        return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
    }

    function isOverdue(t) {
        if (!t.dueDate || t.done) return false;
        const d = new Date(t.dueDate + 'T12:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d < today;
    }

    function render(animate = false) {
        const sorted = [...tasks].sort((a, b) => {
            if (a.done !== b.done) return a.done ? 1 : -1;
            if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            return 0;
        });

        list.innerHTML = '';
        empty.hidden = tasks.length === 0;
        const fragment = document.createDocumentFragment();
        sorted.forEach((t, i) => {
            const li = document.createElement('li');
            li.dataset.index = i;
            if (animate) li.style.animationDelay = (i * 0.04) + 's';

            const check = document.createElement('span');
            check.className = 'check-circle' + (t.done ? ' checked' : '');
            check.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
            check.addEventListener('click', (e) => { e.stopPropagation(); toggle(t.id); });

            const text = document.createElement('span');
            text.className = 'task-text' + (t.done ? ' done' : '');
            text.textContent = t.text;

            const due = document.createElement('span');
            if (t.dueDate) {
                due.className = 'task-due' + (isOverdue(t) ? ' overdue' : '');
                due.textContent = dueLabel(t.dueDate);
                due.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const inp = document.createElement('input');
                    inp.type = 'date';
                    inp.className = 'task-date-picker';
                    inp.value = t.dueDate;
                    li.insertBefore(inp, due);
                    due.hidden = true;
                    inp.focus();
                    const done = () => {
                        const val = inp.value;
                        const idx = tasks.findIndex(x => x.id === t.id);
                        if (idx !== -1) { tasks[idx].dueDate = val || null; save(); render(); }
                    };
                    inp.addEventListener('change', done);
                    inp.addEventListener('blur', () => { if (inp.value !== t.dueDate) done(); });
                });
            }

            const del = document.createElement('button');
            del.className = 'delete-btn';
            del.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
            del.setAttribute('aria-label', 'Eliminar');
            del.addEventListener('click', (e) => { e.stopPropagation(); remove(t.id); });

            li.append(check, text);
            if (due) li.append(due);
            li.append(del);
            fragment.appendChild(li);
        });
        list.appendChild(fragment);

        Array.from(list.children).forEach((li, i) => {
            App.enableSwipe(li, {
                onSwipeLeft: () => { const id = sorted[i]?.id; if (id) remove(id); },
                onSwipeRight: () => { const id = sorted[i]?.id; if (id) toggle(id); }
            });
        });
    }

    function add(text, d) {
        tasks.push({ id: App.uid(), text: text.trim(), done: false, dueDate: d || null });
        save(); render(true);
    }

    function toggle(id) {
        const t = tasks.find(x => x.id === id);
        if (!t) return;
        t.done = !t.done;
        save(); render();
        if (navigator.vibrate) navigator.vibrate(8);
    }

    function remove(id) {
        const idx = tasks.findIndex(x => x.id === id);
        if (idx === -1) return;
        const removed = tasks.splice(idx, 1)[0];
        save(); render();
        App.toast('Tarea eliminada', 'Deshacer', () => {
            tasks.splice(idx, 0, removed);
            save(); render();
        });
    }

    form.addEventListener('submit', e => {
        e.preventDefault();
        const val = input.value.trim();
        if (!val) return;
        add(val, dateInput.value || null);
        input.value = '';
        dateInput.value = '';
        input.focus();
    });

    document.getElementById('tasksDate').textContent = (() => {
        const d = new Date();
        return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
    })();

    render();
})();
