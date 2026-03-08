// js/mechanic.js
let currentUser = null;
let allRequests = [];
let allUsers = [];
let allComments = [];
let currentRequestId = null;
let currentParts = [];

// Уведомления
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#ff9800' : '#f44336'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 2700);
}

document.addEventListener('DOMContentLoaded', async function () {
    await init();
});

async function init() {
    currentUser = app.getUser();
    if (!currentUser) {
        window.location.href = 'authorization.html';
        return;
    }

    if (currentUser.type !== 'Автомеханик') {
        alert(`Доступ запрещен. Ваша роль: ${currentUser.type}`);
        window.location.href = 'authorization.html';
        return;
    }

    document.getElementById('userName').textContent = currentUser.fio;
    document.getElementById('userRole').textContent = currentUser.type;

    await loadUsers();
    await loadMyRequests();
}

// Загрузка пользователей
async function loadUsers() {
    try {
        allUsers = await apiGet('/Users');
        console.log('Загружено пользователей:', allUsers);
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        showNotification('Ошибка загрузки пользователей', 'error');
    }
}

// Загрузка комментариев для заявки
async function loadComments(requestId) {
    try {
        const comments = await apiGet(`/Comments/request/${requestId}`);
        allComments = comments;

        const container = document.getElementById('commentsList');
        if (!container) return;

        if (comments.length === 0) {
            container.innerHTML = '<p class="empty-message">Нет комментариев</p>';
        } else {
            container.innerHTML = comments.map(c => {
                const author = allUsers.find(u => u.userID === c.masterID);
                return `
                    <div class="comment-item" style="background: #f5f5f5; padding: 8px; margin-bottom: 5px; border-radius: 4px;">
                        <strong>${author?.fio || 'Механик'}:</strong>
                        <p style="margin: 5px 0;">${c.message}</p>
                        <small style="color: #666;">${new Date(c.createdAt).toLocaleString()}</small>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Ошибка загрузки комментариев:', error);
        showNotification('Ошибка загрузки комментариев', 'error');
    }
}

// Загрузка запчастей для заявки
async function loadParts(requestId) {
    try {
        const request = allRequests.find(r => r.requestID === requestId);
        if (!request) return;

        let parts = [];
        if (request.repairParts) {
            try {
                parts = JSON.parse(request.repairParts);
            } catch {
                parts = [{ name: request.repairParts, number: '', quantity: 1 }];
            }
        }
        currentParts = parts;

        const container = document.getElementById('partsList');
        if (!container) return;

        if (parts.length === 0) {
            container.innerHTML = '<p class="empty-message">Нет заказанных запчастей</p>';
        } else {
            container.innerHTML = parts.map(p => `
                <div class="part-item" style="background: #f5f5f5; padding: 8px; margin-bottom: 5px; border-radius: 4px;">
                    <strong>${p.name}</strong>
                    ${p.number ? `(Арт: ${p.number})` : ''}
                    <span style="float: right;">${p.quantity} шт.</span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Ошибка загрузки запчастей:', error);
    }
}

function getUserName(userId) {
    if (!userId) return 'Не назначен';
    const user = allUsers.find(u => u.userID === userId);
    return user ? user.fio : `ID: ${userId}`;
}

function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));

    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');

    if (tabName === 'myRequests') loadMyRequests();
    if (tabName === 'availableRequests') loadAvailableRequests();
}

// Переключение вкладок внутри модального окна
function showDetailTab(tabName) {
    document.querySelectorAll('.detail-tab').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    if (tabName === 'info') {
        document.getElementById('detailInfoTab').style.display = 'block';
    } else if (tabName === 'comments') {
        document.getElementById('detailCommentsTab').style.display = 'block';
        loadComments(currentRequestId);
    } else if (tabName === 'parts') {
        document.getElementById('detailPartsTab').style.display = 'block';
        loadParts(currentRequestId);
    }
    event.target.classList.add('active');
}

// Открытие модального окна с деталями заявки
async function openRequestDetail(requestId) {
    currentRequestId = requestId;
    const request = allRequests.find(r => r.requestID === requestId);
    if (!request) return;

    document.getElementById('detailRequestTitle').textContent = `Заявка №${requestId}`;
    document.getElementById('detailRequestInfo').innerHTML = `
        <p><strong>Клиент:</strong> ${getUserName(request.clientID)}</p>
        <p><strong>Автомобиль:</strong> ${request.carType || ''} ${request.carModel || ''}</p>
        <p><strong>Проблема:</strong> ${request.problemDescription || ''}</p>
        <p><strong>Текущий статус:</strong> ${request.requestStatus}</p>
        <p><strong>Дата создания:</strong> ${new Date(request.startDate).toLocaleString()}</p>
    `;

    document.getElementById('detailStatus').value = request.requestStatus;

    // Загружаем комментарии и запчасти
    await loadComments(requestId);
    await loadParts(requestId);

    // Показываем первую вкладку
    showDetailTab('info');

    document.getElementById('requestDetailModal').style.display = 'block';
}

