document.addEventListener('DOMContentLoaded', () => {
    // 1. DATA INITIALIZATION
    const appData = NeuroStorage.fetch();
    
    const elements = {
        xp: document.getElementById('xp-val'),
        eff: document.getElementById('efficiency-val'),
        streak: document.getElementById('streak-val'),
        taskList: document.getElementById('task-list-container'),
        weekly: document.getElementById('weekly-activity-container'),
        addBtn: document.getElementById('add-task-btn'),
        input: document.getElementById('new-task-input'),
        prio: document.getElementById('priority-select'),
        effStatus: document.getElementById('efficiency-status')
    };

    // --- 1. MIDNIGHT RESET LOGIC ---
    function checkDailyReset() {
        const today = new Date().toLocaleDateString();
        
        if (appData.lastLoginDate !== today) {
            console.log("🕛 New day detected. Resetting checkboxes...");
            
            // Uncheck all tasks for the new day
            appData.activeTasks.forEach(task => task.completed = false);
            
            // Streak Protection: Reset to 0 if they missed yesterday
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toLocaleDateString();

            if (appData.lastStreakUpdate !== yesterdayStr && appData.lastStreakUpdate !== today) {
                appData.currentStreak = 0;
            }

            appData.lastLoginDate = today;
            NeuroStorage.save(appData);
        }
    }

    // --- 2. STREAK INCREMENT ---
    function handleStreakIncrement() {
        const todayStr = new Date().toLocaleDateString();
        if (appData.lastStreakUpdate === todayStr) return;

        appData.currentStreak += 1;
        appData.lastStreakUpdate = todayStr;
        
        NeuroStorage.save(appData);
        renderStats();
    }

    // --- 3. RENDERING FUNCTIONS ---
    function renderStats() {
        if (elements.xp) elements.xp.innerText = (appData.xp || 0).toLocaleString();
        if (elements.eff) elements.eff.innerText = (appData.focusMinutes || 0) + "m";
        if (elements.streak) elements.streak.innerText = appData.currentStreak || 0;
        if (elements.effStatus) elements.effStatus.innerText = appData.focusMinutes > 0 ? "STABLE" : "IDLE";
    }

    function renderTasks() {
        if (!elements.taskList) return;

        if (appData.activeTasks.length === 0) {
            elements.taskList.innerHTML = `<p style="text-align:center; opacity:0.3; padding:20px; font-size:0.8rem; font-family:monospace;">NO_OBJECTIVES_LOADED</p>`;
            return;
        }

        elements.taskList.innerHTML = appData.activeTasks.map((t, i) => {
            const pClass = t.priority === 'high' ? 'high-priority' : 'med-priority';
            const isChecked = t.completed ? 'checked' : '';
            const strikeStyle = t.completed ? 'text-decoration: line-through; opacity: 0.5;' : '';

            return `
                <div class="task-entry ${pClass}">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <input type="checkbox" ${isChecked} onchange="toggleTask(${i})" 
                               style="accent-color: var(--cyan); width: 18px; height: 18px; cursor: pointer;">
                        <span class="task-text" style="${strikeStyle}">${t.text}</span>
                    </div>
                    <button onclick="removeTask(${i})" class="del-btn" style="background:none; border:none; color:var(--orange); cursor:pointer;">✕</button>
                </div>
            `;
        }).join('');
    }

    function renderWeeklyChart() {
        if (!elements.weekly) return;
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push(d.toLocaleDateString());
        }

        elements.weekly.innerHTML = last7Days.map(dateStr => {
            const dayLabel = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
            const mins = (appData.history || [])
                .filter(h => h.date === dateStr && h.type === 'SESSION')
                .reduce((total, s) => total + parseInt(s.duration || 0), 0);
            
            const height = Math.min((mins / 120) * 100, 100);
            return `
                <div class="weekly-bar-item">
                    <div class="bar-column"><div class="bar-fill" style="height:${height}%"></div></div>
                    <span class="day-name">${dayLabel}</span>
                </div>`;
        }).join('');
    }

    // --- 4. GLOBAL ACTIONS ---
    window.toggleTask = (index) => {
        const task = appData.activeTasks[index];
        task.completed = !task.completed;
        
        if (task.completed) {
            appData.xp = (appData.xp || 0) + 50;
            // Send to History for Calendar
            NeuroStorage.recordTaskCompletion(task.text);
        } else {
            appData.xp = Math.max(0, (appData.xp || 0) - 50);
            // Note: We don't remove from history to keep the timeline accurate
        }
        
        const allDone = appData.activeTasks.every(t => t.completed);
        if (allDone && appData.activeTasks.length > 0) {
            handleStreakIncrement();
        }

        NeuroStorage.save(appData);
        renderStats();
        renderTasks();
    };

    window.removeTask = (index) => {
        appData.activeTasks.splice(index, 1);
        NeuroStorage.updateTasks(appData.activeTasks);
        renderTasks();
    };

    if (elements.addBtn) {
        elements.addBtn.onclick = () => {
            const val = elements.input.value.trim();
            if (!val) return;
            const prio = elements.prio ? elements.prio.value : 'med';
            appData.activeTasks.push({ text: val, priority: prio, completed: false });
            NeuroStorage.updateTasks(appData.activeTasks);
            elements.input.value = '';
            renderTasks();
        };
    }

    // --- 5. INITIALIZE ---
    checkDailyReset();
    renderStats();
    renderTasks();
    renderWeeklyChart();
});