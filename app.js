const App = {
    _listeners: {},
    _deferredPrompt: null,

    init() {
        this.initErrorHandler();
        this.initTheme();
        this.initAccent();
        this.setupNav();
        this.registerSW();
        this.initRipples();
        this.initSettings();
        this.initInstall();
        this.initKeyboard();
        this.initOffline();
        this.initOnboarding();
        this.initNavBadge();
        this.initPullRefresh();
        this.initNotifications();
    },

    // ---------- THEME ----------

    initTheme() {
        const saved = localStorage.getItem('navaja_theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.setTheme(saved || (prefersDark ? 'dark' : 'light'));
        if (!saved) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (!localStorage.getItem('navaja_theme')) this.setTheme(e.matches ? 'dark' : 'light');
            });
        }
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const meta = document.getElementById('themeColorMeta');
        if (meta) meta.content = theme === 'dark' ? '#0c0f15' : '#f5f5f5';
        const btn = document.getElementById('themeToggle');
        if (!btn) return;
        btn.innerHTML = theme === 'dark'
            ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
            : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
    },

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem('navaja_theme', next);
        this.setTheme(next);
    },

    // ---------- ACCENT COLOR ----------

    initAccent() {
        const saved = localStorage.getItem('navaja_accent');
        if (saved) document.documentElement.setAttribute('data-accent', saved);
    },

    setAccent(color) {
        if (color === 'indigo') document.documentElement.removeAttribute('data-accent');
        else document.documentElement.setAttribute('data-accent', color);
        localStorage.setItem('navaja_accent', color);
        this.renderColorPicker();
    },

    renderColorPicker() {
        const el = document.getElementById('colorPicker');
        if (!el) return;
        const colors = [
            { id: 'indigo', label: 'Indigo', color: '#6366f1' },
            { id: 'rose', label: 'Rose', color: '#f43f5e' },
            { id: 'green', label: 'Green', color: '#22c55e' },
            { id: 'blue', label: 'Blue', color: '#3b82f6' },
            { id: 'orange', label: 'Orange', color: '#f97316' },
            { id: 'purple', label: 'Purple', color: '#a855f7' },
            { id: 'teal', label: 'Teal', color: '#14b8a6' },
            { id: 'pink', label: 'Pink', color: '#ec4899' },
        ];
        const current = localStorage.getItem('navaja_accent') || 'indigo';
        el.innerHTML = colors.map(c =>
            '<button class="color-swatch' + (c.id === current ? ' active' : '') + '" data-color="' + c.id + '" style="background:' + c.color + '" aria-label="' + c.label + '"></button>'
        ).join('');
        el.querySelectorAll('.color-swatch').forEach(b => {
            b.addEventListener('click', () => this.setAccent(b.dataset.color));
        });
    },

    // ---------- NAV ----------

    setupNav() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.view;
                const current = document.querySelector('.view.active');
                const next = document.getElementById('view-' + target);
                if (current === next || !next) return;
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                current.classList.remove('animating-in', 'active');
                current.classList.add('animating-out');
                current.addEventListener('animationend', () => { current.classList.remove('animating-out'); current.style.display = ''; }, { once: true });
                next.classList.remove('animating-out');
                next.classList.add('animating-in');
                next.addEventListener('animationend', () => { next.classList.remove('animating-in'); next.classList.add('active'); }, { once: true });
                this.updateAllBadges();
                if (target === 'home' && window.Home) Home.refresh();
                if (target === 'expenses' && window.Expenses) Expenses.refresh();
            });
        });
    },

    registerSW() {
        if (!('serviceWorker' in navigator)) return;
        navigator.serviceWorker.register('sw.js').then(reg => {
            reg.addEventListener('updatefound', () => {
                const sw = reg.installing;
                sw.addEventListener('statechange', () => {
                    if (sw.state === 'installed' && navigator.serviceWorker.controller) {
                        this.toast('Nueva versión disponible', 'Actualizar', () => { location.reload(); }, 8000);
                    }
                });
            });
        });
    },

    initRipples() {
        document.querySelectorAll('.btn-icon, .btn-primary, .nav-btn, .ha-btn').forEach(el => el.classList.add('ripple'));
    },

    // ---------- NOTIFICATIONS ----------

    notify(title, body) {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted' && this.load('navaja_notifications', true)) {
            navigator.serviceWorker.ready.then(reg => {
                if (reg.active) {
                    reg.active.postMessage({ type: 'NOTIFICATION', title, options: { body, icon: '/icon-192.png', badge: '/icon-192.png', vibrate: [100, 50, 100] } });
                }
            });
        }
    },

    // ---------- SETTINGS ----------

    initSettings() {
        document.getElementById('themeToggle')?.addEventListener('click', () => this.toggleTheme());
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.renderCategories();
            this.renderColorPicker();
            const br = document.getElementById('blueRateInput');
            if (br) { var v = localStorage.getItem('navaja_bluerate'); br.value = v ? JSON.parse(v) : ''; }
            const dl = document.getElementById('dailyLimitInput');
            if (dl) { var dlv = localStorage.getItem('navaja_dailyLimit'); dl.value = dlv ? JSON.parse(dlv) : ''; }
            const nt = document.getElementById('notifToggle');
            if (nt) nt.checked = this.load('navaja_notifications', true);
            document.getElementById('settingsModal').classList.add('open');
        });
        document.getElementById('settingsModalClose')?.addEventListener('click', () => document.getElementById('settingsModal').classList.remove('open'));
        document.getElementById('settingsModal')?.addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.classList.remove('open'); });
        document.getElementById('dailyLimitInput')?.addEventListener('change', () => {
            const v = parseFloat(document.getElementById('dailyLimitInput').value);
            if (v && v > 0) localStorage.setItem('navaja_dailyLimit', JSON.stringify(v));
            else localStorage.removeItem('navaja_dailyLimit');
        });
        document.getElementById('notifToggle')?.addEventListener('change', () => {
            this.save('navaja_notifications', document.getElementById('notifToggle').checked);
        });
        document.getElementById('helpTutorialBtn')?.addEventListener('click', () => {
            document.getElementById('settingsModal').classList.remove('open');
            localStorage.removeItem('navaja_onboarding');
            this.initOnboarding();
        });
        document.getElementById('catAddBtn')?.addEventListener('click', () => {
            const inp = document.getElementById('catNameInput');
            const name = inp.value.trim();
            if (!name) return;
            let cats = this.load('navaja_categories', []);
            if (!cats.includes(name)) cats.push(name);
            this.save('navaja_categories', cats);
            inp.value = '';
            this.renderCategories();
            if (window.Expenses) Expenses.loadCategories();
        });
        document.getElementById('catNameInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('catAddBtn').click(); });
        document.getElementById('backupExportBtn')?.addEventListener('click', () => this.exportBackup());
        document.getElementById('backupImportBtn')?.addEventListener('click', () => document.getElementById('backupFileInput').click());
        document.getElementById('backupFileInput')?.addEventListener('change', e => { if (e.target.files[0]) this.importBackup(e.target.files[0]); });
        document.getElementById('firebaseLoginBtn')?.addEventListener('click', () => { if (window.Firebase) Firebase.login(); });
        document.getElementById('firebaseLogoutBtn')?.addEventListener('click', () => { if (window.Firebase) Firebase.logout(); });
        document.getElementById('firebaseSyncBtn')?.addEventListener('click', () => { if (window.Firebase) Firebase.forceSync(); });
        document.getElementById('firebaseHeaderBtn')?.addEventListener('click', () => {
            if (Firebase && Firebase.user) {
                document.getElementById('settingsBtn').click();
            } else if (Firebase) {
                Firebase.login();
            }
        });
    },

    renderCategories() {
        const cats = this.load('navaja_categories', []);
        const list = document.getElementById('catList');
        if (!list) return;
        if (!cats.length) { list.innerHTML = '<div style="font-size:13px;color:var(--text-tertiary);padding:8px 0;">Sin categorías personalizadas</div>'; return; }
        list.innerHTML = cats.map((c, i) =>
            '<div class="acc-row"><span style="flex:1;font-size:14px;font-weight:500;">' + this.esc(c) + '</span>' +
            '<button class="acc-del cat-del" data-idx="' + i + '" aria-label="Eliminar">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>'
        ).join('');
        list.querySelectorAll('.cat-del').forEach(b => b.addEventListener('click', () => {
            let c = this.load('navaja_categories', []);
            c.splice(parseInt(b.dataset.idx), 1);
            this.save('navaja_categories', c);
            this.renderCategories();
            if (window.Expenses) Expenses.loadCategories();
        }));
    },

    // ---------- INSTALL ----------

    initInstall() {
        const isInstalled = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
        const homeBtn = document.getElementById('installHomeBtn');
        if (isInstalled) { if (homeBtn) homeBtn.classList.add('hidden'); return; }

        window.addEventListener('beforeinstallprompt', e => {
            e.preventDefault();
            this._deferredPrompt = e;
            document.getElementById('installBanner')?.classList.add('visible');
            if (homeBtn) homeBtn.classList.remove('hidden');
        });

        const doInstall = () => {
            if (this._deferredPrompt) {
                this._deferredPrompt.prompt();
                this._deferredPrompt.userChoice.then(() => {
                    this._deferredPrompt = null;
                    document.getElementById('installBanner')?.classList.remove('visible');
                    if (homeBtn) homeBtn.classList.add('hidden');
                });
            } else {
                App.toast('Abrí en Chrome o Edge y tocá "Instalar" desde el menú');
            }
        };

        document.getElementById('installBtn')?.addEventListener('click', doInstall);
        document.getElementById('installDismiss')?.addEventListener('click', () => {
            document.getElementById('installBanner')?.classList.remove('visible');
        });
        if (homeBtn) {
            homeBtn.addEventListener('click', doInstall);
            homeBtn.classList.add('hidden');
        }
    },

    // ---------- KEYBOARD ----------

    initKeyboard() {
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
                return;
            }
            if (document.querySelector('.modal-overlay.open')) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            const key = e.key.toLowerCase();
            const notesBtn = document.querySelector('.nav-btn[data-view="notes"]');
            const tasksBtn = document.querySelector('.nav-btn[data-view="tasks"]');
            if (key === 'n' && notesBtn && notesBtn.classList.contains('active')) {
                const btn = document.getElementById('notesAddBtn');
                if (btn) btn.click();
            } else if (key === 't' && tasksBtn && tasksBtn.classList.contains('active')) {
                const inp = document.getElementById('taskInput');
                if (inp) inp.focus();
            } else if (key === 'g') {
                document.querySelector('.nav-btn[data-view="expenses"]')?.click();
            } else if (key === '/') {
                document.getElementById('globalSearchBtn')?.click();
            } else if (key === 'h') {
                document.querySelector('.nav-btn[data-view="home"]')?.click();
            }
        });
    },

    // ---------- OFFLINE ----------

    initOffline() {
        const bar = document.getElementById('offlineBar');
        if (!bar) return;
        const update = () => {
            bar.classList.toggle('visible', !navigator.onLine);
        };
        window.addEventListener('online', update);
        window.addEventListener('offline', update);
        update();
    },

    // ---------- ONBOARDING ----------

    initOnboarding() {
        const seen = localStorage.getItem('navaja_onboarding');
        if (seen) return;
        const overlay = document.getElementById('onboardingOverlay');
        const btn = document.getElementById('onboardingBtn');
        const dots = document.querySelectorAll('.onboarding-dot');
        const slides = document.querySelectorAll('.onboarding-slide');
        if (!overlay || !btn) return;
        let current = 0;

        const show = (idx) => {
            slides.forEach(s => s.classList.toggle('active', parseInt(s.dataset.slide) === idx));
            dots.forEach(d => d.classList.toggle('active', parseInt(d.dataset.index) === idx));
            btn.textContent = idx === slides.length - 1 ? 'Comenzar' : 'Siguiente';
        };

        dots.forEach(d => { d.dataset.index = [...dots].indexOf(d); });

        btn.addEventListener('click', () => {
            current++;
            if (current >= slides.length) {
                overlay.remove();
                localStorage.setItem('navaja_onboarding', '1');
                return;
            }
            show(current);
        });

        overlay.classList.remove('hidden');

        // Touch swipe
        let startX = 0;
        overlay.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
        overlay.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - startX;
            if (Math.abs(dx) > 60) {
                if (dx < 0 && current < slides.length - 1) { current++; show(current); }
                else if (dx > 0 && current > 0) { current--; show(current); }
            }
        }, { passive: true });
    },

    // ---------- PULL TO REFRESH ----------

    initPullRefresh() {
        const views = document.querySelectorAll('.view');
        views.forEach(view => {
            let startY = 0, pulling = false;
            const hint = document.createElement('div');
            hint.className = 'pull-hint hidden';
            hint.textContent = '⬇️ Soltá para actualizar';
            view.parentNode?.insertBefore(hint, view);
            view.addEventListener('touchstart', (e) => {
                if (view.scrollTop === 0) {
                    startY = e.touches[0].clientY;
                    pulling = true;
                }
            }, { passive: true });
            view.addEventListener('touchmove', (e) => {
                if (!pulling) return;
                const dy = e.touches[0].clientY - startY;
                if (dy > 60) {
                    hint.classList.remove('hidden');
                } else {
                    hint.classList.add('hidden');
                }
            }, { passive: true });
            view.addEventListener('touchend', (e) => {
                if (!pulling) return;
                const dy = e.changedTouches[0].clientY - startY;
                pulling = false;
                hint.classList.add('hidden');
                if (dy > 80) {
                    // Refresh current view
                    const active = document.querySelector('.view.active');
                    if (active) {
                        const refreshEvent = new CustomEvent('refreshView', { detail: { viewId: active.id } });
                        document.dispatchEvent(refreshEvent);
                        App.toast('Actualizado');
                    }
                }
            }, { passive: true });
        });
    },

    // ---------- NAV BADGE ----------

    initNavBadge() {
        this.updateNavBadge();
        window.addEventListener('storage', () => this.updateNavBadge());
    },

    updateNavBadge() {
        const badge = document.getElementById('expenseBadge');
        if (!badge) return;
        try {
            const tx = this.load('navaja_expenses', []);
            const now = new Date().toISOString().slice(0, 7);
            const count = tx.filter(t => t.type === 'expense' && t.date && t.date.startsWith(now)).length;
            badge.textContent = count;
            badge.classList.toggle('visible', count > 0);
        } catch (_) {}
    },

    updateAllBadges() {
        this.updateNavBadge();
    },

    // ---------- NOTIFICATIONS PERMISSION ----------

    initNotifications() {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'default') {
            const requestPermission = () => {
                Notification.requestPermission();
                document.removeEventListener('click', requestPermission);
                document.removeEventListener('touchstart', requestPermission);
            };
            document.addEventListener('click', requestPermission, { once: true });
            document.addEventListener('touchstart', requestPermission, { once: true });
        }
    },

    // ---------- SHARE ----------

    share(title, text) {
        if (navigator.share) {
            navigator.share({ title: title || 'Navaja', text: text || '' }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => this.toast('Copiado al portapapeles')).catch(() => {});
        }
    },

    // ---------- SWIPE ----------

    enableSwipe(el, opts) {
        let startX = 0, startY = 0, currentX = 0, swiping = false;
        const onStart = (e) => { var t = e.touches[0]; startX = t.clientX; startY = t.clientY; currentX = startX; swiping = false; };
        const onMove = (e) => {
            var t = e.touches[0];
            currentX = t.clientX;
            var dx = currentX - startX;
            var dy = t.clientY - startY;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
                swiping = true;
                e.preventDefault();
                el.style.transition = 'none';
                el.style.transform = 'translateX(' + dx + 'px)';
                el.style.opacity = 1 - Math.min(Math.abs(dx) / 200, 0.5);
            }
        };
        const onEnd = () => {
            var dx = currentX - startX;
            el.style.transition = 'transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.35s ease';
            el.style.transform = '';
            el.style.opacity = '';
            if (swiping) {
                if (dx < -80 && opts.onSwipeLeft) opts.onSwipeLeft();
                else if (dx > 80 && opts.onSwipeRight) opts.onSwipeRight();
            }
            swiping = false;
        };
        el.addEventListener('touchstart', onStart, { passive: true });
        el.addEventListener('touchmove', onMove, { passive: false });
        el.addEventListener('touchend', onEnd);
        el.addEventListener('touchcancel', onEnd);
    },

    // ---------- TOAST ----------

    toast(msg, action, cb, duration) {
        duration = duration || 4000;
        var container = document.getElementById('toastContainer');
        if (!container) return;
        var existing = container.querySelector('.toast');
        if (existing) existing.remove();
        var el = document.createElement('div');
        el.className = 'toast';
        el.innerHTML = '<span class="toast-msg">' + this.esc(msg) + '</span>' + (action ? '<button class="toast-action">' + this.esc(action) + '</button>' : '');
        container.appendChild(el);
        requestAnimationFrame(function () { el.classList.add('visible'); });
        var timer = setTimeout(dismiss, duration);
        function dismiss() { clearTimeout(timer); el.classList.remove('visible'); setTimeout(function () { el.remove(); }, 300); }
        if (action && cb) {
            el.querySelector('.toast-action').addEventListener('click', function (e) { e.stopPropagation(); cb(); dismiss(); });
        }
        el.addEventListener('click', function (e) { if (e.target === el || e.target.classList.contains('toast-msg')) dismiss(); });
        if (navigator.vibrate) navigator.vibrate(10);
    },

    // ---------- GLOBAL SEARCH ----------

    initSearch() {
        var btn = document.getElementById('globalSearchBtn');
        var modal = document.getElementById('searchModal');
        var closeBtn = document.getElementById('searchModalClose');
        var input = document.getElementById('globalSearchInput');
        var results = document.getElementById('searchResults');
        var empty = document.getElementById('searchEmpty');
        if (!btn || !modal) return;

        var open = function () { modal.classList.add('open'); setTimeout(function () { input.focus(); }, 350); input.value = ''; results.innerHTML = ''; empty.hidden = false; };
        var close = function () { modal.classList.remove('open'); };

        btn.addEventListener('click', open);
        closeBtn.addEventListener('click', close);
        modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
        input.addEventListener('input', App.debounce(function () {
            var q = input.value.trim().toLowerCase();
            if (!q) { results.innerHTML = ''; empty.hidden = false; return; }
            var all = [];

            App.load('navaja_tasks', []).forEach(function (t) { if ((t.text || '').toLowerCase().includes(q)) all.push({ type: 'Tarea', text: t.text, icon: '✓', view: 'tasks' }); });
            App.load('navaja_notes', []).forEach(function (n) { if ((n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)) all.push({ type: 'Nota', text: n.title || 'Sin título', icon: '📝', view: 'notes' }); });
            App.load('navaja_expenses', []).forEach(function (t) {
                if ((t.description || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q) || t.amount.toString().includes(q))
                    all.push({ type: t.type === 'income' ? 'Ingreso' : 'Gasto', text: (t.currency === 'USD' ? 'US$' : '$') + t.amount.toFixed(2) + ' ' + (t.description || t.category || ''), icon: t.type === 'income' ? '↑' : '↓', view: 'expenses' });
            });

            empty.hidden = all.length > 0;
            if (!all.length) { results.innerHTML = '<p style="text-align:center;padding:30px;color:var(--text-tertiary);font-size:14px;">Sin resultados</p>'; return; }
            results.innerHTML = all.slice(0, 20).map(function (r) {
                return '<div class="sr-item" data-view="' + r.view + '"><span class="sr-icon">' + r.icon + '</span><span class="sr-text">' + App.esc(r.text) + '</span><span class="sr-type">' + r.type + '</span></div>';
            }).join('');
            results.querySelectorAll('.sr-item').forEach(function (el) {
                el.addEventListener('click', function () { close(); var b = document.querySelector('.nav-btn[data-view="' + el.dataset.view + '"]'); if (b) b.click(); });
            });
        }));
    },

    // ---------- BACKUP ----------

    exportBackup() {
        var keys = ['navaja_tasks','navaja_notes','navaja_expenses','navaja_accounts','navaja_budgets','navaja_reminders','navaja_categories','navaja_split','navaja_bluerate'];
        var data = { _version: 1, _exported: new Date().toISOString() };
        keys.forEach(function (k) { var v = localStorage.getItem(k); if (v) data[k] = JSON.parse(v); });
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'navaja_backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    },

    importBackup(file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                var data = JSON.parse(e.target.result);
                if (!data._version) { alert('Respaldo inválido'); return; }
                ['navaja_tasks','navaja_notes','navaja_expenses','navaja_accounts','navaja_budgets','navaja_reminders','navaja_categories','navaja_split','navaja_bluerate'].forEach(function (k) {
                    if (data[k] !== undefined) localStorage.setItem(k, JSON.stringify(data[k]));
                });
                alert('Respaldo restaurado. Recargá la página.');
                location.reload();
            } catch (_) { alert('Error al leer el respaldo'); }
        };
        reader.readAsText(file);
    },

    // ---------- ERROR HANDLER ----------

    initErrorHandler() {
        window.addEventListener('error', (e) => {
            console.error(e.error || e.message);
            this.toast('Ocurrió un error inesperado');
        });
        window.addEventListener('unhandledrejection', (e) => {
            console.error(e.reason);
            this.toast('Ocurrió un error inesperado');
        });
    },

    // ---------- UTILITIES ----------

    uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },
    save(k, d) {
        try {
            var backup = localStorage.getItem(k);
            if (backup) localStorage.setItem(k + '_bak', backup);
            localStorage.setItem(k, JSON.stringify(d));
            if (window.Firebase && Firebase.ready && Firebase.user) {
                Firebase.syncToCloud(k, d);
            }
        } catch (e) {
            this.toast('Error al guardar — revisá el espacio del navegador');
            if (backup) { try { localStorage.setItem(k, backup); } catch (_) {} }
        }
    },
    load(k, f) {
        f = f === undefined ? null : f;
        try {
            var r = localStorage.getItem(k);
            return r ? JSON.parse(r) : f;
        } catch (_) {
            try {
                var bak = localStorage.getItem(k + '_bak');
                if (bak) { var parsed = JSON.parse(bak); localStorage.setItem(k, bak); return parsed; }
            } catch (_2) {}
            return f;
        }
    },
    esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; },
    debounce(fn, ms) { var t; return function () { var ctx = this, args = arguments; clearTimeout(t); t = setTimeout(function () { fn.apply(ctx, args); }, ms || 150); }; },

    formatDate(dateStr) {
        var d = new Date(dateStr + 'T12:00:00');
        var now = new Date();
        var diff = (now - d) / 86400000;
        if (diff < 1) return 'Hoy';
        if (diff < 2) return 'Ayer';
        return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
    },

    countUp(el, target, suffix, duration) {
        suffix = suffix || '';
        duration = duration || 600;
        var start = performance.now();
        var initial = parseFloat(el.textContent.replace(/[^0-9.-]/g, '')) || 0;
        function update(now) {
            var t = Math.min((now - start) / duration, 1);
            var eased = 1 - Math.pow(1 - t, 3);
            var val = initial + (target - initial) * eased;
            el.textContent = (target >= 0 ? '' : '-') + '$' + Math.abs(val).toFixed(2);
            if (t < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }
};

document.addEventListener('DOMContentLoaded', function () {
    App.init();
    App.initSearch();
});
