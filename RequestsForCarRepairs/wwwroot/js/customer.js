let currentUser = null;
let clientRequests = [];
let notifications = [];

document.addEventListener('DOMContentLoaded', function () {
    currentUser = app.getUser();
    if (!currentUser || (currentUser.type?.toLowerCase() !== 'клиент' && currentUser.type?.toLowerCase() !== 'admin')) {
        // Для демо создаем тестового клиента
        currentUser = {
            userID: 1,
            fio: 'Иванов Иван Иванович',
            login: 'client',
            type: 'клиент'
        };
        app.setUser(currentUser);
    }

    document.getElementById('userName').textContent = currentUser.fio || currentUser.login;

    loadClientData();
});

function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));

    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');

    if (tabName === 'activeRequests') loadActiveRequests();
    if (tabName === 'requestHistory') loadRequestHistory();
    if (tabName === 'feedback') loadCompletedForFeedback();
}

function loadClientData() {
    // Имитация загрузки данных клиента
    setTimeout(() => {
        clientRequests = [
            {
                requestID: 101,
                startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                carType: 'Легковой',
                carModel: 'Toyota Camry',
                problemDescription: 'Не заводится двигатель, странный звук при попытке запуска',
                requestStatus: 'в работе',
                completionDate: null,
                master: { fio: 'Петров П.П.' },
                comments: [
                    { authorName: 'Петров П.П.', message: 'Диагностика показала проблемы со стартером', createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
                    { authorName: 'Петров П.П.', message: 'Заказан новый стартер, ожидаем поставку', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
                ],
                parts: [
                    { name: 'Стартер', partNumber: 'ST-123', quantity: 1, isOrdered: true }
                ]
            },
            {
                requestID: 102,
                startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                carType: 'Легковой',
                carModel: 'KIA Rio',
                problemDescription: 'Плавающие обороты, дергается при разгоне',
                requestStatus: 'готова',
                completionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                master: { fio: 'Сидоров С.С.' },
                comments: [
                    { authorName: 'Сидоров С.С.', message: 'Произведена чистка дроссельной заслонки', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
                    { authorName: 'Сидоров С.С.', message: 'Замена свечей зажигания', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
                ],
                parts: [
                    { name: 'Свечи зажигания', partNumber: 'NGK-456', quantity: 4, isOrdered: true }
                ]
            },
            {
                requestID: 103,
                startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                carType: 'Грузовой',
                carModel: 'ГАЗель',
                problemDescription: 'Стук в подвеске спереди',
                requestStatus: 'завершена',
                completionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                master: { fio: 'Кузнецов К.К.' },
                comments: [
                    { authorName: 'Кузнецов К.К.', message: 'Замена передних амортизаторов', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
                    { authorName: 'Кузнецов К.К.', message: 'Сход-развал выполнен', createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) }
                ],
                parts: [
                    { name: 'Амортизаторы', partNumber: 'KYB-789', quantity: 2, isOrdered: true }
                ]
            }
        ];

        // Уведомления
        notifications = [
            { id: 1, message: 'По заявке №101 обновлен статус: "В работе"', date: new Date(), read: false },
            { id: 2, message: 'Заявка №102 готова к выдаче', date: new Date(), read: false },
            { id: 3, message: 'Добавлен комментарий по заявке №101', date: new Date(), read: true }
        ];

        updateStatistics();
        showNotificationsAlert();
        loadActiveRequests();
    }, 500);
}

function updateStatistics() {
    const total = clientRequests.length;
    const inProgress = clientRequests.filter(r => r.requestStatus === 'в работе' || r.requestStatus === 'ожидание').length;
    const completed = clientRequests.filter(r => r.requestStatus === 'завершена').length;
    const ready = clientRequests.filter(r => r.requestStatus === 'готова').length;

    document.getElementById('totalClientRequests').textContent = total;
    document.getElementById('clientInProgress').textContent = inProgress;
    document.getElementById('clientCompleted').textContent = completed;
    document.getElementById('clientReady').textContent = ready;
}

function showNotificationsAlert() {
    const unreadCount = notifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
        document.getElementById('notificationCount').textContent = unreadCount;
        document.getElementById('notificationPanel').style.display = 'flex';
    }
}

function loadActiveRequests() {
    const active = clientRequests.filter(r => r.requestStatus !== 'завершена');
    displayClientRequests(active, 'activeRequestsList', true);
}

function loadRequestHistory() {
    const history = clientRequests.filter(r => r.requestStatus === 'завершена');
    displayClientRequests(history, 'historyRequestsList', false);
}

function loadCompletedForFeedback() {
    const completed = clientRequests.filter(r => r.requestStatus === 'завершена' || r.requestStatus === 'готова');

    if (completed.length === 0) {
        document.getElementById('completedForFeedback').innerHTML = '<p>Нет завершенных заявок для отзыва</p>';
        return;
    }

    document.getElementById('completedForFeedback').innerHTML = completed.map(r => `
                    <div class="request-card">
                        <h3>Заявка №${r.requestID}</h3>
                        <p><strong>Автомобиль:</strong> ${r.carType} ${r.carModel}</p>
                        <p><strong>Проблема:</strong> ${r.problemDescription}</p>
                        <p><strong>Статус:</strong> <span class="status">${r.requestStatus}</span></p>
                        <p><strong>Механик:</strong> ${r.master?.fio || 'Не указан'}</p>
                        <p><strong>Дата завершения:</strong> ${r.completionDate ? new Date(r.completionDate).toLocaleDateString() : 'Не указана'}</p>
                        <button onclick="showFeedbackForm(${r.requestID})">Оставить отзыв</button>
                    </div>
                `).join('');
}

function displayClientRequests(requests, elementId, showTimeline) {
    const container = document.getElementById(elementId);

    if (!requests || requests.length === 0) {
        container.innerHTML = '<p>Заявок не найдено</p>';
        return;
    }

    container.innerHTML = requests.map(r => {
        const statusClass = {
            'новая': 'status-new',
            'в работе': 'status-progress',
            'ожидание': 'status-waiting',
            'готова': 'status-ready',
            'завершена': 'status-completed'
        }[r.requestStatus?.toLowerCase()] || '';

        return `
                        <div class="request-card">
                            <h3>Заявка №${r.requestID}</h3>
                            <p><strong>Дата создания:</strong> ${new Date(r.startDate).toLocaleString()}</p>
                            <p><strong>Автомобиль:</strong> ${r.carType || ''} ${r.carModel || ''}</p>
                            <p><strong>Проблема:</strong> ${r.problemDescription || ''}</p>
                            <p><strong>Статус:</strong> <span class="status ${statusClass}">${r.requestStatus}</span></p>
                            <p><strong>Механик:</strong> ${r.master?.fio || 'Не назначен'}</p>
                            ${r.completionDate ? `<p><strong>Дата завершения:</strong> ${new Date(r.completionDate).toLocaleDateString()}</p>` : ''}
                            <button onclick="showRequestDetails(${r.requestID})">Подробнее</button>

                            ${r.requestStatus === 'готова' ? `
                                <button onclick="confirmPickup(${r.requestID})" style="background: #4CAF50;">✅ Забрать авто</button>
                            ` : ''}
                        </div>
                    `;
    }).join('');
}

function showRequestDetails(requestId) {
    const request = clientRequests.find(r => r.requestID === requestId);
    if (!request) return;

    document.getElementById('detailModalTitle').textContent = `Заявка №${requestId}`;


    document.getElementById('requestDetailInfo').innerHTML = `
                    <p><strong>Автомобиль:</strong> ${request.carType} ${request.carModel}</p>
                    <p><strong>Проблема:</strong> ${request.problemDescription}</p>
                    <p><strong>Статус:</strong> ${request.requestStatus}</p>
                    <p><strong>Механик:</strong> ${request.master?.fio || 'Не назначен'}</p>
                    <p><strong>Дата создания:</strong> ${new Date(request.startDate).toLocaleString()}</p>
                    ${request.completionDate ? `<p><strong>Дата завершения:</strong> ${new Date(request.completionDate).toLocaleString()}</p>` : ''}
                `;


    document.getElementById('statusTimeline').innerHTML = `
                    <div style="margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                        <p>✅ Заявка создана: ${new Date(request.startDate).toLocaleString()}</p>
                        ${request.requestStatus !== 'новая' ? '<p>🔄 В работе</p>' : ''}
                        ${request.completionDate ? `<p>✅ Завершена: ${new Date(request.completionDate).toLocaleString()}</p>` : ''}
                    </div>
                `;


    if (request.comments && request.comments.length > 0) {
        document.getElementById('detailComments').innerHTML = request.comments.map(c => `
                        <div class="comment">
                            <strong>${c.authorName}:</strong> ${c.message}
                            <br><small>${new Date(c.createdAt).toLocaleString()}</small>
                        </div>
                    `).join('');
    } else {
        document.getElementById('detailComments').innerHTML = '<p>Комментариев пока нет</p>';
    }

    if (request.parts && request.parts.length > 0) {
        document.getElementById('detailParts').innerHTML = request.parts.map(p => `
                        <div class="comment">
                            <strong>${p.name}</strong> (${p.partNumber}) - ${p.quantity} шт.
                            ${p.isOrdered ? '✅ Заказано' : '⏳ Ожидает заказа'}
                        </div>
                    `).join('');
    } else {
        document.getElementById('detailParts').innerHTML = '<p>Запчасти не заказывались</p>';
    }

    document.getElementById('requestDetailModal').style.display = 'block';
}

function showFeedbackForm(requestId) {
    document.getElementById('feedbackRequestId').textContent = requestId;
    document.getElementById('feedbackForm').style.display = 'block';
    document.getElementById('feedbackTab').scrollTop = document.getElementById('feedbackForm').offsetTop;
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

    alert(`
                    Спасибо за ваш отзыв по заявке №${requestId}!

                    Оценка: ${rating}
                    Качество ремонта: ${qualityRating}
                    Скорость: ${speedRating}
                    Рекомендация: ${recommend === 'yes' ? '✅ Да' : '❌ Нет'}

                    Ваш отзыв: "${feedbackText}"

                    Мы ценим ваше мнение!
                `);

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

function createRequest() {
    const carType = document.getElementById('carType').value;
    const carModel = document.getElementById('carModel').value;
    const problem = document.getElementById('problemDescription').value;
    const desiredDate = document.getElementById('desiredDate').value;
    const wishes = document.getElementById('additionalWishes').value;

    if (!carType || !carModel || !problem) {
        alert('Заполните все обязательные поля');
        return;
    }

    const newId = Math.max(...clientRequests.map(r => r.requestID)) + 1;

    const newRequest = {
        requestID: newId,
        startDate: new Date(),
        carType: carType,
        carModel: carModel,
        problemDescription: problem,
        requestStatus: 'новая',
        completionDate: null,
        master: null,
        comments: [],
        parts: []
    };

    clientRequests.push(newRequest);

    alert(`Заявка №${newId} успешно создана! Ожидайте подтверждения от диспетчера.`);


    document.getElementById('newRequestForm').reset();


    showTab('activeRequests');
    loadActiveRequests();
    updateStatistics();
}

function confirmPickup(requestId) {
    if (confirm(`Подтвердите получение автомобиля по заявке №${requestId}`)) {
        const request = clientRequests.find(r => r.requestID === requestId);
        if (request) {
            request.requestStatus = 'завершена';
            request.completionDate = new Date();
            alert('Спасибо за обращение! Будем рады видеть вас снова.');
            loadActiveRequests();
            loadRequestHistory();
            updateStatistics();
        }
    }
}

function showNotifications() {
    document.getElementById('notificationsList').innerHTML = notifications.map(n => `
                    <div class="comment" style="${n.read ? 'opacity: 0.7;' : 'font-weight: bold;'}">
                        <p>${n.message}</p>
                        <small>${new Date(n.date).toLocaleString()}</small>
                        ${!n.read ? `<button onclick="markAsRead(${n.id})" style="margin-top: 5px;">✓ Отметить прочитанным</button>` : ''}
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

    let filtered = clientRequests.filter(r => r.requestStatus === 'завершена' || r.requestStatus === 'готова');

    if (search) {
        filtered = filtered.filter(r =>
            r.requestID.toString().includes(search) ||
            r.carModel.toLowerCase().includes(search) ||
            r.carType.toLowerCase().includes(search)
        );
    }

    if (status) {
        filtered = filtered.filter(r => r.requestStatus === status);
    }

    displayClientRequests(filtered, 'historyRequestsList', false);
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function logout() {
    app.logout();
}