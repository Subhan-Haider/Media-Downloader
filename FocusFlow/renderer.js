const timeDisplay = document.getElementById('time');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const modeBtns = document.querySelectorAll('.mode-btn');
const circle = document.querySelector('.progress-ring__circle');

const radius = circle.r.baseVal.value;
const circumference = radius * 2 * Math.PI;

circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = circumference;

let timeLeft = 25 * 60;
let totalTime = 25 * 60;
let timerId = null;
let isRunning = false;

function setProgress(percent) {
  const offset = circumference - percent / 100 * circumference;
  circle.style.strokeDashoffset = offset;
}

function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  const percent = ((totalTime - timeLeft) / totalTime) * 100;
  setProgress(percent);
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  startBtn.textContent = 'Pause';
  
  timerId = setInterval(() => {
    timeLeft--;
    updateDisplay();
    
    if (timeLeft <= 0) {
      clearInterval(timerId);
      isRunning = false;
      startBtn.textContent = 'Start';
      // Play a sound here in a real app
      new Notification('FocusFlow', { body: 'Time is up!' });
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerId);
  isRunning = false;
  startBtn.textContent = 'Start';
}

function resetTimer() {
  pauseTimer();
  timeLeft = totalTime;
  updateDisplay();
}

startBtn.addEventListener('click', () => {
  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});

resetBtn.addEventListener('click', resetTimer);

modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    modeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const minutes = parseInt(btn.getAttribute('data-time'));
    totalTime = minutes * 60;
    timeLeft = totalTime;
    
    pauseTimer();
    updateDisplay();
  });
});

// Initialize
circle.style.strokeDashoffset = 0; // Start full
updateDisplay();
