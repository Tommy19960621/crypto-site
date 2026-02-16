class RelaxingTimer {
    constructor() {
        this.duration = 25 * 60; // default 25 minutes
        this.remaining = this.duration;
        this.isRunning = false;
        this.interval = null;

        // Audio Context
        this.audioCtx = null;

        // DOM Elements
        this.display = document.getElementById('timer-display');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.minutesInput = document.getElementById('minutes');
        this.secondsInput = document.getElementById('seconds');
        this.setTimeBtn = document.getElementById('set-time-btn');
        this.timerContainer = document.getElementById('timer-container');

        // SVG Elements
        this.circle = document.getElementById('progress-ring-circle');
        this.radius = this.circle.r.baseVal.value;
        this.circumference = 2 * Math.PI * this.radius;

        // Setup SVG
        this.circle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
        this.circle.style.strokeDashoffset = this.circumference;

        this.bindEvents();
        this.updateDisplay();
        this.setProgress(100); // Start full
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.setTimeBtn.addEventListener('click', () => this.setTime());
    }

    initAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playRelaxingSound() {
        this.initAudio();

        // Ensure context is running (browser policy)
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        // Relaxing Sine Wave
        oscillator.type = 'sine';

        // Pentatonic-like pleasant frequency (e.g., E5 - 659.25Hz)
        oscillator.frequency.setValueAtTime(659.25, this.audioCtx.currentTime);

        // Envelope for "Chime" effect
        const now = this.audioCtx.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1); // Slow attack
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 3); // Long decay

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.start(now);
        oscillator.stop(now + 3.1);
    }

    start() {
        if (this.isRunning) return;

        this.initAudio(); // Initialize audio context on first interaction
        this.isRunning = true;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.setTimeBtn.disabled = true;
        this.timerContainer.classList.remove('timer-finished');
        this.timerContainer.classList.remove('timer-pulsing');

        this.interval = setInterval(() => {
            if (this.remaining > 0) {
                this.remaining--;
                this.updateDisplay();
                this.updateProgress();

                // Pulse animation for last 10 seconds
                if (this.remaining <= 10) {
                    this.timerContainer.classList.add('timer-pulsing');
                }
            } else {
                this.timerContainer.classList.remove('timer-pulsing');
                this.timerFinished();
            }
        }, 1000);
    }

    pause() {
        if (!this.isRunning) return;
        this.isRunning = false;
        clearInterval(this.interval);
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.timerContainer.classList.remove('timer-pulsing');
    }

    reset() {
        this.pause();
        this.setTimeBtn.disabled = false;
        this.timerContainer.classList.remove('timer-finished');
        this.timerContainer.classList.remove('timer-pulsing');
        // Reset to currently set input time
        this.setTime();
    }

    setTime() {
        const mins = parseInt(this.minutesInput.value) || 0;
        const secs = parseInt(this.secondsInput.value) || 0;
        this.duration = (mins * 60) + secs;
        if (this.duration === 0) this.duration = 1; // Prevent div by 0
        this.remaining = this.duration;

        this.timerContainer.classList.remove('timer-finished');
        this.timerContainer.classList.remove('timer-pulsing');

        this.updateDisplay();
        this.setProgress(100);
    }

    updateDisplay() {
        const mins = Math.floor(this.remaining / 60);
        const secs = this.remaining % 60;
        this.display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        document.title = `${this.display.textContent} - Relaxing Timer`;
    }

    setProgress(percent) {
        const offset = this.circumference - (percent / 100) * this.circumference;
        this.circle.style.strokeDashoffset = offset;
        this.updateColor(percent);
    }

    updateProgress() {
        // Fix: recalculate percent based on remaining/duration
        const percent = (this.remaining / this.duration) * 100;
        this.setProgress(percent);
    }

    updateColor(percent) {
        // Interpolate color from Yellow (100%) -> Orange (50%) -> Red (0%)
        let r, g, b;

        if (percent > 50) {
            // Yellow (#F4D03F) to Orange (#F39C12)
            const ratio = (percent - 50) / 50; // 0 to 1
            r = Math.round(243 + (244 - 243) * ratio);
            g = Math.round(156 + (208 - 156) * ratio);
            b = Math.round(18 + (63 - 18) * ratio);
        } else {
            // Orange (#F39C12) to Red (#E74C3C)
            const ratio = percent / 50; // 0 to 1
            r = Math.round(231 + (243 - 231) * ratio);
            g = Math.round(76 + (156 - 76) * ratio);
            b = Math.round(60 + (18 - 60) * ratio);
        }

        const color = `rgb(${r}, ${g}, ${b})`;
        this.circle.style.stroke = color;
        this.display.style.color = color;
    }

    timerFinished() {
        this.pause();
        this.playRelaxingSound();
        this.setTimeBtn.disabled = false;
        this.display.textContent = "00:00";
        this.setProgress(0);

        // Add visual flair
        this.timerContainer.classList.add('timer-finished');
    }
}

// Initialize Timer
document.addEventListener('DOMContentLoaded', () => {
    // Check if timer already exists to prevent double initialization if script is loaded twice
    if (!window.timer) {
        window.timer = new RelaxingTimer();
    }
});
