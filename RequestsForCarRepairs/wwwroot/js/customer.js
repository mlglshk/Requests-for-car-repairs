let currentUser = null;
let allUsers = [];
let clientRequests = [];
let notifications = [];

document.addEventListener('DOMContentLoaded', async function () {
    currentUser = app.getUser();
    if (!currentUser) {
        window.location.href = 'authorization.html';
        return;
    }

    if (currentUser.type !== 'Заказчик') {
        alert(`Доступ запрещен. Ваша роль: ${currentUser.type}`);
        window.location.href = 'authorization.html';
        return;
    }

    document.getElementById('userName').textContent = currentUser.fio || currentUser.login;

    await loadUsers();
    await loadClientRequests();
});

async function loadUsers() {
    try {
        allUsers = await apiGet('/Users');
        console.log('Загружено пользователей:', allUsers.length);
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
    }
}

function getUserName(userId) {
    if (!userId) return 'Не назначен';
    const user = allUsers.find(u => u.userID === userId);
    return user ? user.fio : `ID: ${userId}`;
}

async function loadClientRequests() {
    try {
        const allRequests = await apiGet('/Requests');
        clientRequests = allRequests.filter(r => r.clientID === currentUser.userID);

        console.log('Загружено заявок клиента:', clientRequests.length);

        updateStatistics();
        loadActiveRequests();
        loadRequestHistory();
        loadCompletedForFeedback();

   
    } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
        document.getElementById('activeRequestsList').innerHTML = '<p>Ошибка загрузки</p>';
    }
}

async function loadNotifications() {
  
    notifications = [];
    showNotificationsAlert();
}

function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));

    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
}

function updateStatistics() {
    const total = clientRequests.length;
    const inProgress = clientRequests.filter(r =>
        r.requestStatus === 'В процессе ремонта' || r.requestStatus === 'Ожидание автозапчастей'
    ).length;
    const completed = clientRequests.filter(r => r.requestStatus === 'Завершена').length;
    const ready = clientRequests.filter(r => r.requestStatus === 'Готова к выдаче').length;

    document.getElementById('totalClientRequests').textContent = total;
    document.getElementById('clientInProgress').textContent = inProgress;
    document.getElementById('clientCompleted').textContent = completed;
    document.getElementById('clientReady').textContent = ready;
}

function showNotificationsAlert() {
    
    document.getElementById('notificationPanel').style.display = 'none';
}

function loadActiveRequests() {
    const active = clientRequests.filter(r =>
        r.requestStatus !== 'Завершена' && r.requestStatus !== 'Готова к выдаче'
    );
    displayRequests(active, 'activeRequestsList');
}

function loadRequestHistory() {
    const history = clientRequests.filter(r =>
        r.requestStatus === 'Завершена' || r.requestStatus === 'Готова к выдаче'
    );
    displayRequests(history, 'historyRequestsList');
}

function loadCompletedForFeedback() {
    const completed = clientRequests.filter(r =>
        r.requestStatus === 'Завершена' || r.requestStatus === 'Готова к выдаче'
    );

    const container = document.getElementById('completedForFeedback');
    if (completed.length === 0) {
        container.innerHTML = '<p>Нет завершенных заявок для отзыва</p>';
        return;
    }

    container.innerHTML = completed.map(r => {
        const master = allUsers.find(u => u.userID === r.masterID);
        return `
            <div class="request-card">
                <h3>Заявка №${r.requestID}</h3>
                <p><strong>Автомобиль:</strong> ${r.carType} ${r.carModel}</p>
                <p><strong>Проблема:</strong> ${r.problemDescription}</p>
                <p><strong>Статус:</strong> <span class="status">${r.requestStatus}</span></p>
                <p><strong>Механик:</strong> ${master?.fio || 'Не указан'}</p>
                <p><strong>Дата завершения:</strong> ${r.completionDate ? new Date(r.completionDate).toLocaleDateString() : 'Не указана'}</p>
                <button onclick="showFeedbackForm(${r.requestID})">Оставить отзыв</button>
            </div>
        `;
    }).join('');
}

