(function () {
    // ============ CONSTANTS ============
    const KEYS = { TX: 'navaja_expenses', BUDGET: 'navaja_budgets', ACC: 'navaja_accounts', REM: 'navaja_reminders' };
    const CAT_EMOJIS = { Comida: '🍕', Transporte: '🚌', Salidas: '🎉', Servicios: '💡', Salud: '💊', Compras: '🛒', Sueldo: '💼', Otro: '📦' };
    const DEFAULT_CATS = ['Comida','Transporte','Salidas','Servicios','Salud','Compras','Sueldo','Otro'];
    const CATEGORY_KEY = 'navaja_categories';
    function getCategories() { const c = App.load(CATEGORY_KEY, []); return c.length ? c : DEFAULT_CATS; }
    const METHODS = ['efectivo','debito','credito','mpago','transferencia','otro'];
    const CHART_COLORS = ['#6366f1','#f59e0b','#ef4444','#22c55e','#3b82f6','#ec4899','#14b8a6','#f97316'];
    const DEFAULT_ACCOUNTS = [{ id: 'gen', name: 'General', type: 'efectivo', startingBalance: 0, creditLimit: 0 }];
    const ACCOUNT_TYPES = { efectivo: 'Efectivo', debito: 'Débito', credito: 'Crédito', mpago: 'M.Pago' };
    const METHOD_LABELS = { efectivo: 'Efectivo', debito: 'Débito', credito: 'Crédito', mpago: 'M.Pago', transferencia: 'Transf.', otro: 'Otro' };

    // ============ STATE ============
    let transactions = App.load(KEYS.TX, []);
    let accounts = App.load(KEYS.ACC, DEFAULT_ACCOUNTS);
    let budgets = App.load(KEYS.BUDGET, {});
    let reminders = App.load(KEYS.REM, []);
    let filterType = 'all';
    let filterCategory = '';
    let filterMethod = 'all';
    let filterAccount = 'all';
    let searchQuery = '';
    let editingId = null;
    let remEditingId = null;
    let blueRate = App.load('navaja_bluerate', 0);
    let expenseType = 'expense';
    let calYear = new Date().getFullYear();
    let calMonth = new Date().getMonth();
    let selectedDate = null;

    // ============ DOM REFS ============
    const $ = id => document.getElementById(id);
    const list = $('expenseList');
    const empty = $('expensesEmpty');
    const addBtn = $('expenseAddBtn');
    const exportBtn = $('exportBtn');
    const modal = $('expenseModal');
    const modalTitle = $('expenseModalTitle');
    const closeBtn = $('expenseModalClose');
    const deleteBtn = $('expenseDeleteBtn');
    const amountInput = $('expenseAmountInput');
    const categoryInput = $('expenseCategoryInput');
    const descInput = $('expenseDescInput');
    const dateInput = $('expenseDateInput');
    const expenseCurrency = $('expenseCurrency');
    const saveBtn = $('expenseSaveBtn');
    const segBtns = document.querySelectorAll('.seg-btn');
    const balanceEl = $('balanceAmount');
    const incomeEl = $('totalIncome');
    const expenseEl = $('totalExpense');
    const mcMonth = $('mcMonth'); const mcExpense = $('mcExpense'); const mcIncome = $('mcIncome');
    const mcAvg = $('mcAvg'); const mcChange = $('mcChange'); const mcVs = $('mcVs');
    const ftBtns = document.querySelectorAll('.ft-btn');
    const filterCat = $('filterCategory');
    const fmBtns = document.querySelectorAll('.fm-btn');
    const accountPills = $('accountPills');
    const accountEditBtn = $('accountEditBtn');
    const searchInput = $('searchInput');
    const statsSection = $('statsSection');
    const donutSegments = $('donutSegments');
    const chartTotalText = $('chartTotalText');
    const chartLegend = $('chartLegend');
    const budgetsSection = $('budgetsSection');
    const budgetsContainer = $('budgetsContainer');
    const editBudgetsBtn = $('editBudgetsBtn');
    const budgetModal = $('budgetModal');
    const budgetModalClose = $('budgetModalClose');
    const budgetFormContainer = $('budgetFormContainer');
    const budgetSaveBtn = $('budgetSaveBtn');
    const expAccount = $('expAccount');
    const expMethod = $('expMethod');
    const cuotasCheck = $('cuotasCheck');
    const cuotasToggle = $('cuotasToggle');
    const cuotasFields = $('cuotasFields');
    const cuotasTotal = $('cuotasTotal');
    const cuotasCurrent = $('cuotasCurrent');
    const cuotasSection = $('cuotasSection');
    const cuotasList = $('cuotasList');
    const recurringCheck = $('recurringCheck');
    const recurringFreq = $('recurringFreq');
    const scanBtn = $('scanBtn');
    const expensePhotoInput = $('expensePhotoInput');
    const expensePhotoBtn = $('expensePhotoBtn');
    const remindersSection = $('remindersSection');
    const remindersList = $('remindersList');
    const remAddBtn = $('remAddBtn');
    const reminderModal = $('reminderModal');
    const reminderModalClose = $('reminderModalClose');
    const remName = $('remName'); const remAmount = $('remAmount');
    const remDay = $('remDay'); const remCategory = $('remCategory');
    const remRepeat = $('remRepeat'); const remMonthRow = $('remMonthRow'); const remMonth = $('remMonth');
    const remModalTitle = $('reminderModal')?.querySelector('h2');
    const remSaveBtn = $('remSaveBtn');
    const accountModal = $('accountModal');
    const accountModalClose = $('accountModalClose');
    const accountList = $('accountList');
    const accountNameInput = $('accountNameInput');
    const accountTypeInput = $('accountTypeInput');
    const accountStartingBalance = $('accountStartingBalance');
    const accountCreditLimit = $('accountCreditLimit');
    const accountExtraFields = $('accountExtraFields');
    const accountAddBtn = $('accountAddBtn');

    // ============ HELPERS ============
    function saveTx() { App.save(KEYS.TX, transactions); App.updateNavBadge(); }
    function saveAcc() { App.save(KEYS.ACC, accounts); }
    function saveBud() { App.save(KEYS.BUDGET, budgets); }
    function saveRem() { App.save(KEYS.REM, reminders); }
    function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
    function getMonth(d) { return d.slice(0, 7); }
    function currMonth() { return new Date().toISOString().slice(0, 7); }
    function prevMonth() { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); }
    function monthLabel(m) { const [y,mo] = m.split('-'); return new Date(y,mo-1).toLocaleDateString('es', { month:'long', year:'numeric' }); }
    function accName(id) { const a = accounts.find(x => x.id === id); return a ? a.name : 'General'; }

    function calcTotals(arr) {
        const toArs = (t) => t.currency === 'USD' ? Number(t.amount) * blueRate : Number(t.amount);
        const income = arr.filter(t => t.type === 'income').reduce((s, t) => s + toArs(t), 0);
        const expense = arr.filter(t => t.type === 'expense').reduce((s, t) => s + toArs(t), 0);
        return { income, expense, balance: income - expense };
    }

    function getFiltered() {
        let arr = [...transactions];
        if (filterType === 'expense') arr = arr.filter(t => t.type === 'expense');
        else if (filterType === 'income') arr = arr.filter(t => t.type === 'income');
        if (filterCategory) arr = arr.filter(t => t.category === filterCategory);
        if (filterMethod !== 'all') arr = arr.filter(t => t.method === filterMethod);
        if (filterAccount !== 'all') arr = arr.filter(t => t.account === filterAccount);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            arr = arr.filter(t => (t.description||'').toLowerCase().includes(q) || (t.category||'').toLowerCase().includes(q) || t.amount.toString().includes(q) || (t.currency||'').toLowerCase().includes(q));
        }
        return arr;
    }

    // ============ ACCOUNTS ============
    function renderAccountPills() {
        const allActive = filterAccount === 'all';
        const allTx = transactions.filter(t => t.type !== 'transfer');
        const allInc = allTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
        const allExp = allTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
        const allBal = allInc - allExp;
        let html = `<button class="apill ${allActive?'active':''}" data-a="all">Todas <span class="apill-bal">${allBal >= 0 ? '' : '-'}$${Math.abs(allBal).toFixed(0)}</span></button>`;
        accounts.forEach(a => {
            const active = filterAccount === a.id;
            const b = accountBalance(a);
            let label;
            if (a.type === 'credito') {
                const pct = b.limit > 0 ? (b.debt / b.limit * 100).toFixed(0) : '';
                label = `<span class="apill-bal" style="color:${b.debt > 0 ? 'var(--expense)' : 'var(--success)'}">$${b.debt.toFixed(0)}${pct ? ' / ' + pct + '%' : ''}</span>`;
            } else {
                label = `<span class="apill-bal">${b.balance >= 0 ? '' : '-'}$${Math.abs(b.balance).toFixed(0)}</span>`;
            }
            html += `<button class="apill ${active?'active':''}" data-a="${a.id}">
                ${esc(a.name)} ${label}
            </button>`;
        });
        accountPills.innerHTML = html;
        accountPills.querySelectorAll('.apill').forEach(b => {
            b.addEventListener('click', () => {
                filterAccount = b.dataset.a;
                renderAccountPills();
                render();
            });
        });
    }

    function accountBalance(a) {
        const tx = transactions.filter(t => t.account === a.id && t.type !== 'transfer');
        const toArs = (t) => t.currency === 'USD' ? Number(t.amount) * (blueRate || 1) : Number(t.amount);
        const inc = tx.filter(t => t.type === 'income').reduce((s, t) => s + toArs(t), 0);
        const exp = tx.filter(t => t.type === 'expense').reduce((s, t) => s + toArs(t), 0);
        if (a.type === 'credito') {
            const debt = Math.max(0, exp - inc);
            return { debt, available: Math.max(0, (a.creditLimit || 0) - debt), limit: a.creditLimit || 0 };
        }
        const balance = (a.startingBalance || 0) + inc - exp;
        return { balance };
    }

    function openAccountEditor() {
        const html = accounts.map((a, i) => {
            const typeLabel = ACCOUNT_TYPES[a.type] || 'Efectivo';
            let extra = '';
            if (a.type === 'credito') {
                const { debt, limit } = accountBalance(a);
                extra = `<input type="number" class="modal-input acc-limit-input" value="${a.creditLimit || 0}" data-id="${a.id}" placeholder="Límite" step="0.01" min="0" style="width:90px;margin-bottom:0;font-size:12px;">`;
            } else {
                extra = `<input type="number" class="modal-input acc-balance-input" value="${a.startingBalance || 0}" data-id="${a.id}" placeholder="Saldo inicial" step="0.01" style="width:90px;margin-bottom:0;font-size:12px;">`;
            }
            return `<div class="acc-row">
                <span class="acc-type-badge">${typeLabel}</span>
                <input type="text" class="modal-input acc-name-input" value="${esc(a.name)}" data-id="${a.id}" style="flex:1;margin-bottom:0;min-width:0;">
                ${extra}
                ${i > 0 ? `<button class="acc-del" data-id="${a.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>` : ''}
            </div>`;
        }).join('');
        accountList.innerHTML = html;
        accountList.querySelectorAll('.acc-name-input').forEach(inp => {
            inp.addEventListener('change', () => {
                const a = accounts.find(x => x.id === inp.dataset.id);
                if (a && inp.value.trim()) a.name = inp.value.trim();
                saveAcc();
            });
        });
        accountList.querySelectorAll('.acc-balance-input').forEach(inp => {
            inp.addEventListener('change', () => {
                const a = accounts.find(x => x.id === inp.dataset.id);
                if (a) a.startingBalance = parseFloat(inp.value) || 0;
                saveAcc(); render();
            });
        });
        accountList.querySelectorAll('.acc-limit-input').forEach(inp => {
            inp.addEventListener('change', () => {
                const a = accounts.find(x => x.id === inp.dataset.id);
                if (a) a.creditLimit = parseFloat(inp.value) || 0;
                saveAcc(); render();
            });
        });
        accountList.querySelectorAll('.acc-del').forEach(b => {
            b.addEventListener('click', () => {
                const id = b.dataset.id;
                accounts = accounts.filter(a => a.id !== id);
                if (filterAccount === id) filterAccount = 'all';
                saveAcc(); openAccountEditor(); render();
            });
        });
        accountModal.classList.add('open');
    }

    accountEditBtn.addEventListener('click', openAccountEditor);
    accountModalClose.addEventListener('click', () => accountModal.classList.remove('open'));
    accountModal.addEventListener('click', e => { if (e.target === accountModal) accountModal.classList.remove('open'); });

    accountTypeInput.addEventListener('change', () => {
        const t = accountTypeInput.value;
        accountStartingBalance.hidden = t === 'credito';
        accountCreditLimit.hidden = t !== 'credito';
    });

    accountAddBtn.addEventListener('click', () => {
        const name = accountNameInput.value.trim();
        if (!name) return;
        const type = accountTypeInput.value;
        const startingBalance = type !== 'credito' ? parseFloat(accountStartingBalance.value) || 0 : 0;
        const creditLimit = type === 'credito' ? parseFloat(accountCreditLimit.value) || 0 : 0;
        accounts.push({ id: App.uid(), name, type, startingBalance, creditLimit });
        accountNameInput.value = ''; accountStartingBalance.value = ''; accountCreditLimit.value = '';
        accountTypeInput.value = 'efectivo'; accountStartingBalance.hidden = false; accountCreditLimit.hidden = true;
        saveAcc(); openAccountEditor(); render(); renderBalance();
    });
    accountNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') accountAddBtn.click(); });

    function populateAccountSelect() {
        expAccount.innerHTML = '<option value="">Cuenta</option>' + accounts.map(a =>
            `<option value="${a.id}">${esc(a.name)}</option>`
        ).join('');
    }

    // ============ SEARCH ============
    searchInput.addEventListener('input', App.debounce(() => {
        searchQuery = searchInput.value.trim();
        render();
    }, 200));

    // ============ REMINDERS ============
    function renderReminders() {
        if (!reminders.length) {
            remindersSection.hidden = false;
            remindersList.innerHTML = '<div style="font-size:13px;color:var(--text-tertiary);padding:8px 0;">Sin vencimientos.</div>';
            return;
        }
        remindersSection.hidden = false;
        const now = new Date(); const currD = now.getDate();

        const enriched = reminders.map(r => {
            const repeat = r.repeat || 'monthly';
            let daysUntil;
            if (repeat === 'yearly' && r.dueMonth) {
                const next = new Date(now.getFullYear(), r.dueMonth - 1, r.dueDay);
                if (next < now) next.setFullYear(next.getFullYear() + 1);
                daysUntil = Math.ceil((next - now) / 86400000);
            } else {
                daysUntil = r.dueDay < currD ? r.dueDay + 31 - currD : r.dueDay - currD;
            }
            return { ...r, daysUntil, repeat };
        });

        const sorted = enriched.sort((a, b) => a.daysUntil - b.daysUntil);

        remindersList.innerHTML = sorted.map(r => {
            const due = r.daysUntil;
            let label;
            if (due <= 0) label = 'Hoy';
            else if (due <= 31) label = `En ${due} día${due > 1 ? 's' : ''}`;
            else if (r.repeat === 'yearly' && r.dueMonth)
                label = new Date(2000, r.dueMonth - 1, r.dueDay).toLocaleDateString('es', { day: 'numeric', month: 'short' });
            else
                label = `Día ${r.dueDay}`;
            return `<div class="rem-card" data-remid="${r.id}">
                <div class="rem-card-info">
                    <span class="rem-card-name">${esc(r.name)}</span>
                    <span class="rem-card-amt">$${Number(r.amount).toFixed(2)}</span>
                </div>
                <span class="rem-card-due ${due<=2?'urgent':due<=7?'soon':''}">${label}</span>
                <button class="rem-card-del" data-id="${r.id}" aria-label="Eliminar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>`;
        }).join('');
        remindersList.querySelectorAll('.rem-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.rem-card-del')) return;
                openReminderEditor(card.dataset.remid);
            });
        });
        remindersList.querySelectorAll('.rem-card-del').forEach(b => {
            b.addEventListener('click', (e) => {
                e.stopPropagation();
                reminders = reminders.filter(r => r.id !== b.dataset.id);
                saveRem(); renderReminders();
            });
        });
    }

    function openReminderEditor(id) {
        const r = id ? reminders.find(x => x.id === id) : null;
        remEditingId = id;
        if (remModalTitle) remModalTitle.textContent = r ? 'Editar vencimiento' : 'Nuevo vencimiento';
        remName.value = r ? r.name : '';
        remAmount.value = r ? r.amount : '';
        remDay.value = r ? r.dueDay : '';
        remCategory.value = r ? (r.category || '') : '';
        remRepeat.value = r ? (r.repeat || 'monthly') : 'monthly';
        remMonthRow.hidden = remRepeat.value !== 'yearly';
        if (r && r.repeat === 'yearly' && r.dueMonth) remMonth.value = r.dueMonth;
        else remMonth.value = '';
        reminderModal.classList.add('open');
        setTimeout(() => remName.focus(), 300);
    }

    remRepeat.addEventListener('change', () => {
        remMonthRow.hidden = remRepeat.value !== 'yearly';
    });

    remAddBtn.addEventListener('click', () => {
        openReminderEditor(null);
    });
    reminderModalClose.addEventListener('click', () => { reminderModal.classList.remove('open'); remEditingId = null; if (remModalTitle) remModalTitle.textContent = 'Nuevo vencimiento'; });
    reminderModal.addEventListener('click', e => { if (e.target === reminderModal) { reminderModal.classList.remove('open'); remEditingId = null; if (remModalTitle) remModalTitle.textContent = 'Nuevo vencimiento'; } });
    remSaveBtn.addEventListener('click', () => {
        const name = remName.value.trim(); const amount = parseFloat(remAmount.value); const day = parseInt(remDay.value);
        if (!name || !amount || !day || day < 1 || day > 31) return;
        const repeat = remRepeat.value;
        const dueMonth = repeat === 'yearly' ? parseInt(remMonth.value) : null;
        if (repeat === 'yearly' && (!dueMonth || dueMonth < 1 || dueMonth > 12)) return;
        if (remEditingId) {
            const r = reminders.find(x => x.id === remEditingId);
            if (r) { r.name = name; r.amount = amount; r.dueDay = day; r.category = remCategory.value; r.repeat = repeat; r.dueMonth = dueMonth; }
        } else {
            reminders.push({ id: App.uid(), name, amount, dueDay: day, category: remCategory.value, repeat, dueMonth });
        }
        remEditingId = null;
        if (remModalTitle) remModalTitle.textContent = 'Nuevo vencimiento';
        saveRem(); renderReminders(); reminderModal.classList.remove('open');
    });

    // ============ MONTHLY ============
    function renderMonthly() {
        const now = currMonth(); const prev = prevMonth();
        const mNow = transactions.filter(t => getMonth(t.date) === now);
        const mPrev = transactions.filter(t => getMonth(t.date) === prev);
        const nt = calcTotals(mNow); const pt = calcTotals(mPrev);
        mcMonth.textContent = monthLabel(now);
        mcExpense.textContent = '$' + nt.expense.toFixed(2);
        mcIncome.textContent = '$' + nt.income.toFixed(2);
        const avg = new Date().getDate() > 0 ? nt.expense / new Date().getDate() : 0;
        mcAvg.textContent = '$' + avg.toFixed(2);
        if (pt.expense > 0) {
            const diff = ((nt.expense - pt.expense) / pt.expense) * 100;
            const sign = diff >= 0 ? '+' : ''; const color = diff > 0 ? 'var(--expense)' : 'var(--success)';
            mcChange.innerHTML = `<span style="color:${color}">${sign}${diff.toFixed(0)}%</span>`;
            mcVs.textContent = 'vs ' + monthLabel(prev);
        } else { mcChange.textContent = nt.expense > 0 ? 'Nuevo' : '—'; mcVs.textContent = ''; }
    }

    // ============ FILTERS ============
    function rebuildCategorySelects() {
        const cats = getCategories();
        const used = new Set(transactions.map(t => t.category).filter(Boolean));
        // Filter dropdown
        const emoji = (c) => CAT_EMOJIS[c] || '📦';
        filterCat.innerHTML = '<option value="">Todas las categorías</option>' +
            cats.filter(c => used.has(c) || c === filterCategory).map(c => `<option value="${c}">${emoji(c)} ${c}</option>`).join('');
        // Form dropdown
        const current = categoryInput.value;
        categoryInput.innerHTML = '<option value="">Categoría</option>' +
            cats.map(c => `<option value="${c}">${emoji(c)} ${c}</option>`).join('');
        categoryInput.value = current;
    }

    function populateFilters() { rebuildCategorySelects(); }
    function renderFilters() {
        ftBtns.forEach(b => b.classList.toggle('active', b.dataset.ft === filterType));
        filterCat.value = filterCategory;
        fmBtns.forEach(b => b.classList.toggle('active', b.dataset.method === filterMethod));
    }
    ftBtns.forEach(b => b.addEventListener('click', () => { filterType = b.dataset.ft; renderFilters(); render(); }));
    filterCat.addEventListener('change', () => { filterCategory = filterCat.value; render(); });
    fmBtns.forEach(b => b.addEventListener('click', () => { filterMethod = b.dataset.method; renderFilters(); render(); }));

    // ============ CHART & BUDGETS ============
    function renderChart() {
        const expenseTxs = transactions.filter(t => t.type === 'expense' && (!filterAccount || filterAccount === 'all' || t.account === filterAccount));
        const toArs = (t) => t.currency === 'USD' ? Number(t.amount) * (blueRate || 1) : Number(t.amount);
        const total = expenseTxs.reduce((s, t) => s + toArs(t), 0);
        statsSection.hidden = total === 0;
        if (total === 0) return;
        const byCat = {};
        expenseTxs.forEach(t => { const c = t.category || 'Otro'; byCat[c] = (byCat[c] || 0) + toArs(t); });
        const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
        const r = 38; const circ = 2 * Math.PI * r;
        let segments = '', offset = 0; const legendItems = [];
        sorted.forEach(([cat, amt], i) => {
            const pct = amt / total; const len = pct * circ; const color = CHART_COLORS[i % CHART_COLORS.length];
            segments += `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="10"
                stroke-dasharray="${len} ${circ-len}" stroke-dashoffset="${-offset}"
                transform="rotate(-90 50 50)" style="transition:stroke-dasharray 0.6s ease,stroke-dashoffset 0.6s ease;"/>`;
            offset += len;
            legendItems.push({ color, label: cat, pct: (pct*100).toFixed(0), amt });
        });
        donutSegments.innerHTML = segments;
        chartTotalText.textContent = '$' + total.toFixed(0);
        chartLegend.innerHTML = legendItems.map(l =>
            `<div class="cl-item" style="animation-delay:${legendItems.indexOf(l)*0.03}s">
                <span class="cl-dot" style="background:${l.color}"></span>
                <span class="cl-label">${esc(l.label)}</span>
                <span class="cl-pct">${l.pct}%</span>
                <span class="cl-amt">$${l.amt.toFixed(0)}</span>
            </div>`
        ).join('');
    }

    function renderBudgets() {
        const expenseTxs = transactions.filter(t => t.type === 'expense');
        const toArs = (t) => t.currency === 'USD' ? Number(t.amount) * (blueRate || 1) : Number(t.amount);
        const byCat = {};
        expenseTxs.forEach(t => { const c = t.category || 'Otro'; byCat[c] = (byCat[c] || 0) + toArs(t); });
        let has = false;
        budgetsContainer.innerHTML = getCategories().map(c => {
            const b = budgets[c]; if (!b || b <= 0) return '';
            has = true; const spent = byCat[c] || 0; const pct = Math.min((spent/b)*100, 100);
            const color = pct > 100 ? 'var(--expense)' : pct > 75 ? '#f59e0b' : 'var(--success)';
            return `<div class="b-item">
                <div class="b-head"><span>${CAT_EMOJIS[c]||''} ${esc(c)}</span><span>$${spent.toFixed(0)} / $${b.toFixed(0)}</span></div>
                <div class="b-track"><div class="b-bar" style="width:${pct}%;background:${color}"></div></div>
            </div>`;
        }).filter(Boolean).join('');
        if (!has) budgetsContainer.innerHTML = '<div class="b-empty">Sin presupuestos</div>';
    }

    function renderTopDays() {
        const container = $('topDaysContainer');
        if (!container) return;
        const expenseTxs = transactions.filter(t => t.type === 'expense');
        const toArs = (t) => t.currency === 'USD' ? Number(t.amount) * (blueRate || 1) : Number(t.amount);
        const byDay = {};
        expenseTxs.forEach(t => {
            if (!t.date) return;
            byDay[t.date] = (byDay[t.date] || 0) + toArs(t);
        });
        const sorted = Object.entries(byDay).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const maxAmt = sorted.length ? sorted[0][1] : 0;
        if (!sorted.length) { container.innerHTML = '<div class="b-empty">Sin datos del mes</div>'; return; }
        const now = currMonth();
        const filtered = sorted.filter(([d]) => d.startsWith(now));
        container.innerHTML = (filtered.length ? filtered : sorted).map(([date, amt], i) => {
            const pct = maxAmt > 0 ? (amt / maxAmt) * 100 : 0;
            const label = App.formatDate(date) + ' — ' + date;
            return '<div class="b-item" style="animation:itemIn 0.3s ease both;animation-delay:' + (i * 0.04) + 's">' +
                '<div class="b-head"><span>#' + (i + 1) + ' ' + esc(label) + '</span><span style="color:var(--expense);font-weight:700;">$' + amt.toFixed(0) + '</span></div>' +
                '<div class="b-track"><div class="b-bar" style="width:' + pct + '%;background:linear-gradient(90deg,var(--danger),var(--warning))"></div></div>' +
                '</div>';
        }).join('');
    }

    editBudgetsBtn.addEventListener('click', () => {
        budgetFormContainer.innerHTML = getCategories().map(c =>
            `<div class="b-form-row"><label>${CAT_EMOJIS[c]||''} ${c}</label><input type="number" class="modal-input b-input" data-cat="${c}" value="${budgets[c]||''}" placeholder="$" step="100" min="0"></div>`
        ).join('');
        budgetModal.classList.add('open');
    });
    budgetModalClose.addEventListener('click', () => budgetModal.classList.remove('open'));
    budgetModal.addEventListener('click', e => { if (e.target === budgetModal) budgetModal.classList.remove('open'); });
    budgetSaveBtn.addEventListener('click', () => {
        budgetFormContainer.querySelectorAll('.b-input').forEach(inp => {
            const v = parseFloat(inp.value); const c = inp.dataset.cat;
            if (v && v > 0) budgets[c] = v; else delete budgets[c];
        });
        saveBud(); renderBudgets(); renderChart(); budgetModal.classList.remove('open');
    });

    // ============ CUOTAS ============
    function renderCuotas() {
        const active = transactions.filter(t => t.cuotas && t.cuotas.pagadas < t.cuotas.total);
        cuotasSection.hidden = active.length === 0;
        if (!active.length) return;
        cuotasList.innerHTML = active.map((t, idx) => {
            const c = t.cuotas; const pct = (c.pagadas / c.total) * 100;
            return `<div class="cuota-card" style="animation-delay:${idx*0.04}s">
                <div class="cuota-head">
                    <span class="cuota-name">${esc(t.description||t.category||'Compra')}</span>
                    <span class="cuota-amt">${c.montoCuota.toFixed(2)}/mes</span>
                </div>
                <div class="cuota-info">
                    <span>Cuota ${c.pagadas} de ${c.total}</span>
                    <span>$${((c.total-c.pagadas)*c.montoCuota).toFixed(2)} restantes</span>
                </div>
                <div class="b-track"><div class="b-bar" style="width:${pct}%;background:var(--primary)"></div></div>
                <button class="cuota-pay-btn" data-txid="${t.id}">Pagar cuota ${c.pagadas + 1}</button>
            </div>`;
        }).join('');
        cuotasList.querySelectorAll('.cuota-pay-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tx = transactions.find(x => x.id === btn.dataset.txid);
                if (tx && tx.cuotas && tx.cuotas.pagadas < tx.cuotas.total) {
                    tx.cuotas.pagadas++;
                    saveTx(); renderCuotas(); renderBalance();
                    if (navigator.vibrate) navigator.vibrate(10);
                }
            });
        });
    }

    // ============ MAIN RENDER ============
    function render() {
        populateFilters(); renderFilters(); renderMonthly();
        renderChart(); renderBudgets(); renderTopDays(); renderCuotas(); renderReminders();
        renderComparisonChart(); renderCalendar();

        const filtered = getFiltered();
        list.innerHTML = ''; empty.hidden = filtered.length > 0;

        const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
        let lastDate = null, idx = 0;

        sorted.forEach(t => {
            if (t.date !== lastDate) {
                lastDate = t.date;
                const dl = document.createElement('div'); dl.className = 'date-divider';
                dl.textContent = App.formatDate(t.date) + (t.date === new Date().toISOString().slice(0,10) ? '' : ' — ' + t.date);
                list.appendChild(dl);
            }
            const div = document.createElement('div'); div.className = 'expense-item';
            div.style.animationDelay = (idx * 0.04) + 's'; idx++;

            const iconSvg = t.type === 'income'
                ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
                : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>';

            const methodBadge = t.method && METHOD_LABELS[t.method] ? `<span class="method-badge ${t.method}">${METHOD_LABELS[t.method]}</span>` : '';
            const accBadge = t.account && t.account !== 'gen' ? `<span class="acc-badge">${esc(accName(t.account))}</span>` : '';
            const cuotaTag = t.cuotas ? `<span class="cuota-tag">${t.cuotas.pagadas}/${t.cuotas.total}</span>` : '';
            const photoTag = t.photo ? `<img class="expense-photo" src="${esc(t.photo)}" alt="foto" onclick="event.stopPropagation();window.open('${esc(t.photo)}','_blank')">` : '';
            const recurringTag = t.recurring ? '<span class="recurring-badge">🔄</span>' : '';

            const currencySymbol = t.currency === 'USD' ? 'US$' : '$';

            div.innerHTML = `
                <div class="expense-icon ${t.type}">${iconSvg}</div>
                ${photoTag}
                <div class="expense-info">
                    <div class="expense-desc">${esc(t.description||t.category||'Sin descripción')} ${cuotaTag} ${recurringTag}</div>
                    <div class="expense-meta">${methodBadge}${accBadge}${t.category ? '<span class="cat-badge">'+(CAT_EMOJIS[t.category]||'')+' '+esc(t.category)+'</span>' : ''}${t.currency === 'USD' ? '<span class="cat-badge">US$</span>' : ''}</div>
                </div>
                <div class="expense-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${currencySymbol}${Number(t.amount).toFixed(2)}</div>
            `;
            div.addEventListener('click', () => openEditor(t.id));
            list.appendChild(div);
            App.enableSwipe(div, { onSwipeLeft: () => deleteTransaction(t.id) });
        });
    }

    function renderBalance() {
        const { income, expense, balance } = calcTotals(transactions);
        incomeEl.textContent = '$' + income.toFixed(2);
        expenseEl.textContent = '$' + expense.toFixed(2);
        App.countUp(balanceEl, balance, '', 500);
    }

    // ============ CRUD ============
    function openEditor(id) {
        const t = id ? transactions.find(x => x.id === id) : null;
        editingId = id;
        modalTitle.textContent = t ? 'Editar movimiento' : 'Nuevo movimiento';
        deleteBtn.style.display = t ? 'flex' : 'none';

        if (t) {
            expenseType = t.type;
            amountInput.value = t.amount;
            expenseCurrency.value = t.currency || 'ARS';
            categoryInput.value = t.category || '';
            descInput.value = t.description || '';
            dateInput.value = t.date;
            expAccount.value = t.account || '';
            expMethod.value = t.method || '';
            if (t.cuotas) {
                cuotasCheck.checked = true;
                cuotasFields.hidden = false;
                cuotasTotal.value = t.cuotas.total;
                cuotasCurrent.value = t.cuotas.pagadas;
            } else {
                cuotasCheck.checked = false;
                cuotasFields.hidden = true;
                cuotasTotal.value = '';
                cuotasCurrent.value = '';
            }
            cuotasToggle.hidden = t.method !== 'credito';
            if (t.recurring) {
                recurringCheck.checked = true;
                recurringFreq.hidden = false;
                recurringFreq.value = t.recurringFreq || 'monthly';
            } else {
                recurringCheck.checked = false;
                recurringFreq.hidden = true;
            }
            if (t.photo) {
                expensePhotoBtn.dataset.photo = t.photo;
                expensePhotoBtn.style.background = 'var(--success)';
            } else {
                delete expensePhotoBtn?.dataset.photo;
                expensePhotoBtn.style.background = '';
            }
        } else {
            expenseType = 'expense';
            amountInput.value = ''; categoryInput.value = ''; descInput.value = '';
            expenseCurrency.value = 'ARS';
            dateInput.value = new Date().toISOString().slice(0, 10);
            expAccount.value = ''; expMethod.value = '';
            cuotasCheck.checked = false; cuotasFields.hidden = true;
            cuotasToggle.hidden = true;
            cuotasTotal.value = ''; cuotasCurrent.value = '';
            recurringCheck.checked = false;
            recurringFreq.hidden = true;
            delete expensePhotoBtn?.dataset.photo;
            expensePhotoBtn.style.background = '';
        }
        updateSeg();
        modal.classList.add('open');
        setTimeout(() => amountInput.focus(), 300);
    }

    function updateSeg() { segBtns.forEach(b => b.classList.toggle('active', b.dataset.type === expenseType)); }
    function closeEditor() { modal.classList.remove('open'); editingId = null; }

    function saveTransaction() {
        const amount = parseFloat(amountInput.value);
        if (!amount || amount <= 0) return;
        const data = {
            type: expenseType,
            amount,
            currency: expenseCurrency.value || 'ARS',
            category: categoryInput.value,
            description: descInput.value.trim(),
            date: dateInput.value || new Date().toISOString().slice(0, 10),
            account: expAccount.value || '',
            method: expMethod.value || '',
            cuotas: null,
            photo: expensePhotoBtn?.dataset.photo || null,
            recurring: recurringCheck?.checked || false,
            recurringFreq: recurringCheck?.checked ? (recurringFreq?.value || 'monthly') : null
        };
        delete expensePhotoBtn?.dataset.photo;
        if (expensePhotoBtn) expensePhotoBtn.style.background = '';
        if (data.recurringFreq === null) delete data.recurringFreq;
        if (expenseType !== 'transfer' && data.method === 'credito' && cuotasCheck.checked) {
            const total = parseInt(cuotasTotal.value) || 1;
            const current = parseInt(cuotasCurrent.value) || 1;
            if (total > 1) {
                data.cuotas = { total, pagadas: Math.min(current, total), montoCuota: amount / total };
            }
        }
        if (editingId) {
            const t = transactions.find(x => x.id === editingId);
            if (t) Object.assign(t, data);
        } else {
            data.id = App.uid();
            transactions.push(data);
        }
        saveTx(); render(); renderBalance(); closeEditor();

        // Daily limit check
        const limit = App.load('navaja_dailyLimit', 0);
        if (limit > 0 && data.type === 'expense') {
            const today = new Date().toISOString().slice(0, 10);
            const todayExpenses = transactions.filter(t => t.type === 'expense' && t.date === today);
            const toArs = (t) => t.currency === 'USD' ? Number(t.amount) * (blueRate || 1) : Number(t.amount);
            const todayTotal = todayExpenses.reduce((s, t) => s + toArs(t), 0);
            if (todayTotal > limit) {
                App.toast('Superaste el límite diario de $' + limit.toFixed(2));
                App.notify('Límite diario superado', 'Gastaste $' + todayTotal.toFixed(2) + ' de $' + limit.toFixed(2) + ' permitidos');
            }
        }
    }

    function deleteTransaction(id) {
        const idx = transactions.findIndex(t => t.id === id);
        if (idx === -1) return;
        const removed = transactions.splice(idx, 1)[0];
        saveTx(); render(); renderBalance();
        App.toast('Movimiento eliminado', 'Deshacer', () => {
            transactions.splice(idx, 0, removed);
            saveTx(); render(); renderBalance();
        });
    }

    deleteBtn.addEventListener('click', () => {
        if (!editingId) return;
        deleteTransaction(editingId);
        closeEditor();
    });

    segBtns.forEach(b => b.addEventListener('click', () => {
        expenseType = b.dataset.type;
        updateSeg();
        document.querySelectorAll('.seg-btn').forEach((s, i) => {
            s.textContent = i === 0 ? 'Gasto' : i === 1 ? 'Ingreso' : 'Transf.';
        });
    }));

    expMethod.addEventListener('change', () => {
        cuotasToggle.hidden = expMethod.value !== 'credito';
        if (expMethod.value !== 'credito') { cuotasCheck.checked = false; cuotasFields.hidden = true; }
    });
    cuotasCheck.addEventListener('change', () => {
        cuotasFields.hidden = !cuotasCheck.checked;
    });

    addBtn.addEventListener('click', () => { populateAccountSelect(); openEditor(null); });
    closeBtn.addEventListener('click', closeEditor);
    modal.addEventListener('click', e => { if (e.target === modal) closeEditor(); });
    saveBtn.addEventListener('click', saveTransaction);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && modal.classList.contains('open')) {
            const tag = document.activeElement?.tagName;
            if (tag === 'TEXTAREA' && !e.ctrlKey) return;
            if (tag === 'SELECT' || tag === 'BUTTON' || tag === 'INPUT' && !['text','number'].includes(document.activeElement?.type || '')) return;
            e.preventDefault();
            saveTransaction();
        }
    });
    exportBtn.addEventListener('click', () => {
        if (!transactions.length) return;
        const rows = [['Fecha','Tipo','Categoría','Descripción','Monto','Moneda','Método','Cuenta']];
        [...transactions].sort((a,b) => a.date.localeCompare(b.date)).forEach(t => rows.push([
            t.date, t.type==='income'?'Ingreso':t.type==='transfer'?'Transferencia':'Gasto', t.category||'', t.description||'', t.amount.toFixed(2),
            t.currency || 'ARS', METHOD_LABELS[t.method]||'', accName(t.account)
        ]));
        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'});
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'gastos_'+currMonth()+'.csv'; document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(a.href);
    });

    // ============ PDF REPORT ============
    $('pdfReportBtn')?.addEventListener('click', () => {
        if (!transactions.length) { App.toast('No hay movimientos para exportar'); return; }
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const m = monthLabel(currMonth());
            const { income, expense, balance } = calcTotals(transactions);
            let y = 30;
            doc.setFontSize(22); doc.setFont('helvetica', 'bold');
            doc.text('Navaja', 105, y, { align: 'center' });
            y += 10;
            doc.setFontSize(14); doc.setFont('helvetica', 'normal');
            doc.text('Reporte de gastos - ' + m, 105, y, { align: 'center' });
            y += 14;
            doc.setDrawColor(99, 102, 241); doc.setLineWidth(0.5);
            doc.line(14, y, 196, y);
            y += 10;
            doc.setFontSize(11); doc.setFont('helvetica', 'bold');
            doc.text('Resumen', 14, y); y += 8;
            doc.setFont('helvetica', 'normal');
            doc.text('Ingresos: $' + income.toFixed(2), 14, y); y += 7;
            doc.text('Gastos: $' + expense.toFixed(2), 14, y); y += 7;
            doc.text('Balance: $' + balance.toFixed(2), 14, y); y += 14;

            doc.setFont('helvetica', 'bold');
            doc.text('Categorías', 14, y); y += 8;
            doc.setFont('helvetica', 'normal');
            const byCat = {};
            transactions.filter(t => t.type === 'expense').forEach(t => {
                const c = t.category || 'Otro'; byCat[c] = (byCat[c] || 0) + (t.currency === 'USD' ? Number(t.amount) * blueRate : Number(t.amount));
            });
            const catSorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
            catSorted.forEach(([cat, amt]) => {
                doc.text(cat + ': $' + amt.toFixed(2), 20, y); y += 6;
                if (y > 270) { doc.addPage(); y = 20; }
            });
            y += 8;

            doc.setFont('helvetica', 'bold');
            doc.text('Últimos movimientos', 14, y); y += 8;
            doc.setFont('helvetica', 'normal');
            const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
            recent.forEach(t => {
                const sign = t.type === 'income' ? '+' : '-';
                const cur = t.currency === 'USD' ? 'US$' : '$';
                const s = sign + cur + t.amount.toFixed(2) + ' - ' + esc(t.description || t.category || '') + ' (' + t.date + ')';
                doc.text(s, 20, y); y += 5;
                if (y > 275) { doc.addPage(); y = 20; }
            });

            doc.save('navaja_reporte_' + currMonth() + '.pdf');
        } catch (e) {
            App.toast('Error al generar PDF: ' + e.message);
        }
    });

    // ============ VOICE INPUT ============
    const voiceBtn = $('voiceInputBtn');
    const voiceResult = $('voiceResult');
    let recognition = null;
    if (voiceBtn && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        voiceBtn.addEventListener('click', () => {
            try {
                if (!recognition) {
                    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                    recognition.lang = 'es-AR';
                    recognition.interimResults = false;
                    recognition.continuous = false;
                    recognition.onresult = (event) => {
                        const t = event.results[0][0].transcript;
                        voiceResult.hidden = false;
                        voiceResult.textContent = 'Escuché: "' + t + '"';
                        const match = t.match(/(\d+[.,]?\d*)\s*(.+)/);
                        if (match) {
                            const amt = parseFloat(match[1].replace(',', '.'));
                            const rest = match[2].trim();
                            if (amt && amt > 0) {
                                $('expenseAmountInput').value = amt;
                                const cats = getCategories();
                                const foundCat = cats.find(c => rest.toLowerCase().startsWith(c.toLowerCase().slice(0, 3)));
                                if (foundCat) {
                                    $('expenseCategoryInput').value = foundCat;
                                    $('expenseDescInput').value = rest.slice(foundCat.length).trim();
                                } else {
                                    $('expenseDescInput').value = rest;
                                }
                                document.querySelector('.seg-btn[data-type="expense"]')?.click();
                            }
                        }
                        voiceBtn.style.background = '';
                        setTimeout(() => { voiceResult.hidden = true; }, 4000);
                    };
                    recognition.onerror = () => {
                        voiceBtn.style.background = '';
                        voiceResult.hidden = false;
                        voiceResult.textContent = 'No se pudo escuchar. Probá escribiendo.';
                        voiceResult.style.color = 'var(--danger)';
                        setTimeout(() => { voiceResult.hidden = true; voiceResult.style.color = ''; }, 3000);
                    };
                    recognition.onend = () => { voiceBtn.style.background = ''; };
                }
                recognition.start();
                voiceBtn.style.background = 'var(--primary)';
            } catch (e) { App.toast('Error al iniciar micrófono'); }
        });
    } else if (voiceBtn) {
        voiceBtn.style.opacity = '0.3';
        voiceBtn.title = 'Micrófono no disponible en este navegador';
    }

    // ============ BARCODE SCANNER ============
    if (scanBtn) {
        scanBtn.addEventListener('click', async () => {
            if (document.querySelector('.scan-overlay')) return;
            if (!('BarcodeDetector' in window)) {
                App.toast('Escáner no disponible en este navegador');
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                const overlay = document.createElement('div');
                overlay.className = 'scan-overlay';
                overlay.innerHTML = '<video class="scan-video" autoplay playsinline></video><button class="scan-close" id="scanCloseBtn">✕</button>';
                document.body.appendChild(overlay);
                const video = overlay.querySelector('video');
                video.srcObject = stream;
                await video.play();
                const detector = new BarcodeDetector();
                const closeScan = () => { if (stream) stream.getTracks().forEach(t => t.stop()); overlay.remove(); };
                overlay.querySelector('#scanCloseBtn').addEventListener('click', closeScan);
                const detectLoop = async () => {
                    if (!overlay.parentNode) return;
                    try {
                        const barcodes = await detector.detect(video);
                        if (barcodes.length > 0) {
                            const code = barcodes[0].rawValue;
                            descInput.value = code;
                            closeScan();
                            App.toast('Código: ' + code);
                            return;
                        }
                    } catch (_) {}
                    requestAnimationFrame(detectLoop);
                };
                detectLoop();
            } catch (_) {
                App.toast('Error al acceder a la cámara');
            }
        });
    }

    // ============ PHOTO ATTACHMENT ============
    if (expensePhotoBtn && expensePhotoInput) {
        expensePhotoBtn.addEventListener('click', () => expensePhotoInput.click());
        expensePhotoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const MAX = 400;
                    let w = img.width, h = img.height;
                    if (w > MAX || h > MAX) {
                        if (w > h) { h = h * MAX / w; w = MAX; }
                        else { w = w * MAX / h; h = MAX; }
                    }
                    const c = document.createElement('canvas');
                    c.width = w; c.height = h;
                    const ctx = c.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    expensePhotoBtn.dataset.photo = c.toDataURL('image/jpeg', 0.7);
                    expensePhotoBtn.style.background = 'var(--success)';
                    App.toast('Foto agregada');
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // ============ RECURRING EXPENSES ============
    recurringCheck?.addEventListener('change', () => {
        recurringFreq.hidden = !recurringCheck.checked;
    });

    function processRecurring() {
        const now = new Date();
        const currMonth = now.toISOString().slice(0, 7);
        const currYear = now.getFullYear();
        let changed = false;
        transactions.forEach(t => {
            if (!t.recurring) return;
            const tMonth = t.date.slice(0, 7);
            const tYear = parseInt(t.date.slice(0, 4));
            const dueDay = parseInt(t.date.slice(8, 10));
            const baseId = t.originalId || t.id;
            let shouldAdd = false;
            if (t.recurringFreq === 'monthly') {
                if (tMonth !== currMonth) {
                    const exists = transactions.some(x => x.originalId === baseId && x.date.startsWith(currMonth));
                    if (!exists) shouldAdd = true;
                }
            } else if (t.recurringFreq === 'yearly') {
                if (tYear < currYear) {
                    const exists = transactions.some(x => x.originalId === baseId && x.date.startsWith(currYear + '-' + t.date.slice(5, 7)));
                    if (!exists) shouldAdd = true;
                }
            }
            if (shouldAdd) {
                const effectiveDay = Math.min(dueDay, new Date(parseInt(currMonth.slice(0,4)), parseInt(currMonth.slice(5,7)), 0).getDate());
                const newDate = currMonth + '-' + String(effectiveDay).padStart(2, '0');
                transactions.push({
                    ...t,
                    id: App.uid(),
                    originalId: baseId,
                    date: newDate,
                    description: (t.description || t.category || 'Gasto recurrente') + ' 🔄'
                });
                changed = true;
            }
        });
        if (changed) {
            saveTx();
            render();
            renderBalance();
        }
    }

    // ============ COMPARISON CHART ============
    function renderComparisonChart() {
        const canvas = $('comparisonChart');
        if (!canvas || !canvas.parentElement) return;
        const rect = canvas.parentElement.getBoundingClientRect();
        if (rect.width === 0) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = 200 * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = '200px';
        ctx.scale(dpr, dpr);
        const w = canvas.width / dpr;
        const h = 200;

        const now = new Date();
        const currM = now.toISOString().slice(0, 7);
        const prevD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevM = prevD.toISOString().slice(0, 7);
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysInPrev = new Date(prevD.getFullYear(), prevD.getMonth() + 1, 0).getDate();

        const toArs = (t) => t.currency === 'USD' ? Number(t.amount) * (blueRate || 1) : Number(t.amount);
        const currByDay = {};
        const prevByDay = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            if (t.date.startsWith(currM)) {
                const d = parseInt(t.date.slice(8, 10));
                currByDay[d] = (currByDay[d] || 0) + toArs(t);
            } else if (t.date.startsWith(prevM)) {
                const d = parseInt(t.date.slice(8, 10));
                prevByDay[d] = (prevByDay[d] || 0) + toArs(t);
            }
        });

        const maxVal = Math.max(...Object.values(currByDay), ...Object.values(prevByDay), 1);
        const pad = 30;
        const chartW = w - pad * 2;
        const chartH = h - 40;

        ctx.clearRect(0, 0, w, h);

        const getStyle = (prop) => getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
        const primaryColor = getStyle('--primary') || '#6366f1';
        const tertiaryColor = getStyle('--text-tertiary') || '#9ca3af';

        function drawLine(data, color, days) {
            if (!Object.keys(data).length) return;
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            const points = [];
            for (let d = 1; d <= days; d++) {
                const x = pad + ((d - 1) / (days - 1 || 1)) * chartW;
                const y = pad + 10 + (1 - (data[d] || 0) / maxVal) * chartH;
                points.push({ x, y });
            }
            points.forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
            ctx.stroke();
            // Dots
            points.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
            });
        }

        drawLine(currByDay, primaryColor, daysInMonth);
        drawLine(prevByDay, tertiaryColor, daysInPrev);

        // Legend
        ctx.font = '11px sans-serif';
        ctx.fillStyle = primaryColor;
        ctx.fillText('Este mes', pad, 20);
        ctx.fillStyle = tertiaryColor;
        ctx.fillText('Mes anterior', pad + 80, 20);
    }

    // ============ CALENDAR ============
    function renderCalendar() {
        const grid = $('calendarGrid');
        const monthLabel = $('calMonth');
        const detail = $('calDayDetail');
        if (!grid || !monthLabel) return;

        const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        monthLabel.textContent = months[calMonth] + ' ' + calYear;

        const firstDay = new Date(calYear, calMonth, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const daysInPrev = new Date(calYear, calMonth, 0).getDate();

        const headers = ['D','L','M','M','J','V','S'];
        let html = headers.map(function (h) { return '<div class="cal-header">' + h + '</div>'; }).join('');

        const monthStart = calYear + '-' + String(calMonth + 1).padStart(2, '0');
        const byDay = {};
        const dayTx = {};
        transactions.filter(function (t) { return t.type === 'expense' && t.date && t.date.startsWith(monthStart); }).forEach(function (t) {
            const d = parseInt(t.date.slice(8, 10));
            const amt = t.currency === 'USD' ? Number(t.amount) * (blueRate || 1) : Number(t.amount);
            byDay[d] = (byDay[d] || 0) + amt;
            if (!dayTx[d]) dayTx[d] = [];
            dayTx[d].push(t);
        });

        const amounts = Object.values(byDay);
        const maxAmt = Math.max.apply(null, amounts.length ? amounts : [1]);

        const today = new Date();
        const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

        const startDay = (firstDay + 6) % 7;

        for (let i = 0; i < startDay; i++) {
            const prevDate = daysInPrev - startDay + 1 + i;
            html += '<div class="cal-day other-month">' + prevDate + '</div>';
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const total = byDay[d] || 0;
            let dotHtml = '';
            if (total > 0) {
                const pct = total / maxAmt;
                let color;
                if (pct <= 0.33) color = 'var(--success)';
                else if (pct <= 0.66) color = 'var(--warning)';
                else color = 'var(--danger)';
                dotHtml = '<div class="cal-dot" style="background:' + color + '"></div>';
            }
            const dateStr = calYear + '-' + String(calMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
            const isToday = dateStr === todayStr;
            const isSelected = selectedDate === dateStr;
            html += '<div class="cal-day' + (isToday ? ' today' : '') + (isSelected ? ' selected' : '') + '" data-date="' + dateStr + '">' + d + dotHtml + '</div>';
        }

        const totalCells = startDay + daysInMonth;
        const remaining = (7 - totalCells % 7) % 7;
        for (let i = 1; i <= remaining; i++) {
            html += '<div class="cal-day other-month">' + i + '</div>';
        }

        grid.innerHTML = html;

        grid.querySelectorAll('.cal-day:not(.other-month)').forEach(function (cell) {
            cell.addEventListener('click', function () {
                const date = this.dataset.date;
                selectedDate = selectedDate === date ? null : date;
                renderCalendar();
            });
        });

        if (selectedDate) {
            renderDayDetail(selectedDate);
        } else {
            detail.hidden = true;
        }
    }

    function renderDayDetail(date) {
        const detail = $('calDayDetail');
        if (!date) { detail.hidden = true; return; }
        const txs = transactions.filter(function (t) { return t.date === date && t.type === 'expense'; });
        if (!txs.length) { detail.hidden = true; return; }
        detail.hidden = false;
        detail.innerHTML = txs.sort(function (a, b) { return Number(b.amount) - Number(a.amount); }).map(function (t) {
            const cur = t.currency === 'USD' ? 'US$' : '$';
            return '<div class="cal-day-detail-item">' +
                '<span>' + esc(t.description || t.category || 'Gasto') + '</span>' +
                '<span class="cal-amt" style="color:' + (t.type === 'income' ? 'var(--success)' : 'var(--expense)') + '">' + (t.type === 'income' ? '+' : '-') + cur + Number(t.amount).toFixed(2) + '</span>' +
                '</div>';
        }).join('');
    }

    // ============ EXPOSED API ============
    window.Expenses = {
        loadCategories() { rebuildCategorySelects(); },
        refresh() { render(); renderBalance(); processRecurring(); }
    };

    // ============ BLUE RATE ============
    const blueRateInput = $('blueRateInput');
    const blueRateSaveBtn = $('blueRateSaveBtn');
    const blueRateFetchBtn = $('blueRateFetchBtn');
    if (blueRateInput) blueRateInput.value = blueRate || '';
    if (blueRateFetchBtn) {
        blueRateFetchBtn.addEventListener('click', async () => {
            blueRateFetchBtn.disabled = true;
            blueRateFetchBtn.style.opacity = '0.5';
            try {
                const res = await fetch('https://api.bluelytics.com.ar/v2/latest');
                const data = await res.json();
                const rate = data.blue?.value_sell || data.blue?.value_buy || data.blue?.sell || 0;
                if (rate && rate > 0) {
                    blueRateInput.value = Math.round(rate);
                    App.toast('Cotización blue: $' + Math.round(rate));
                } else {
                    App.toast('No se pudo obtener la cotización');
                }
            } catch (_) {
                App.toast('Error de conexión — ingresála manualmente');
            }
            blueRateFetchBtn.disabled = false;
            blueRateFetchBtn.style.opacity = '';
        });
    }
    if (blueRateSaveBtn) {
        blueRateSaveBtn.addEventListener('click', () => {
            const v = parseFloat(blueRateInput.value);
            if (v && v > 0) { blueRate = v; App.save('navaja_bluerate', v); }
            else { blueRate = 0; App.save('navaja_bluerate', 0); }
            render(); renderBalance();
            App.toast('Cotización actualizada');
        });
        blueRateInput.addEventListener('keydown', e => { if (e.key === 'Enter') blueRateSaveBtn.click(); });
    }

    // ============ CALENDAR EVENTS ============
    $('calPrev')?.addEventListener('click', function () {
        calMonth--;
        if (calMonth < 0) { calMonth = 11; calYear--; }
        selectedDate = null;
        renderCalendar();
    });
    $('calNext')?.addEventListener('click', function () {
        calMonth++;
        if (calMonth > 11) { calMonth = 0; calYear++; }
        selectedDate = null;
        renderCalendar();
    });

    // ============ INIT ============
    renderAccountPills();
    render();
    renderBalance();
    processRecurring();
})();
