let currentUser = null;
let currentRequestId = null;
let allRequests = [];
let allUsers = [];
let allComments = [];

const surveyUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdhZcExx6LSIXxk0ub55mSu-WIh23WYdGG9HY5EZhLDo7P8eA/viewform?usp=sf_link';

document.addEventListener('DOMContentLoaded', async function () {
    currentUser = app.getUser();
    if (!currentUser) {
        window.location.href = 'authorization.html';
        return;
    }

    document.getElementById('userName').textContent = currentUser.fio || currentUser.login;

    await loadAllData();
});

async function loadAllData() {
    try {
        // Загружаем пользователей
        allUsers = await apiGet('/ManagerData/users');
        console.log('Загружено пользователей:', allUsers.length);

        // Загружаем заявки
        allRequests = await apiGet('/ManagerData/requests');
        console.log('Загружено заявок:', allRequests.length);
        console.log('Первая заявка:', allRequests[0]); // Для отладки

        // Загружаем комментарии
        try {
            allComments = await apiGet('/ManagerData/comments');
            console.log('Загружено комментариев:', allComments.length);
        } catch (error) {
            console.log('Комментарии не загружены');
            allComments = [];
        }

        // Обновляем интерфейс
        updateStatistics();
        displayAllRequests();
        displayQRRequests();
        checkHelpRequests();

    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        document.getElementById('requestsTable').innerHTML =
            '<tr><td colspan="7">Ошибка загрузки данных: ' + error.message + '</td></tr>';
    }
}

function updateStatistics() {
    const total = allRequests.length;
    const inProgress = allRequests.filter(r => r.requestStatus === 'В процессе ремонта').length;
    const ready = allRequests.filter(r => r.requestStatus === 'Готова к выдаче').length;

    // Просроченные (более 7 дней)
    const now = new Date();
    const overdue = allRequests.filter(r => {
        if (r.requestStatus === 'Готова к выдаче' || r.requestStatus === 'Завершена') return false;
        const startDate = new Date(r.startDate);
        const days = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
        return days > 7;
    }).length;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('inProgressCount').textContent = inProgress;
    document.getElementById('readyCount').textContent = ready;
    document.getElementById('overdueCount').textContent = overdue;
}

function getUserName(userId) {
    if (!userId) return 'Не назначен';
    const user = allUsers.find(u => u.userID === userId);
    return user ? user.fio : `ID: ${userId}`;
}

function displayAllRequests() {
    const tbody = document.getElementById('requestsTable');

    if (allRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">Нет заявок</td></tr>';
        return;
    }

    tbody.innerHTML = allRequests.map(r => {
        let statusClass = '';
        if (r.requestStatus === 'В процессе ремонта') statusClass = 'status-progress';
        else if (r.requestStatus === 'Готова к выдаче') statusClass = 'status-ready';
        else if (r.requestStatus === 'Новая заявка') statusClass = 'status-new';

        return `<tr>
                        <td>${r.requestID}</td>
                        <td>${getUserName(r.clientID)}</td>
                        <td>${r.carType || ''} ${r.carModel || ''}</td>
                        <td>${r.problemDescription || ''}</td>
                        <td><span class="status-badge ${statusClass}">${r.requestStatus}</span></td>
                        <td>${getUserName(r.masterID)}</td>
                        <td>
                            <button class="action-btn extend-btn" onclick="openExtendModal(${r.requestID})">📅 Продлить</button>
                            <button class="action-btn assign-btn" onclick="openAssignModal(${r.requestID})">👥 Привлечь</button>
                        </td>
                    </tr>`;
    }).join('');
}

function displayQRRequests() {
    const tbody = document.getElementById('qrTable');

    const readyRequests = allRequests.filter(r => r.requestStatus === 'Готова к выдаче');

    if (readyRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">Нет заявок готовых к выдаче</td></tr>';
        return;
    }

    tbody.innerHTML = readyRequests.map(r => {
        return `<tr>
                        <td>${r.requestID}</td>
                        <td>${getUserName(r.clientID)}</td>
                        <td>${r.carType || ''} ${r.carModel || ''}</td>
                        <td>${r.requestStatus}</td>
                        <td>
                            <button class="action-btn qr-btn" onclick="generateQR(${r.requestID})">📱 Сгенерировать QR</button>
                        </td>
                    </tr>`;
    }).join('');
}

