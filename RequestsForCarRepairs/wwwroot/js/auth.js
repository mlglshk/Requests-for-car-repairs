// js/auth.js
const app = {
    apiUrl: 'https://localhost:10001/api',

    setUser: function (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
    },

    getUser: function () {
        const userStr = sessionStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    },

    logout: function () {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'authorization.html';
    }
};

async function apiGet(url) {
    const response = await fetch(app.apiUrl + url);
    if (!response.ok) throw new Error('Ошибка');
    return await response.json();
}

async function apiPost(url, data) {
    const response = await fetch(app.apiUrl + url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Ошибка');
    return await response.json();
}