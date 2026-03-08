
function calculateAverageRepairTime() {
    console.log('НАЧАЛО АЛГОРИТМА');


    const requests = allRequests;

    if (!requests || requests.length === 0) {
        const message = 'Нет данных для расчета';
        console.log(message);
        alert(message); 
        return message;
    }

    console.log(`Всего заявок: ${requests.length}`);

    let timeSum = 0;
    let quantityFinish = 0;

    for (let i = 0; i < requests.length; i++) {
        const request = requests[i];

        console.log(`\nЗаявка №${request.requestID}:`);
        console.log(`  Статус: "${request.requestStatus}"`);
        console.log(`  Дата завершения: ${request.completionDate || 'нет'}`);

        
        if ((request.requestStatus === 'Готова к выдаче' || request.requestStatus === 'Завершена')
            && request.completionDate) {

            console.log('Заявка завершена');

            const start = new Date(request.startDate);
            const finish = new Date(request.completionDate);
            const hours = (finish - start) / (1000 * 60 * 60);

            console.log(`  Длительность: ${hours.toFixed(1)} часов`);

            timeSum += hours;
            quantityFinish++;
            console.log(`  Текущая сумма: ${timeSum.toFixed(1)}`);
            console.log(`  Завершенных заявок: ${quantityFinish}`);
        } else {
            console.log('  ❌ Заявка не завершена');
        }
    }

    console.log('\nРЕЗУЛЬТАТ');
    console.log(`Всего завершенных: ${quantityFinish}`);

    if (quantityFinish === 0) {
        const message = 'Нет завершенных заявок';
        console.log(message);
        alert(message);

        const resultEl = document.getElementById('averageTimeResult');
        if (resultEl) resultEl.innerHTML = message;

        const totalEl = document.getElementById('analyticsTotal');
        if (totalEl) totalEl.textContent = requests.length;

        const completedEl = document.getElementById('analyticsCompleted');
        if (completedEl) completedEl.textContent = '0';

        const percentEl = document.getElementById('analyticsPercent');
        if (percentEl) percentEl.textContent = '0%';

        return message;
    }

    const avgHours = timeSum / quantityFinish;
    const avgDays = (avgHours / 24).toFixed(1);

    const result = `Среднее время ремонта: ${avgHours.toFixed(1)} часов (${avgDays} дн.)`;
    console.log(result);


    const resultEl = document.getElementById('averageTimeResult');
    if (resultEl) resultEl.innerHTML = result;

    const totalEl = document.getElementById('analyticsTotal');
    if (totalEl) totalEl.textContent = requests.length;

    const completedEl = document.getElementById('analyticsCompleted');
    if (completedEl) completedEl.textContent = quantityFinish;

    const percent = ((quantityFinish / requests.length) * 100).toFixed(1);
    const percentEl = document.getElementById('analyticsPercent');
    if (percentEl) percentEl.textContent = percent + '%';

    alert(result); 

    return result;
}


window.calculateAverageRepairTime = calculateAverageRepairTime;