function checkHelpRequests() {
    if (!allComments || allComments.length === 0) {
        document.getElementById('helpAlert').style.display = 'none';
        document.getElementById('helpTable').innerHTML = '<tr><td colspan="5">Нет комментариев</td></tr>';
        return;
    }

    // ПОКАЗЫВАЕМ ВСЕ КОММЕНТАРИИ
    document.getElementById('helpCount').textContent = allComments.length;
    document.getElementById('helpAlert').style.display = 'flex';

    const tbody = document.getElementById('helpTable');
    tbody.innerHTML = allComments.map(c => {
        const request = allRequests.find(r => r.requestID === c.requestID);
        return `<tr>
            <td>${c.requestID}</td>
            <td>${getUserName(c.masterID)}</td>
            <td>${request?.problemDescription?.substring(0, 30) || ''}</td>
            <td>${c.message}</td>
            <td>
                <button class="action-btn" onclick="respondToHelp(${c.requestID})">Ответить</button>
                <button class="action-btn assign-btn" onclick="openAssignModal(${c.requestID})">👥 Привлечь</button>
            </td>
        </tr>`;
    }).join('');
}

function openExtendModal(requestId) {
    currentRequestId = requestId;
    const request = allRequests.find(r => r.requestID === requestId);

    document.getElementById('extendRequestInfo').innerHTML = `
                    <strong>Заявка №${requestId}</strong><br>
                    Клиент: ${getUserName(request.clientID)}<br>
                    Дата создания: ${new Date(request.startDate).toLocaleDateString()}<br>
                    Статус: ${request.requestStatus}
                `;

    document.getElementById('extendModal').style.display = 'block';
}

function extendDeadline() {
    const reason = document.getElementById('extendReason').value;
    if (!reason) {
        alert('Укажите причину продления');
        return;
    }
    alert(`Срок заявки ${currentRequestId} продлен. Причина: ${reason}`);
    closeModal('extendModal');
    document.getElementById('extendReason').value = '';
}

function openAssignModal(requestId) {
    currentRequestId = requestId;
    const request = allRequests.find(r => r.requestID === requestId);

    document.getElementById('assignRequestInfo').innerHTML = `
                    <strong>Заявка №${requestId}</strong><br>
                    Проблема: ${request.problemDescription}<br>
                    Текущий механик: ${getUserName(request.masterID)}
                `;

    const mechanics = allUsers.filter(u => u.type === 'Автомеханик');
    const select = document.getElementById('mechanicSelect');
    select.innerHTML = mechanics.map(m =>
        `<option value="${m.userID}">${m.fio}</option>`
    ).join('');

    document.getElementById('assignModal').style.display = 'block';
}

function assignMechanic() {
    const mechanicId = document.getElementById('mechanicSelect').value;
    const comment = document.getElementById('assignComment').value;

    if (!mechanicId) {
        alert('Выберите механика');
        return;
    }

    alert(`Механик привлечен к заявке ${currentRequestId}. Комментарий: ${comment || 'Не указан'}`);
    closeModal('assignModal');
    document.getElementById('assignComment').value = '';
}

function generateQR(requestId) {
    console.log('1. Начало генерации QR для заявки', requestId);

    const qrContainer = document.getElementById('qrContainer');
    console.log('2. qrContainer:', qrContainer);

    if (!qrContainer) {
        alert('Ошибка: контейнер для QR-кода не найден!');
        return;
    }

    const surveyUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdhZcExx6LSIXxk0ub55mSu-WIh23WYdGG9HY5EZhLDo7P8eA/viewform?usp=sf_link';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(surveyUrl + '?request=' + requestId)}`;

    console.log('3. URL для QR:', qrUrl);

    qrContainer.className = 'qr-container';
    qrContainer.innerHTML = `
        <img src="${qrUrl}" 
             alt="QR-код для оценки"
             onerror="this.onerror=null; alert('Ошибка загрузки QR-кода'); this.src='';">
        <p><strong>Заявка №${requestId}</strong></p>
        <p>Отсканируйте для оценки качества</p>
        <button onclick="window.print()">🖨️ Распечатать</button>
    `;

    console.log('4. QR-код вставлен, открываем модальное окно');

    const modal = document.getElementById('qrModal');
    if (modal) {
        modal.style.display = 'block';
        console.log('5. Модальное окно открыто');
    } else {
        alert('Ошибка: модальное окно не найдено!');
    }
}

function respondToHelp(requestId) {
    alert(`Ответ отправлен механику по заявке ${requestId}`);
}

function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function logout() {
    app.logout();
}