function displayRequests(requests, elementId) {
    const container = document.getElementById(elementId);

    if (!requests || requests.length === 0) {
        container.innerHTML = '<p>Заявок не найдено</p>';
        return;
    }

    container.innerHTML = requests.map(r => {
        const statusClass = {
            'Новая заявка': 'status-new',
            'В процессе ремонта': 'status-progress',
            'Ожидание автозапчастей': 'status-waiting',
            'Готова к выдаче': 'status-ready',
            'Завершена': 'status-completed'
        }[r.requestStatus] || '';

        const master = allUsers.find(u => u.userID === r.masterID);

        return `
            <div class="request-card">
                <h3>Заявка №${r.requestID}</h3>
                <p><strong>Дата создания:</strong> ${new Date(r.startDate).toLocaleDateString()}</p>
                <p><strong>Автомобиль:</strong> ${r.carType || ''} ${r.carModel || ''}</p>
                <p><strong>Проблема:</strong> ${r.problemDescription || ''}</p>
                <p><strong>Статус:</strong> <span class="status ${statusClass}">${r.requestStatus}</span></p>
                <p><strong>Механик:</strong> ${master?.fio || 'Не назначен'}</p>
                ${r.completionDate ? `<p><strong>Дата завершения:</strong> ${new Date(r.completionDate).toLocaleDateString()}</p>` : ''}
                <button onclick="showRequestDetails(${r.requestID})">Подробнее</button>

                ${r.requestStatus === 'Готова к выдаче' ? `
                    <button onclick="confirmPickup(${r.requestID})" style="background: #4CAF50;">✅ Забрать авто</button>
                ` : ''}
            </div>
        `;
    }).join('');
}

async function showRequestDetails(requestId) {
    const request = clientRequests.find(r => r.requestID === requestId);
    if (!request) return;

    try {
    
        let comments = [];
        try {
            comments = await apiGet(`/Comments/request/${requestId}`);
        } catch (error) {
            console.log('Комментарии не загружены');
        }

        const master = allUsers.find(u => u.userID === request.masterID);

        document.getElementById('detailModalTitle').textContent = `Заявка №${requestId}`;
        document.getElementById('requestDetailInfo').innerHTML = `
            <p><strong>Автомобиль:</strong> ${request.carType} ${request.carModel}</p>
            <p><strong>Проблема:</strong> ${request.problemDescription}</p>
            <p><strong>Статус:</strong> ${request.requestStatus}</p>
            <p><strong>Механик:</strong> ${master?.fio || 'Не назначен'}</p>
        `;

        document.getElementById('statusTimeline').innerHTML = `
            <div style="padding:10px; background:#f5f5f5; border-radius:5px;">
                <p>✅ Создана: ${new Date(request.startDate).toLocaleString()}</p>
                ${request.completionDate ? `<p>✅ Завершена: ${new Date(request.completionDate).toLocaleString()}</p>` : ''}
            </div>
        `;

        if (comments.length > 0) {
            document.getElementById('detailComments').innerHTML = comments.map(c => {
                const author = allUsers.find(u => u.userID === c.masterID);
                return `
                    <div class="comment">
                        <strong>${author?.fio || 'Механик'}:</strong> ${c.message}
                        <br><small>${new Date(c.createdAt).toLocaleString()}</small>
                    </div>
                `;
            }).join('');
        } else {
            document.getElementById('detailComments').innerHTML = '<p>Комментариев пока нет</p>';
        }

        if (request.repairParts) {
            document.getElementById('detailParts').innerHTML = `<p>${request.repairParts}</p>`;
        } else {
            document.getElementById('detailParts').innerHTML = '<p>Запчасти не заказывались</p>';
        }

        document.getElementById('requestDetailModal').style.display = 'block';

    } catch (error) {
        console.error('Ошибка загрузки деталей:', error);
    }
}