// Добавление комментария
async function addComment() {
    const commentText = document.getElementById('newComment').value;
    if (!commentText.trim()) {
        showNotification('Введите комментарий', 'warning');
        return;
    }

    try {
        await apiPost('/Comments', {
            requestId: currentRequestId,
            masterId: currentUser.userID,
            message: commentText
        });

        document.getElementById('newComment').value = '';
        await loadComments(currentRequestId);
        showNotification('Комментарий добавлен');
    } catch (error) {
        console.error('Ошибка добавления комментария:', error);
        showNotification('Ошибка при добавлении комментария', 'error');
    }
}

// Добавление запчасти
async function addPart() {
    const name = document.getElementById('partName').value;
    const number = document.getElementById('partNumber').value;
    const quantity = document.getElementById('partQuantity').value;

    if (!name.trim()) {
        showNotification('Введите наименование запчасти', 'warning');
        return;
    }

    const newPart = {
        name: name,
        number: number,
        quantity: parseInt(quantity) || 1
    };

    currentParts.push(newPart);

    try {
        // Сохраняем запчасти в поле repairParts заявки
        await apiPost(`/Requests/${currentRequestId}`, {
            repairParts: JSON.stringify(currentParts)
        });

        document.getElementById('partName').value = '';
        document.getElementById('partNumber').value = '';
        document.getElementById('partQuantity').value = '1';

        await loadParts(currentRequestId);
        showNotification('Запчасть добавлена');
    } catch (error) {
        console.error('Ошибка добавления запчасти:', error);
        showNotification('Ошибка при добавлении запчасти', 'error');
    }
}

// Запрос помощи менеджеру
async function requestHelp() {
    const problem = prompt('Опишите проблему, с которой нужна помощь:');
    if (!problem) return;

    try {
        await apiPost('/Comments', {
            requestId: currentRequestId,
            masterId: currentUser.userID,
            message: '🆘 ТРЕБУЕТСЯ ПОМОЩЬ: ' + problem
        });

        showNotification('Запрос помощи отправлен менеджеру');
        await loadComments(currentRequestId);
    } catch (error) {
        console.error('Ошибка отправки запроса:', error);
        showNotification('Ошибка при отправке запроса', 'error');
    }
}

async function loadMyRequests() {
    const debugEl = document.getElementById('debugInfo');
    debugEl.innerHTML = 'Загрузка моих заявок...';

    try {
        allRequests = await apiGet('/Requests');
        console.log('Текущий пользователь ID:', currentUser.userID);
        console.log('Все заявки:', allRequests);

        const myRequests = allRequests.filter(r => r.masterID === currentUser.userID);

        debugEl.innerHTML = `✅ Найдено моих заявок: ${myRequests.length}`;
        displayRequests(myRequests, 'myRequestsList', true);
    } catch (error) {
        debugEl.innerHTML = `❌ Ошибка: ${error.message}`;
        showNotification('Ошибка загрузки заявок', 'error');
    }
}

async function loadAvailableRequests() {
    const debugEl = document.getElementById('debugInfo');
    debugEl.innerHTML = 'Загрузка доступных заявок...';

    try {
        allRequests = await apiGet('/Requests');
        const available = allRequests.filter(r => !r.masterID && r.requestStatus === 'Новая заявка');

        debugEl.innerHTML = `✅ Доступно заявок: ${available.length}`;
        displayRequests(available, 'availableRequestsList', false);
    } catch (error) {
        debugEl.innerHTML = `❌ Ошибка: ${error.message}`;
        showNotification('Ошибка загрузки доступных заявок', 'error');
    }
}

