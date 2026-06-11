(function () {
    const KEY = 'navaja_notes';
    const list = document.getElementById('notesList');
    const empty = document.getElementById('notesEmpty');
    const addBtn = document.getElementById('notesAddBtn');
    const modal = document.getElementById('noteModal');
    const closeBtn = document.getElementById('noteModalClose');
    const titleInput = document.getElementById('noteTitleInput');
    const contentInput = document.getElementById('noteContentInput');
    const modalTitle = document.getElementById('noteModalTitle');
    const saveBtn = document.getElementById('noteSaveBtn');
    const searchInput = document.getElementById('notesSearch');
    const colorPicker = document.getElementById('noteColorPicker');

    let notes = App.load(KEY, []);
    let editingId = null;
    let searchQuery = '';
    const COLORS = ['default', '#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8'];
    let selectedColor = 'default';

    function save() { App.save(KEY, notes); }

    function getFiltered() {
        let arr = [...notes];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            arr = arr.filter(function (n) { return (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q); });
        }
        arr.sort(function (a, b) {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return (b.updated || '').localeCompare(a.updated || '');
        });
        return arr;
    }

    function render(animate) {
        list.innerHTML = '';
        const filtered = getFiltered();
        empty.hidden = filtered.length > 0;
        const fragment = document.createDocumentFragment();
        filtered.forEach(function (n, i) {
            const card = document.createElement('div');
            card.className = 'note-card' + (n.pinned ? ' pinned' : '');
            if (n.color && n.color !== 'default') {
                card.style.borderLeftColor = n.color;
            }
            if (animate) card.style.animationDelay = (i * 0.04) + 's';

            const createdStr = n.createdAt ? formatDateTime(n.createdAt) : (n.updated ? App.formatDate(n.updated) : '');

            card.innerHTML = '<div class="note-card-title">' +
                esc(n.title || 'Sin título') +
                '<button class="note-pin-btn' + (n.pinned ? ' pinned' : '') + '" data-id="' + n.id + '">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="' + (n.pinned ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0015 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 00-1.11 1.79l-1.78.9A2 2 0 005 15.24z"/></svg>' +
                '</button></div>' +
                '<div class="note-card-content">' + esc(n.content || '') + '</div>' +
                '<div class="note-card-date">' + (createdStr ? 'Creada el ' + createdStr : '') + '</div>';

            card.querySelector('.note-pin-btn').addEventListener('click', function (e) {
                e.stopPropagation();
                const note = notes.find(function (x) { return x.id === this.dataset.id; }.bind(this));
                if (note) {
                    note.pinned = !note.pinned;
                    save();
                    render();
                }
            });

            card.addEventListener('click', function () { openEditor(n.id); });
            fragment.appendChild(card);
        });
        list.appendChild(fragment);

        Array.from(list.children).forEach(function (card) {
            App.enableSwipe(card, { onSwipeLeft: function () { deleteNote(card.dataset.id); } });
        });
    }

    function formatDateTime(isoStr) {
        const d = new Date(isoStr);
        return d.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
            d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    }

    function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    function openEditor(id) {
        const note = id ? notes.find(function (n) { return n.id === id; }) : null;
        editingId = id;
        modalTitle.textContent = note ? 'Editar nota' : 'Nueva nota';
        titleInput.value = note ? note.title : '';
        contentInput.value = note ? note.content : '';
        selectedColor = note && note.color ? note.color : 'default';
        renderColorPicker();
        modal.classList.add('open');
        setTimeout(function () { titleInput.focus(); }, 300);
    }

    function renderColorPicker() {
        if (!colorPicker) return;
        colorPicker.innerHTML = COLORS.map(function (c) {
            const style = c === 'default' ? 'border:2px dashed var(--border);background:transparent;' : 'background:' + c + ';';
            return '<button class="color-dot' + (selectedColor === c ? ' active' : '') + '" data-color="' + c + '" style="' + style + '"></button>';
        }).join('');
        colorPicker.querySelectorAll('.color-dot').forEach(function (dot) {
            dot.addEventListener('click', function () {
                selectedColor = this.dataset.color;
                renderColorPicker();
            });
        });
    }

    function closeEditor() { modal.classList.remove('open'); editingId = null; titleInput.value = ''; contentInput.value = ''; }

    function saveNote() {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        if (!title && !content) { closeEditor(); return; }
        if (editingId) {
            const n = notes.find(function (n) { return n.id === editingId; });
            if (n) { n.title = title; n.content = content; n.updated = new Date().toISOString(); n.color = selectedColor; }
        } else {
            notes.push({ id: App.uid(), title: title, content: content, updated: new Date().toISOString(), createdAt: new Date().toISOString(), pinned: false, color: selectedColor });
        }
        save(); render(); closeEditor();
    }

    function deleteNote(id) {
        const idx = notes.findIndex(function (n) { return n.id === id; });
        if (idx === -1) return;
        const removed = notes.splice(idx, 1)[0];
        save(); render();
        App.toast('Nota eliminada', 'Deshacer', function () {
            notes.splice(idx, 0, removed);
            save(); render();
        });
    }

    searchInput.addEventListener('input', App.debounce(function () {
        searchQuery = searchInput.value.trim();
        render();
    }, 200));

    addBtn.addEventListener('click', function () { openEditor(null); });
    closeBtn.addEventListener('click', closeEditor);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeEditor(); });
    saveBtn.addEventListener('click', saveNote);
    contentInput.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.ctrlKey) saveNote(); });

    render();
})();
