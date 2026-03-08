
let currentUser = null;
let allUsers = [];
let allRequests = [];
let currentEditId = null;

document.addEventListener('DOMContentLoaded', async function () {
    await init();
});

async function init() {
    currentUser = app.getUser();
    if (!currentUser) {
        window.location.href = 'authorization.html';
        return;
    }

    
    if (currentUser.type !== 'Оператор') {
        alert(`Доступ запрещен. Ваша роль: ${currentUser.type}`);
        window.location.href = 'authorization.html';
        return;
    }

    document.getElementById('userName').textContent = currentUser.fio || currentUser.login;
    document.getElementById('userRole').textContent = currentUser.type;

    await loadUsers();
    await loadData();
}

async function loadUsers() {
    try {
        allUsers = await apiGet('/Users');
        console.log('Загружено пользователей:', allUsers.length);

        const mechanics = allUsers.filter(u => u.type === 'Автомеханик');
        const select = document.getElementById('assignMechanic');
        if (select) {
            select.innerHTML = '<option value="">Не назначать</option>' +
                mechanics.map(m => `<option value="${m.userID}">${m.fio}</option>`).join('');
        }
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
    }
}

function getUserName(userId) {
    if (!userId) return 'Не назначен';
    const user = allUsers.find(u => u.userID === userId);
    return user ? user.fio : `ID: ${userId}`;
}

async function loadData() {
    const debugEl = document.getElementById('debugInfo');
    if (debugEl) debugEl.innerHTML = 'Загрузка данных...';

    try {
        allRequests = await apiGet('/Requests');

        console.log('Текущий пользователь ID:', currentUser.userID);
        console.log('Все заявки:', allRequests);

        if (debugEl) debugEl.innerHTML = `✅ Загружено заявок: ${allRequests.length}`;

        displayRequests(allRequests);
        updateStatistics();
        updateProblemStats();
    } catch (error) {
        if (debugEl) debugEl.innerHTML = `❌ Ошибка: ${error.message}`;
        console.error('Ошибка загрузки:', error);
    }
}

function displayRequests(requests) {
    const tbody = document.getElementById('requestsTableBody');

    if (!tbody) {
        console.error('Элемент requestsTableBody не найден');
        return;
    }

    if (!requests || requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">Нет заявок</td></tr>';
        return;
    }

    tbody.innerHTML = requests.map(r => {
        let statusClass = '';
        if (r.requestStatus === 'В процессе ремонта') statusClass = 'status-progress';
        else if (r.requestStatus === 'Готова к выдаче') statusClass = 'status-ready';
        else if (r.requestStatus === 'Новая заявка') statusClass = 'status-new';
        else if (r.requestStatus === 'Ожидание автозапчастей') statusClass = 'status-waiting';
        else if (r.requestStatus === 'Завершена') statusClass = 'status-completed';

        return `<tr>
            <td>${r.requestID}</td>
            <td>${r.startDate ? new Date(r.startDate).toLocaleDateString() : '-'}</td>
            <td>${getUserName(r.clientID)}</td>
            <td>${r.carType || ''} ${r.carModel || ''}</td>
            <td>${(r.problemDescription || '').substring(0, 30)}...</td>
            <td><span class="status-badge ${statusClass}">${r.requestStatus}</span></td>
            <td>${getUserName(r.masterID)}</td>
            <td>
                <button class="action-btn edit-btn" onclick="openEditModal(${r.requestID})">✏️</button>
            </td>
        </tr>`;
    }).join('');
}

function updateStatistics() {
    const total = allRequests.length;
    const inProgress = allRequests.filter(r =>
        r.requestStatus === 'В процессе ремонта' || r.requestStatus === 'Ожидание автозапчастей'
    ).length;
    const completed = allRequests.filter(r => r.requestStatus === 'Завершена').length;

    let avgTime = 0;
    const completedRequests = allRequests.filter(r => r.requestStatus === 'Завершена' && r.completionDate);
    if (completedRequests.length > 0) {
        const totalDays = completedRequests.reduce((sum, r) => {
            const start = new Date(r.startDate);
            const end = new Date(r.completionDate);
            return sum + Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        }, 0);
        avgTime = (totalDays / completedRequests.length).toFixed(1);
    }

    document.getElementById('totalCount').textContent = total;
    document.getElementById('inProgressCount').textContent = inProgress;
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('avgTime').textContent = avgTime + ' дн.';
}