function displayRequests(requests, elementId, showActions) {
    const container = document.getElementById(elementId);

    if (!container) {
        console.error('Элемент не найден:', elementId);
        return;
    }

    if (!requests || requests.length === 0) {
        container.innerHTML = '<p class="empty-message">Заявок не найдено</p>';
        return;
    }

    container.innerHTML = requests.map(r => {
        let statusClass = '';
        let statusText = r.requestStatus;

        if (r.requestStatus === 'В процессе ремонта') {
            statusClass = 'status-progress';
            statusText = '🔧 В процессе';
        } else if (r.requestStatus === 'Готова к выдаче') {
            statusClass = 'status-ready';
            statusText = '✅ Готова';
        } else if (r.requestStatus === 'Новая заявка') {
            statusClass = 'status-new';
            statusText = '🆕 Новая';
        } else if (r.requestStatus === 'Ожидание автозапчастей') {
            statusClass = 'status-waiting';
            statusText = '⏳ Ожидание запчастей';
        } else if (r.requestStatus === 'Завершена') {
            statusClass = 'status-completed';
            statusText = '✔ Завершена';
        }

        return `
            <div class="request-card" onclick="openRequestDetail(${r.requestID})" style="cursor: pointer;">
                <h3>Заявка №${r.requestID}</h3>
                <p><strong>Клиент:</strong> ${getUserName(r.clientID)}</p>
                <p><strong>Автомобиль:</strong> ${r.carType || ''} ${r.carModel || ''}</p>
                <p><strong>Проблема:</strong> ${(r.problemDescription || '').substring(0, 50)}...</p>
                <p><strong>Статус:</strong> <span class="status-badge ${statusClass}">${statusText}</span></p>
                <p><strong>Дата:</strong> ${r.startDate ? new Date(r.startDate).toLocaleDateString() : '-'}</p>

                ${showActions ? `
                    <div style="margin-top: 10px;">
                        <select id="status-${r.requestID}" class="status-select" onclick="event.stopPropagation()" style="width: 100%; padding: 5px; margin-bottom: 5px;">
                            <option value="В процессе ремонта" ${r.requestStatus === 'В процессе ремонта' ? 'selected' : ''}>В процессе</option>
                            <option value="Ожидание автозапчастей" ${r.requestStatus === 'Ожидание автозапчастей' ? 'selected' : ''}>Ожидание запчастей</option>
                            <option value="Готова к выдаче" ${r.requestStatus === 'Готова к выдаче' ? 'selected' : ''}>Готова к выдаче</option>
                        </select>
                        <button onclick="event.stopPropagation(); updateStatusFromCard(${r.requestID})" style="width: 100%;">Обновить статус</button>
                    </div>
                ` : ''}

                ${!showActions && r.requestStatus === 'Новая заявка' ? `
                    <button onclick="event.stopPropagation(); takeRequest(${r.requestID})" style="margin-top: 10px; width: 100%;">Взять в работу</button>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Обновление статуса из карточки (без открытия модального окна)
async function updateStatusFromCard(requestId) {
    const status = document.getElementById(`status-${requestId}`).value;

    try {
        await apiPost(`/Requests/${requestId}`, {
            status: status
        });

        showNotification('Статус обновлен');
        await loadMyRequests();
        await loadAvailableRequests();
    } catch (error) {
        console.error('Ошибка обновления статуса:', error);
        showNotification('Ошибка при обновлении статуса', 'error');
    }
}

// Обновление статуса из модального окна
async function updateStatus() {
    const status = document.getElementById('detailStatus').value;

    try {
        await apiPost(`/Requests/${currentRequestId}`, {
            status: status
        });

        showNotification('Статус обновлен');
        await loadMyRequests();
        await loadAvailableRequests();
        closeModal('requestDetailModal');
    } catch (error) {
        console.error('Ошибка обновления статуса:', error);
        showNotification('Ошибка при обновлении статуса', 'error');
    }
}

async function takeRequest(requestId) {
    try {
        await apiPost(`/Requests/${requestId}`, {
            masterId: currentUser.userID,
            status: 'В процессе ремонта'
        });

        showNotification('✅ Заявка принята в работу');
        await loadMyRequests();
        await loadAvailableRequests();
    } catch (error) {
        console.error('Ошибка при принятии заявки:', error);
        showNotification('❌ Ошибка: ' + error.message, 'error');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function logout() {
    app.logout();
}

// Делаем функции глобальными
window.showTab = showTab;
window.takeRequest = takeRequest;
window.updateStatusFromCard = updateStatusFromCard;
window.updateStatus = updateStatus;
window.openRequestDetail = openRequestDetail;
window.addComment = addComment;
window.addPart = addPart;
window.requestHelp = requestHelp;
window.showDetailTab = showDetailTab;
window.closeModal = closeModal;
window.logout = logout;