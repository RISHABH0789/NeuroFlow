class NeuroTimer {
    constructor() {
        // Default: 25 minutes
        this.timeLeft = 1500;
        this.totalTime = 1500;
        this.timerInterval = null;
        this.state = 'READY';
        
        // Elements
        this.display = document.getElementById('timeRemaining');
        this.circle = document.getElementById('timerProgress');
        this.mainBtn = document.getElementById('mainControl');
        
        // Progress Ring Setup
        if (this.circle) {
            this.radius = this.circle.r.baseVal.value;
            this.circumference = this.radius * 2 * Math.PI;
            this.circle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
        }
        
        this.init();
    }

    init() {
        this.updateDisplay();
        
        // Control Listeners
        this.mainBtn?.addEventListener('click', () => this.toggleTimer());
        document.getElementById('resetControl')?.addEventListener('click', () => this.reset());
        
        // Custom Input Logic
        const customInp = document.getElementById('customInput');
        if (customInp) {
            customInp.onchange = (e) => this.parseCustomTime(e.target.value);
        }
    }

    // --- THE ADDED FUNCTIONS ---
    
    setDuration(seconds) {
        this.pause(); // Stop if running
        this.totalTime = seconds;
        this.timeLeft = seconds;
        this.state = 'READY';
        this.updateDisplay();
        
        if (this.mainBtn) {
            this.mainBtn.innerHTML = '<i data-lucide="play"></i> Start Flow';
            lucide.createIcons();
        }
    }

    parseCustomTime(val) {
        let seconds = 0;
        const h = val.match(/(\d+)h/);
        const m = val.match(/(\d+)m/);
        const s = val.match(/(\d+)s/);

        if (h) seconds += parseInt(h[1]) * 3600;
        if (m) seconds += parseInt(m[1]) * 60;
        if (s) seconds += parseInt(s[1]);

        if (seconds > 0) {
            this.setDuration(seconds);
        }
    }

    // --- CONTROL LOGIC ---

    toggleTimer() {
        (this.state === 'READY' || this.state === 'PAUSED') ? this.start() : this.pause();
    }

    start() {
        this.state = 'FOCUSING';
        if (this.mainBtn) {
            this.mainBtn.innerHTML = '<i data-lucide="pause"></i> Stop Flow';
            lucide.createIcons();
        }
        
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            if (this.timeLeft <= 0) this.completeSession();
        }, 1000);
    }

    pause() {
        this.state = 'PAUSED';
        clearInterval(this.timerInterval);
        if (this.mainBtn) {
            this.mainBtn.innerHTML = '<i data-lucide="play"></i> Resume';
            lucide.createIcons();
        }
    }

    reset() {
        this.pause();
        this.timeLeft = this.totalTime;
        this.updateDisplay();
    }

    updateDisplay() {
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        
        if (this.display) {
            this.display.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        
        if (this.circle) {
            const offset = this.circumference - (this.timeLeft / this.totalTime) * this.circumference;
            this.circle.style.strokeDashoffset = offset;
        }
    }

    completeSession() {
        this.pause();
        this.state = 'COMPLETED';
        
        // Sync to the shared brain
        const minsFocused = Math.floor(this.totalTime / 60);
        NeuroStorage.recordSession(minsFocused); 
        
        const overlay = document.getElementById('rewardOverlay');
        if (overlay) overlay.style.display = 'flex';
    }
}

// Initialize and Globalize
const timerApp = new NeuroTimer();
window.timerApp = timerApp; 

window.closeReward = () => {
    document.getElementById('rewardOverlay').style.display = 'none';
    window.location.href = "dashboard.html";
};