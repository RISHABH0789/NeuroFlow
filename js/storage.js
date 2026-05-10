// storage.js - THE UNIVERSAL BRAIN
const STORAGE_KEY = 'neuroflow_global_data';

const NeuroStorage = {
    // 1. Fetch with Safety Defaults
    fetch: () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : null;
            
            return {
                xp: parsed?.xp || 0,
                focusMinutes: parsed?.focusMinutes || 0,
                currentStreak: parsed?.currentStreak || 0,
                lastStreakUpdate: parsed?.lastStreakUpdate || null,
                lastLoginDate: parsed?.lastLoginDate || new Date().toLocaleDateString(),
                history: Array.isArray(parsed?.history) ? parsed.history : [],
                activeTasks: Array.isArray(parsed?.activeTasks) ? parsed.activeTasks : []
            };
        } catch (e) {
            console.error("Storage Corrupted, resetting to defaults", e);
            return { xp: 0, focusMinutes: 0, currentStreak: 0, lastStreakUpdate: null, history: [], activeTasks: [] };
        }
    },

    save: (data) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },

    updateTasks: (tasks) => {
        const data = NeuroStorage.fetch();
        data.activeTasks = tasks;
        NeuroStorage.save(data);
    },

    // Records when you finish a focus timer
    recordSession: (mins) => {
        const data = NeuroStorage.fetch();
        const now = new Date();
        const newEntry = {
            id: Date.now(),
            type: 'SESSION',
            duration: mins,
            timestamp: now.getTime(),
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        data.history.push(newEntry);
        data.focusMinutes += mins;
        data.xp += (mins * 10);
        NeuroStorage.save(data);
    },

    // NEW: Records when you check a task for the Calendar
    recordTaskCompletion: (taskText) => {
        const data = NeuroStorage.fetch();
        const now = new Date();
        const newEntry = {
            id: Date.now(),
            type: 'TASK',
            title: taskText,
            timestamp: now.getTime(),
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        data.history.push(newEntry);
        // XP and Task State are handled in dashboard.js toggle logic
        NeuroStorage.save(data);
    }
};