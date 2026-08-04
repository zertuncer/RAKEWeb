document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('applications-tbody');
    const statTotal = document.getElementById('stat-total');
    const statPending = document.getElementById('stat-pending');
    const statAccepted = document.getElementById('stat-accepted');
    const statRejected = document.getElementById('stat-rejected');
    const btnRefresh = document.getElementById('btn-refresh');

    const modal = document.getElementById('details-modal');
    const modalClose = document.getElementById('modal-close');
    const modalBody = document.getElementById('modal-body');
    const teamFilter = document.getElementById('team-filter');

    // Notes Modal Elements
    const notesModal = document.getElementById('notes-modal');
    const notesModalClose = document.getElementById('notes-modal-close');
    const notesModalTextarea = document.getElementById('notes-modal-textarea');
    const btnSaveModalNotes = document.getElementById('btn-save-modal-notes');
    let currentNoteId = null;

    // API tabanı: meta/window override > local Live Server > aynı origin
    function resolveApiBase() {
        const meta = document.querySelector('meta[name="rake-api-base"]');
        if (meta && meta.content) return meta.content.replace(/\/$/, '');
        if (typeof window.RAKE_API_BASE === 'string' && window.RAKE_API_BASE) {
            return window.RAKE_API_BASE.replace(/\/$/, '');
        }
        const isLocalDev = ['localhost', '127.0.0.1'].includes(window.location.hostname)
            && window.location.port !== '3000'
            && window.location.port !== '';
        if (isLocalDev) return 'http://localhost:3000';
        return '';
    }

    const apiBase = resolveApiBase();
    const apiUrl = `${apiBase}/api/applications`;
    const healthUrl = `${apiBase}/api/health`;

    function loginErrorMessage(status) {
        if (status === 401) return 'Hatalı kullanıcı adı veya şifre!';
        if (status === 404 || status === 502 || status === 503) {
            return 'API sunucusuna ulaşılamıyor (Node.js çalışmıyor olabilir). cPanel > Setup Node.js App ile uygulamayı başlatın.';
        }
        if (status === 0) return 'Sunucuya bağlanılamadı.';
        return `Giriş başarısız (HTTP ${status}).`;
    }

    let allApplications = [];
    let questionMap = {};

    // DOM Elements for Login
    const loginContainer = document.getElementById('login-container');
    const mainApp = document.getElementById('main-app');
    const loginForm = document.getElementById('login-form');
    const loginUser = document.getElementById('login-user');
    const loginPass = document.getElementById('login-pass');
    const loginError = document.getElementById('login-error');
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');

    function getAuthHeaders() {
        const token = localStorage.getItem('rake_auth');
        return token ? { 'Authorization': `Basic ${token}` } : {};
    }

    // Handle Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = loginUser.value;
        const pass = loginPass.value;
        const token = btoa(`${user}:${pass}`);

        btnLogin.disabled = true;
        btnLogin.innerText = 'Giriş yapılıyor...';
        loginError.innerText = '';

        try {
            const response = await fetch(apiUrl, {
                headers: { 'Authorization': `Basic ${token}` },
                credentials: 'omit'
            });

            if (response.ok) {
                localStorage.setItem('rake_auth', token);
                loginContainer.style.display = 'none';
                mainApp.style.display = 'block';

                // Fetch data now that we are logged in
                fetchQuestionMap().then(fetchApplications);
            } else {
                loginError.innerText = loginErrorMessage(response.status);
            }
        } catch (error) {
            loginError.innerText = loginErrorMessage(0);
        } finally {
            btnLogin.disabled = false;
            btnLogin.innerText = 'Giriş Yap';
        }
    });

    // Sayfa açılışında API sağlığını kontrol et
    (async function checkApiHealth() {
        try {
            const res = await fetch(healthUrl, { credentials: 'omit' });
            if (!res.ok) {
                loginError.innerText = loginErrorMessage(res.status);
                return;
            }
            const data = await res.json();
            if (!data.db) {
                loginError.innerText = 'API çalışıyor ama veritabanı bağlantısı yok. .env DB ayarlarını kontrol edin.';
            }
        } catch (_) {
            loginError.innerText = loginErrorMessage(0) + ' /api/health yanıt vermiyor.';
        }
    })();

    // Handle Logout
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('rake_auth');
        window.location.reload();
    });

    // Fetch question map from index.html
    async function fetchQuestionMap() {
        try {
            const res = await fetch('index.html');
            const html = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const inputs = doc.querySelectorAll('#native-apply-form [name]');
            inputs.forEach(input => {
                const id = input.id;
                const label = doc.querySelector(`label[for="${id}"]`);
                if (label) {
                    questionMap[input.name] = label.innerText;
                }
            });
        } catch (e) {
            console.error('Error fetching index.html for questions map:', e);
        }
    }

    // Fetch and render applications
    async function fetchApplications() {
        try {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Yükleniyor...</td></tr>';
            const response = await fetch(apiUrl, {
                headers: getAuthHeaders(),
                credentials: 'omit'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token is invalid or expired
                    localStorage.removeItem('rake_auth');
                    loginContainer.style.display = 'flex';
                    mainApp.style.display = 'none';
                } else {
                    const text = await response.text();
                    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Hata (${response.status}): ${text}</td></tr>`;
                }
                return;
            }

            const data = await response.json();
            allApplications = data;

            // If we successfully fetched, ensure dashboard is visible
            loginContainer.style.display = 'none';
            mainApp.style.display = 'block';

            applyFilterAndRender();
        } catch (error) {
            console.error('Fetch error:', error);
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Sunucuya bağlanılamadı.</td></tr>';
        }
    }

    function applyFilterAndRender() {
        const filterVal = teamFilter ? teamFilter.value : 'all';
        let filteredData = allApplications;
        if (filterVal !== 'all') {
            filteredData = allApplications.filter(app => app.team === filterVal);
        }
        renderTable(filteredData);
        updateStats(filteredData);
    }

    if (teamFilter) {
        teamFilter.addEventListener('change', applyFilterAndRender);
    }

    function renderTable(applications) {
        tbody.innerHTML = '';
        if (applications.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Henüz başvuru bulunmuyor.</td></tr>';
            return;
        }

        applications.forEach(app => {
            const tr = document.createElement('tr');

            const date = new Date(app.createdAt).toLocaleDateString('tr-TR', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            // Make sure empty values don't break UI
            const name = app.fullName || '-';
            const team = app.team || '-';
            const department = app.department || '-';
            const statusClass = app.status === 'Kabul' ? 'status-kabul' : (app.status === 'Red' ? 'status-red' : 'status-bekliyor');

            tr.innerHTML = `
                <td>${date}</td>
                <td><strong>${name}</strong></td>
                <td>${team}</td>
                <td>${department}</td>
                <td>
                    <select class="status-select ${statusClass}" data-id="${app.id}">
                        <option value="Bekliyor" ${app.status === 'Bekliyor' ? 'selected' : ''}>Bekliyor</option>
                        <option value="Kabul" ${app.status === 'Kabul' ? 'selected' : ''}>Kabul</option>
                        <option value="Red" ${app.status === 'Red' ? 'selected' : ''}>Red</option>
                    </select>
                </td>
                <td>
                    <button class="btn-note-icon" data-id="${app.id}" title="Notları Görüntüle/Düzenle">
                        ${app.notes && app.notes.trim() !== '' ?
                    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>`
                    :
                    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>`
                }
                    </button>
                </td>
                <td>
                    <button class="btn-view-details" data-id="${app.id}">Detaylar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Add event listeners for status change
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const id = e.target.getAttribute('data-id');
                const newStatus = e.target.value;
                await updateApplication(id, { status: newStatus });

                // Update class color
                e.target.className = 'status-select';
                if (newStatus === 'Kabul') e.target.classList.add('status-kabul');
                else if (newStatus === 'Red') e.target.classList.add('status-red');
                else e.target.classList.add('status-bekliyor');

                // Re-fetch to update stats
                fetchApplications();
            });
        });

        // Note Icon Click
        document.querySelectorAll('.btn-note-icon').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget;
                const id = target.getAttribute('data-id');
                const app = applications.find(a => a.id === id);
                if (app) {
                    currentNoteId = id;
                    notesModalTextarea.value = app.notes || '';
                    notesModal.style.display = 'flex';
                }
            });
        });

        // View details modal
        document.querySelectorAll('.btn-view-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const app = applications.find(a => a.id === id);
                if (app) showDetails(app);
            });
        });

        // Initialize custom select UI for the newly rendered status dropdowns
        if (typeof initCustomSelects === 'function') initCustomSelects();
    }

    function showDetails(app) {
        let html = '';

        // General fields we want to skip in the generic loop
        const skipKeys = ['id', 'createdAt', 'status', 'notes', 'fullName', 'team', 'department', 'email', 'phone'];

        html += `<div class="detail-item"><strong>Ad Soyad:</strong> <p>${app.fullName || '-'}</p></div>`;
        html += `<div class="detail-item"><strong>İletişim:</strong> <p>${app.email || '-'} | ${app.phone || '-'}</p></div>`;
        html += `<div class="detail-item"><strong>Bölüm / Takım:</strong> <p>${app.department || '-'} / ${app.team || '-'}</p></div>`;

        html += '<hr style="border:0; border-top:1px solid #e2e8f0; margin:1.5rem 0;">';

        // Map other fields to readable format
        for (const [key, value] of Object.entries(app)) {
            if (!skipKeys.includes(key) && value) {
                // Prettify key name
                let label = key;
                if (questionMap[key]) {
                    label = questionMap[key];
                } else if (key.startsWith('q')) {
                    label = "Soru Yanıtı (" + key.substring(1) + ")";
                }
                html += `<div class="detail-item"><strong>${label}:</strong> <p>${value}</p></div>`;
            }
        }

        modalBody.innerHTML = html;
        modal.style.display = 'flex';
    }

    // Close Modals
    modalClose.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    notesModalClose.addEventListener('click', () => {
        notesModal.style.display = 'none';
        currentNoteId = null;
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
        if (e.target === notesModal) {
            notesModal.style.display = 'none';
            currentNoteId = null;
        }
    });

    // Save Notes Modal
    btnSaveModalNotes.addEventListener('click', async () => {
        if (!currentNoteId) return;

        const newNotes = notesModalTextarea.value;
        const originalText = btnSaveModalNotes.innerText;
        btnSaveModalNotes.innerText = 'Kaydediliyor...';
        btnSaveModalNotes.disabled = true;

        await updateApplication(currentNoteId, { notes: newNotes });

        btnSaveModalNotes.innerText = originalText;
        btnSaveModalNotes.disabled = false;
        notesModal.style.display = 'none';
        currentNoteId = null;

        // Refresh table to show updated icon state
        fetchApplications();
    });

    async function updateApplication(id, data) {
        try {
            const updateUrl = apiUrl.replace('/api/applications', '/api/applications/') + id;
            await fetch(updateUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                credentials: 'omit',
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Update error:', error);
            alert('Güncelleme sırasında hata oluştu.');
        }
    }

    function updateStats(applications) {
        statTotal.innerText = applications.length;
        statPending.innerText = applications.filter(a => a.status === 'Bekliyor').length;
        statAccepted.innerText = applications.filter(a => a.status === 'Kabul').length;
        statRejected.innerText = applications.filter(a => a.status === 'Red').length;
    }

    btnRefresh.addEventListener('click', fetchApplications);

    // Initial load
    fetchQuestionMap().then(fetchApplications);
});
