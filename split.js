(function () {
    const KEY = 'navaja_split';
    const list = document.getElementById('splitList');
    const empty = document.getElementById('splitEmpty');
    const newBtn = document.getElementById('splitNewBtn');
    const modal = document.getElementById('splitModal');
    const closeBtn = document.getElementById('splitModalClose');
    const modalTitle = document.getElementById('splitModalTitle');
    const groupName = document.getElementById('splitGroupName');
    const groupCurrency = document.getElementById('splitGroupCurrency');
    const container = document.getElementById('splitPeopleContainer');
    const personName = document.getElementById('splitPersonName');
    const personAmount = document.getElementById('splitPersonAmount');
    const addPersonBtn = document.getElementById('splitAddPersonBtn');
    const totalEl = document.getElementById('splitTotalAmount');
    const calcBtn = document.getElementById('splitCalculateBtn');
    const splitDeleteBtn = document.getElementById('splitDeleteBtn');
    const resultsDiv = document.getElementById('splitResults');
    const transfersDiv = document.getElementById('splitTransfers');
    const perPersonDiv = document.getElementById('splitPerPerson');

    let groups = App.load(KEY, []);
    let currentGroupId = null;
    let people = [];

    function save() { App.save(KEY, groups); }

    function render() {
        list.innerHTML = '';
        empty.hidden = groups.length > 0;

        const fragment = document.createDocumentFragment();
        groups.forEach(function (g, i) {
            const card = document.createElement('div');
            card.className = 'split-card';
            card.style.animationDelay = (i * 0.05) + 's';

            const total = g.people.reduce(function (s, p) { return s + Number(p.paid); }, 0);
            const currency = g.currency || 'ARS';
            const curSymbol = currency === 'USD' ? 'US$' : '$';
            const paidPeople = g.people.filter(function (p) { return p.settled; }).length;

            card.innerHTML = '<div class="split-card-header" data-id="' + g.id + '">' +
                '<div><div class="split-card-title">' + esc(g.name) + '</div>' +
                '<div style="font-size:12px;color:var(--text-tertiary);margin-top:2px;">' + g.people.length + ' persona(s) — ' + paidPeople + '/' + g.people.length + ' saldaron</div></div>' +
                '<span style="font-size:13px;color:var(--text-secondary);font-weight:600;">' + curSymbol + total.toFixed(2) + '</span></div>' +
                '<div class="split-card-body" style="display:none;">' +
                g.people.map(function (p) {
                    const share = total / g.people.length;
                    const balance = Number(p.paid) - share;
                    const isSettled = p.settled;
                    return '<div class="split-person' + (isSettled ? ' paid' : '') + '">' +
                        '<span class="sp-name">' + esc(p.name) + '</span>' +
                        '<span class="sp-total" style="color:' + (balance >= 0 ? 'var(--success)' : 'var(--expense)') + '">' +
                        (balance >= 0 ? '+' : '') + curSymbol + balance.toFixed(2) + '</span>' +
                        '<button class="sp-settle" data-gid="' + g.id + '" data-pidx="' + g.people.indexOf(p) + '"' + (isSettled ? ' disabled' : '') + '>' + (isSettled ? '✓' : 'Saldar') + '</button></div>';
                }).join('') +
                '</div>';

            card.querySelector('.split-card-header').addEventListener('click', function () {
                const body = card.querySelector('.split-card-body');
                body.style.display = body.style.display === 'none' ? 'block' : 'none';
            });

            card.querySelectorAll('.sp-settle').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const gid = this.dataset.gid;
                    const pidx = parseInt(this.dataset.pidx);
                    const group = groups.find(function (x) { return x.id === gid; });
                    if (group && group.people[pidx]) {
                        group.people[pidx].settled = true;
                        save();
                        render();
                    }
                });
            });

            card.addEventListener('click', function (e) {
                if (e.target.closest('.split-card-header') || e.target.closest('.sp-settle')) return;
                openEditor(g.id);
            });

            fragment.appendChild(card);
        });

        list.appendChild(fragment);
    }

    function esc(s) {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function openEditor(id) {
        const g = id ? groups.find(function (x) { return x.id === id; }) : null;
        currentGroupId = id;
        modalTitle.textContent = g ? 'Editar juntada' : 'Nueva juntada';
        groupName.value = g ? g.name : '';
        if (groupCurrency) groupCurrency.value = g && g.currency ? g.currency : 'ARS';
        people = g ? g.people.map(function (p) { return { ...p }; }) : [];
        splitDeleteBtn.style.display = g ? 'flex' : 'none';
        resultsDiv.hidden = true;
        renderPeople();
        modal.classList.add('open');
        setTimeout(function () { groupName.focus(); }, 300);
    }

    function closeEditor() {
        modal.classList.remove('open');
        currentGroupId = null;
        people = [];
        groupName.value = '';
        personName.value = '';
        personAmount.value = '';
        splitDeleteBtn.style.display = 'none';
        resultsDiv.hidden = true;
    }

    function renderPeople() {
        container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        people.forEach(function (p, i) {
            const row = document.createElement('div');
            row.className = 'split-person-row';
            row.style.animationDelay = (i * 0.04) + 's';
            const currency = groupCurrency ? groupCurrency.value : 'ARS';
            const curSymbol = currency === 'USD' ? 'US$' : '$';
            row.innerHTML = '<span class="split-person-name">' + esc(p.name) + '</span>' +
                '<span class="split-person-paid">' + curSymbol + Number(p.paid).toFixed(2) + '</span>' +
                '<button class="split-person-remove" data-index="' + i + '" aria-label="Quitar">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
            row.querySelector('.split-person-remove').addEventListener('click', function () {
                people.splice(i, 1);
                renderPeople();
            });
            fragment.appendChild(row);
        });
        container.appendChild(fragment);
        const total = people.reduce(function (s, p) { return s + Number(p.paid); }, 0);
        const currency = groupCurrency ? groupCurrency.value : 'ARS';
        const curSymbol = currency === 'USD' ? 'US$' : '$';
        totalEl.textContent = curSymbol + total.toFixed(2);
    }

    function addPerson() {
        const name = personName.value.trim();
        const rawAmount = personAmount.value.replace(',', '.');
        const amount = parseFloat(rawAmount);
        if (!name) { App.toast('Ingresá un nombre'); return; }
        if (!amount || amount <= 0) { App.toast('Ingresá un monto válido'); return; }
        people.push({ name: name, paid: amount, settled: false });
        personName.value = '';
        personAmount.value = '';
        renderPeople();
        personName.focus();
    }

    function calculate() {
        if (!people.length) return;
        const n = people.length;
        const total = people.reduce(function (s, p) { return s + Number(p.paid); }, 0);
        const share = total / n;

        const balances = people.map(function (p) { return { name: p.name, balance: Number(p.paid) - share }; });
        const payers = balances.filter(function (b) { return b.balance < 0; }).map(function (b) { return { ...b, balance: -b.balance }; }).sort(function (a, b) { return b.balance - a.balance; });
        const receivers = balances.filter(function (b) { return b.balance > 0; }).sort(function (a, b) { return b.balance - a.balance; });

        let i = 0, j = 0;
        const transfers = [];
        while (i < payers.length && j < receivers.length) {
            const amount = Math.min(payers[i].balance, receivers[j].balance);
            transfers.push({
                from: payers[i].name,
                to: receivers[j].name,
                amount: Math.round(amount * 100) / 100
            });
            payers[i].balance -= amount;
            receivers[j].balance -= amount;
            if (payers[i].balance < 0.01) i++;
            if (receivers[j].balance < 0.01) j++;
        }

        const settledCount = people.filter(function (p) { return p.settled; }).length;

        transfersDiv.innerHTML = (transfers.length
            ? transfers.map(function (t, idx) {
                return '<div class="transfer-row" style="animation-delay:' + (idx * 0.06) + 's">' +
                    '<span>' + esc(t.from) + '</span>' +
                    '<span class="transfer-arrow">→</span>' +
                    '<span>' + esc(t.to) + '</span>' +
                    '<span style="margin-left:auto;font-weight:700;color:var(--primary);">$' + t.amount.toFixed(2) + '</span></div>';
            }).join('')
            : '<div style="text-align:center;color:var(--text-secondary);padding:10px;">Todos pagaron lo mismo</div>') +
            '<div class="settled-section">' +
            '<div class="settled-title">' + settledCount + '/' + people.length + ' pagaron</div>' +
            people.map(function (p, idx) {
                return '<button class="settled-row ' + (p.settled ? 'settled' : '') + '" data-idx="' + idx + '">' +
                    '<span class="settled-name">' + esc(p.name) + '</span>' +
                    '<span class="settled-badge">' + (p.settled ? '✅ Pagó' : '⏳ Pendiente') + '</span></button>';
            }).join('') +
            '</div>' +
            '<button class="btn-primary share-split-btn" id="shareSplitBtn" style="margin-top:12px;">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>' +
            ' Compartir</button>';

        perPersonDiv.textContent = '$' + total.toFixed(2) + ' total · $' + share.toFixed(2) + ' por persona';
        resultsDiv.hidden = false;

        document.querySelectorAll('.settled-row').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const idx = parseInt(this.dataset.idx);
                people[idx].settled = !people[idx].settled;
                saveGroupLocal();
                calculate();
            });
        });

        const shareBtn = document.getElementById('shareSplitBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', function () {
                let text = '🧾 ' + (groupName.value || 'Dividir gastos') + '\n';
                text += 'Total: $' + total.toFixed(2) + ' · $' + share.toFixed(2) + ' por persona\n\n';
                if (transfers.length) {
                    text += 'Transferencias:\n';
                    transfers.forEach(function (t) {
                        const p = people.find(function (x) { return x.name === t.from; });
                        text += t.from + ' → ' + t.to + ': $' + t.amount.toFixed(2) + (p && p.settled ? ' ✅' : '') + '\n';
                    });
                } else {
                    text += 'Todos pagaron lo mismo\n';
                }
                text += '\n' + settledCount + '/' + people.length + ' pagaron';
                App.share('Navaja — ' + groupName.value, text);
            });
        }

        setTimeout(function () {
            resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    }

    function saveGroupLocal() {
        const name = groupName.value.trim();
        if (!name || !people.length) return;
        if (currentGroupId) {
            const g = groups.find(function (x) { return x.id === currentGroupId; });
            if (g) { g.name = name; g.currency = groupCurrency ? groupCurrency.value : 'ARS'; g.people = people.map(function (p) { return { ...p }; }); }
        } else {
            const newGroup = { id: App.uid(), name: name, currency: groupCurrency ? groupCurrency.value : 'ARS', people: people.map(function (p) { return { ...p }; }) };
            groups.push(newGroup);
            currentGroupId = newGroup.id;
        }
        save();
    }

    function deleteGroup(id) {
    const idx = groups.findIndex(function (g) { return g.id === id; });
    if (idx === -1) return;
    const removed = groups.splice(idx, 1)[0];
    save(); render(); closeEditor();
    App.toast('Juntada eliminada', 'Deshacer', function () {
        groups.splice(idx, 0, removed);
        save(); render();
    });
}

if (splitDeleteBtn) splitDeleteBtn.addEventListener('click', function () {
    if (currentGroupId) deleteGroup(currentGroupId);
});

if (newBtn) newBtn.addEventListener('click', function () { openEditor(null); });
if (closeBtn) closeBtn.addEventListener('click', closeEditor);
if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeEditor(); });
if (addPersonBtn) addPersonBtn.addEventListener('click', addPerson);
if (personAmount) personAmount.addEventListener('keydown', function (e) { if (e.key === 'Enter') addPerson(); });
if (personName) personName.addEventListener('keydown', function (e) { if (e.key === 'Enter') personAmount.focus(); });
if (calcBtn) calcBtn.addEventListener('click', function () { calculate(); saveGroupLocal(); });

render();
})();
