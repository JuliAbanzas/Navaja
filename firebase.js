const Firebase = {
    app: null,
    auth: null,
    db: null,
    user: null,
    ready: false,

    config: {
        apiKey: "AIzaSyAWhGkpTapUE7MJHiGBhfH2ux7IlZeGoYg",
        authDomain: "navaja-8b9fb.firebaseapp.com",
        projectId: "navaja-8b9fb",
        storageBucket: "navaja-8b9fb.firebasestorage.app",
        messagingSenderId: "661022028353",
        appId: "1:661022028353:web:90d050e40fd184ce538cc0"
    },

    init() {
        if (typeof firebase === 'undefined') return;
        try {
            this.app = firebase.initializeApp(this.config);
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            this.db.settings({ merge: true });
            this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            this.auth.onAuthStateChanged(user => this.onAuth(user));
            this.ready = true;
        } catch (e) {
            console.warn('Firebase init error:', e);
        }
    },

    onAuth(user) {
        this.user = user;
        const loginBtn = document.getElementById('firebaseLoginBtn');
        const userInfo = document.getElementById('firebaseUserInfo');
        const syncStatus = document.getElementById('firebaseSyncStatus');
        const syncDot = document.getElementById('syncDot');
        const headerBtn = document.getElementById('firebaseHeaderBtn');
        if (user) {
            if (loginBtn) loginBtn.classList.add('hidden');
            if (userInfo) {
                userInfo.classList.remove('hidden');
                const name = user.displayName || user.email || 'Usuario';
                const photo = user.photoURL;
                userInfo.querySelector('.fu-avatar').src = photo || '';
                userInfo.querySelector('.fu-avatar').hidden = !photo;
                userInfo.querySelector('.fu-name').textContent = name;
                userInfo.querySelector('.fu-email').textContent = user.email || '';
            }
            if (syncStatus) syncStatus.textContent = '✓ Sincronizado';
            if (syncDot) syncDot.style.background = 'var(--success)';
            if (headerBtn) { headerBtn.style.display = ''; headerBtn.innerHTML = user.photoURL
                ? '<img src="' + user.photoURL + '" alt="" style="width:20px;height:20px;border-radius:50%;">'
                : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'; }
            this.syncFromCloud();
        } else {
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (userInfo) userInfo.classList.add('hidden');
            if (syncStatus) syncStatus.textContent = 'Solo local';
            if (syncDot) syncDot.style.background = 'var(--text-tertiary)';
            if (headerBtn) { headerBtn.style.display = ''; headerBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'; }
        }
    },

    async login() {
        if (!this.ready) { App.toast('Firebase no está configurado'); return; }
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await this.auth.signInWithPopup(provider);
            App.toast('Sesión iniciada con Google');
        } catch (e) {
            if (e.code !== 'auth/popup-closed-by-user') {
                App.toast('Error al iniciar sesión: ' + e.message);
            }
        }
    },

    logout() {
        if (!this.ready) return;
        this.auth.signOut();
        App.toast('Sesión cerrada');
    },

    docRef() {
        if (!this.user || !this.db) return null;
        return this.db.collection('users').doc(this.user.uid);
    },

    async syncToCloud(key, data) {
        if (!this.user || !this.db || !navigator.onLine) return;
        try {
            const ref = this.docRef();
            await ref.set({ [key]: data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        } catch (e) {
            console.warn('Firestore sync error:', e);
        }
    },

    async syncFromCloud() {
        if (!this.user || !this.db || !navigator.onLine) return;
        try {
            const ref = this.docRef();
            if (!ref) return;
            const doc = await ref.get();
            if (!doc.exists) {
                await this.initialUpload();
                return;
            }
            const cloudData = doc.data();
            if (!cloudData || !cloudData.updatedAt) return;
            const localKeys = ['navaja_tasks','navaja_notes','navaja_expenses','navaja_accounts','navaja_budgets','navaja_reminders','navaja_categories','navaja_split','navaja_bluerate'];
            let hasCloud = false;
            localKeys.forEach(k => {
                const shortKey = k.replace('navaja_', '');
                if (cloudData[k] !== undefined) {
                    localStorage.setItem(k, JSON.stringify(cloudData[k]));
                    hasCloud = true;
                }
            });
            if (hasCloud) {
                if (window.Home) Home.refresh();
                if (window.Expenses) { location.reload(); return; }
            }
        } catch (e) {
            console.warn('Firestore load error:', e);
        }
    },

    async initialUpload() {
        const keys = ['navaja_tasks','navaja_notes','navaja_expenses','navaja_accounts','navaja_budgets','navaja_reminders','navaja_categories','navaja_split','navaja_bluerate'];
        const data = { updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
        keys.forEach(k => { const v = localStorage.getItem(k); if (v) data[k] = JSON.parse(v); });
        try {
            await this.docRef().set(data, { merge: true });
            App.toast('Datos subidos a la nube');
        } catch (e) {
            App.toast('Error al subir datos');
        }
    },

    async forceSync() {
        if (!this.user) { App.toast('No hay sesión iniciada'); return; }
        const keys = ['navaja_tasks','navaja_notes','navaja_expenses','navaja_accounts','navaja_budgets','navaja_reminders','navaja_categories','navaja_split','navaja_bluerate'];
        const data = { updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
        keys.forEach(k => { const v = localStorage.getItem(k); if (v) data[k] = JSON.parse(v); });
        try {
            await this.docRef().set(data, { merge: true });
            App.toast('Datos sincronizados ☁️');
        } catch (e) {
            App.toast('Error de conexión');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => Firebase.init());