function showFeedbackForm(requestId) {
    document.getElementById('feedbackRequestId').textContent = requestId;
    document.getElementById('feedbackForm').style.display = 'block';
}

function submitFeedback() {
    const requestId = document.getElementById('feedbackRequestId').textContent;
    const rating = document.getElementById('rating').value;
    const qualityRating = document.getElementById('qualityRating').value;
    const speedRating = document.getElementById('speedRating').value;
    const feedbackText = document.getElementById('feedbackText').value;
    const recommend = document.getElementById('recommend').value;

    if (!feedbackText) {
        alert('Пожалуйста, напишите отзыв');
        return;
    }

    alert(`Спасибо за отзыв по заявке №${requestId}!`);
    cancelFeedback();
}

function cancelFeedback() {
    document.getElementById('feedbackForm').style.display = 'none';
    document.getElementById('rating').value = '5';
    document.getElementById('qualityRating').value = '5';
    document.getElementById('speedRating').value = '5';
    document.getElementById('feedbackText').value = '';
    document.getElementById('recommend').value = 'yes';
}

async function createRequest() {
    const carType = document.getElementById('carType').value;
    const carModel = document.getElementById('carModel').value;
    const problem = document.getElementById('problemDescription').value;

    if (!carType || !carModel || !problem) {
        alert('Заполните все обязательные поля');
        return;
    }

    try {
        const newRequest = {
            carType: carType,
            carModel: carModel,
            problemDescription: problem,
            clientId: currentUser.userID,
            requestStatus: 'Новая заявка'
        };

        await apiPost('/Requests', newRequest);

        alert('✅ Заявка создана');
        document.getElementById('newRequestForm').reset();
        await loadClientRequests();
        showTab('activeRequests');

    } catch (error) {
        alert('❌ Ошибка: ' + error.message);
    }
}

async function confirmPickup(requestId) {
    if (confirm(`Подтвердите получение автомобиля по заявке №${requestId}`)) {
        try {
            await apiPost(`/Requests/${requestId}`, {
                status: 'Завершена'
            });
            alert('Спасибо за обращение!');
            await loadClientRequests();
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }
    }
}

function showNotifications() {
    const list = document.getElementById('notificationsList');
    list.innerHTML = notifications.map(n => `
        <div class="comment" style="${n.read ? 'opacity:0.7' : 'font-weight:bold'}">
            <p>${n.message}</p>
            <small>${n.date.toLocaleString()}</small>
            ${!n.read ? `<button onclick="markAsRead(${n.id})">✓ Отметить прочитанным</button>` : ''}
        </div>
    `).join('');

    document.getElementById('notificationsModal').style.display = 'block';
}

function markAsRead(notificationId) {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
        notification.read = true;
        showNotifications();
        showNotificationsAlert();
    }
}

function contactManager() {
    alert('Звонок менеджеру: +7 (123) 456-78-90');
}

function filterHistory() {
    const search = document.getElementById('historySearch').value.toLowerCase();
    const status = document.getElementById('historyStatusFilter').value;

    let filtered = clientRequests.filter(r =>
        r.requestStatus === 'Завершена' || r.requestStatus === 'Готова к выдаче'
    );

    if (search) {
        filtered = filtered.filter(r =>
            r.requestID.toString().includes(search) ||
            r.carModel?.toLowerCase().includes(search) ||
            r.carType?.toLowerCase().includes(search)
        );
    }

    if (status) {
        filtered = filtered.filter(r =>
            (status === 'завершена' && r.requestStatus === 'Завершена') ||
            (status === 'готова' && r.requestStatus === 'Готова к выдаче')
        );
    }

    displayRequests(filtered, 'historyRequestsList');
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function logout() {
    app.logout();
}