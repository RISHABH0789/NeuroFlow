/**
 * calendar.js - FOCUS TRACKER FEATURE
 */

document.addEventListener('DOMContentLoaded', () => {
    if (typeof NeuroStorage === 'undefined') return;

    const appData = NeuroStorage.fetch();
    let currentViewDate = new Date();

    function formatTime(totalMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    function renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        const monthLabel = document.getElementById('monthDisplay') || document.getElementById('currentMonth');
        if (!grid) return;

        const year = currentViewDate.getFullYear();
        const month = currentViewDate.getMonth();
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentViewDate);
        
        if (monthLabel) monthLabel.innerText = `${monthName} ${year}`;
        grid.innerHTML = '';

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let padding = firstDay === 0 ? 6 : firstDay - 1;

        for (let i = 0; i < padding; i++) {
            grid.appendChild(Object.assign(document.createElement('div'), {className: 'calendar-day empty'}));
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const storageDateMatch = dateObj.toLocaleDateString(); 
            
            // Filter only for Focus Sessions now
            const dayHistory = (appData.history || []).filter(h => {
                const isCorrectDay = h.date === storageDateMatch || new Date(h.timestamp).toLocaleDateString() === storageDateMatch;
                return isCorrectDay && h.type === 'SESSION';
            });

            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            if (storageDateMatch === new Date().toLocaleDateString()) dayEl.classList.add('today');

            // Dot logic: Orange dot for focus sessions
            if (dayHistory.length > 0) {
                dayEl.innerHTML = `<span class="day-num">${day}</span><div class="indicators"><span class="dot orange-dot"></span></div>`;
            } else {
                dayEl.innerHTML = `<span class="day-num">${day}</span>`;
            }

            dayEl.onclick = () => {
                let mins = 0;
                dayHistory.forEach(item => {
                    mins += Number(item.duration || 0);
                });

                // Update Modal - Task count is ignored/removed
                document.getElementById('modalDate').innerText = dateObj.toDateString();
                document.getElementById('modalFocus').innerText = formatTime(mins);
                
                // We simplify efficiency to be based purely on focus time (Goal: 2 hours = 100%)
                const focusEff = Math.min(Math.round((mins / 120) * 100), 100);
                document.getElementById('modalEff').innerText = focusEff + "%";

                const modal = document.getElementById('dayModal');
                if (modal) {
                    modal.classList.add('active');
                    modal.style.display = 'flex';
                }
            };
            grid.appendChild(dayEl);
        }
    }

    // Nav & Close
    document.querySelectorAll('#prevMonth').forEach(b => b.onclick = () => { currentViewDate.setMonth(currentViewDate.getMonth() - 1); renderCalendar(); });
    document.querySelectorAll('#nextMonth').forEach(b => b.onclick = () => { currentViewDate.setMonth(currentViewDate.getMonth() + 1); renderCalendar(); });
    window.closeModal = () => {
        const m = document.getElementById('dayModal');
        if (m) { m.classList.remove('active'); m.style.display = 'none'; }
    };

    renderCalendar();
});