function updateProblemStats() {
    const tbody = document.getElementById('problemStatsTable');
    if (!tbody) return;

    const stats = {};
    allRequests.forEach(r => {
        const problem = r.problemDescription ? r.problemDescription.split(' ')[0] + '...' : 'Другое';
        stats[problem] = (stats[problem] || 0) + 1;
    });

    if (Object.keys(stats).length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">Нет данных</td></tr>';
        return;
    }

    tbody.innerHTML = Object.entries(stats).map(([problem, count]) => {
        const percent = ((count / allRequests.length) * 100).toFixed(1);
        return `<tr><td>${problem}</td><td>${count}</td><td>${percent}%</td></tr>`;
    }).join('');
}

function searchRequests() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;

    let filtered = allRequests;

    if (search) {
        filtered = filtered.filter(r =>
            r.requestID.toString().includes(search) ||
            (r.carModel && r.carModel.toLowerCase().includes(search)) ||
            (r.carType && r.carType.toLowerCase().includes(search)) ||
            getUserName(r.clientID).toLowerCase().includes(search)
        );
    }

    if (status) {
        filtered = filtered.filter(r => r.requestStatus === status);
    }

    displayRequests(filtered);
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    displayRequests(allRequests);
}

function openCreateModal() {
    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'Новая заявка';
    document.getElementById('requestForm').reset();
    document.getElementById('requestStatus').value = 'Новая заявка';
    document.getElementById('requestModal').style.display = 'block';
}

async function openEditModal(requestId) {
    currentEditId = requestId;
    const request = allRequests.find(r => r.requestID === requestId);
    if (!request) return;

    document.getElementById('modalTitle').textContent = `Редактирование заявки №${requestId}`;
    document.getElementById('carType').value = request.carType || '';
    document.getElementById('carModel').value = request.carModel || '';
    document.getElementById('problemDescription').value = request.problemDescription || '';

    const client = allUsers.find(u => u.userID === request.clientID);
    document.getElementById('clientFio').value = client ? client.fio : '';
    document.getElementById('clientPhone').value = client ? client.phone : '';

    document.getElementById('assignMechanic').value = request.masterID || '';
    document.getElementById('requestStatus').value = request.requestStatus;

    document.getElementById('requestModal').style.display = 'block';
}

async function saveRequest() {
    const requestData = {
        carType: document.getElementById('carType').value,
        carModel: document.getElementById('carModel').value,
        problemDescription: document.getElementById('problemDescription').value,
        clientId: parseInt(document.getElementById('clientId')?.value) || 6,
        masterId: document.getElementById('assignMechanic').value || null,
        requestStatus: document.getElementById('requestStatus').value
    };

    try {
        if (currentEditId) {
            await apiPost(`/Requests/${currentEditId}`, {
                masterId: requestData.masterId,
                status: requestData.requestStatus
            });
            alert('✅ Заявка обновлена');
        } else {
            await apiPost('/Requests', requestData);
            alert('✅ Заявка создана');
        }
        closeModal('requestModal');
        await loadData();
    } catch (error) {
        alert('❌ Ошибка: ' + error.message);
    }
}

function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');

    if (tabName === 'statistics') {
        updateProblemStats();
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function logout() {
    app.logout();
}

window.searchRequests = searchRequests;
window.resetFilters = resetFilters;
window.openCreateModal = openCreateModal;
window.openEditModal = openEditModal;
window.saveRequest = saveRequest;
window.showTab = showTab;
window.closeModal = closeModal;
window.logout = logout;