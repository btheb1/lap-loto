// Состояние игры
let isGameActive = false;
let gameInterval = null;
let calledNumbers = [];
let availableNumbers = [];
let currentSpeed = 2;
let currentVoiceType = 'robot'; // 'robot' или 'human'
let countdownActive = false;

// DOM элементы
const currentNumberEl = document.getElementById('currentNumber');
const historyEl = document.getElementById('history');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const speedSlider = document.getElementById('speed');
const speedValue = document.getElementById('speedValue');
const resumeModal = document.getElementById('resumeModal');
const resumeYes = document.getElementById('resumeYes');
const resumeNo = document.getElementById('resumeNo');
const settingsPanel = document.getElementById('settingsPanel');
const settingsBtn = document.getElementById('settingsBtn');
const voiceBtns = document.querySelectorAll('.voice-btn');

// Загрузка настроек из cookies
function loadSettings() {
    const savedSpeed = getCookie('loto_speed');
    const savedVoice = getCookie('loto_voice');
    
    if (savedSpeed) {
        currentSpeed = parseFloat(savedSpeed);
        speedSlider.value = currentSpeed;
        speedValue.textContent = currentSpeed.toFixed(1) + ' сек';
    }
    
    if (savedVoice) {
        currentVoiceType = savedVoice;
        updateVoiceButtons();
    }
}

// Сохранение настроек в cookies
function saveSettings() {
    setCookie('loto_speed', currentSpeed, 365);
    setCookie('loto_voice', currentVoiceType, 365);
}

// Cookie функции
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Сохранение состояния игры
function saveGameState() {
    if (isGameActive) {
        const gameState = {
            calledNumbers: calledNumbers,
            availableNumbers: availableNumbers,
            timestamp: Date.now()
        };
        localStorage.setItem('loto_game_state', JSON.stringify(gameState));
        setCookie('loto_game_active', 'true', 1);
    } else {
        localStorage.removeItem('loto_game_state');
        setCookie('loto_game_active', 'false', 1);
    }
}

// Загрузка состояния игры
function loadGameState() {
    const isActive = getCookie('loto_game_active');
    if (isActive === 'true') {
        const savedState = localStorage.getItem('loto_game_state');
        if (savedState) {
            const state = JSON.parse(savedState);
            // Проверяем, не прошло ли слишком много времени (например, 24 часа)
            if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
                return state;
            }
        }
    }
    return null;
}

// Озвучивание числа
async function speakNumber(number) {
    if (currentVoiceType === 'robot') {
        // Роботизированный голос через Web Speech API
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(number.toString());
            utterance.lang = 'ru-RU';
            utterance.rate = 0.9;
            utterance.pitch = 1;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        } else {
            console.log('Web Speech API не поддерживается');
        }
    } else {
        // Человеческий голос - mp3 файлы
        if (window.playHumanVoice) {
            await window.playHumanVoice(number);
        } else {
            console.log('Файл voice.js не загружен');
        }
    }
}

// Озвучивание окончания игры
function speakGameEnd() {
    if (currentVoiceType === 'robot') {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtteration('Игра закончена');
            utterance.lang = 'ru-RU';
            window.speechSynthesis.speak(utterance);
        }
    } else {
        if (window.playGameEnd) {
            window.playGameEnd();
        }
    }
}

// Озвучивание обратного отсчета
function speakCountdown(seconds) {
    if (currentVoiceType === 'robot') {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(seconds.toString());
            utterance.lang = 'ru-RU';
            window.speechSynthesis.speak(utterance);
        }
    } else {
        if (window.playCountdown) {
            window.playCountdown(seconds);
        }
    }
}

// Обновление истории
function updateHistory() {
    historyEl.innerHTML = calledNumbers.slice(-12).reverse().map(num => 
        `<span>${num}</span>`
    ).join('');
}

// Отображение числа с анимацией
function showNumber(number) {
    currentNumberEl.textContent = number;
    currentNumberEl.classList.add('animate');
    setTimeout(() => {
        currentNumberEl.classList.remove('animate');
    }, 200);
}

// Основная функция вызова числа
async function callNextNumber() {
    if (!isGameActive) return;
    
    if (availableNumbers.length === 0) {
        endGame();
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const number = availableNumbers[randomIndex];
    availableNumbers.splice(randomIndex, 1);
    calledNumbers.push(number);
    
    showNumber(number);
    updateHistory();
    await speakNumber(number);
    saveGameState();
}

// Начать игру с обратным отсчетом
async function startGame(resume = false) {
    if (isGameActive) return;
    
    if (!resume) {
        calledNumbers = [];
        availableNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
    }
    
    isGameActive = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    
    // Обратный отсчет
    countdownActive = true;
    for (let i = 3; i >= 1; i--) {
        if (!isGameActive) {
            countdownActive = false;
            return;
        }
        showNumber(i);
        await speakCountdown(i);
        await new Promise(resolve => setTimeout(resolve, 800));
    }
    countdownActive = false;
    
    if (!isGameActive) return;
    
    showNumber('GO!');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Запуск игры
    gameInterval = setInterval(async () => {
        if (isGameActive) {
            await callNextNumber();
        }
    }, currentSpeed * 1000);
    
    saveGameState();
}

// Завершение игры
function endGame() {
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    isGameActive = false;
    countdownActive = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    
    speakGameEnd();
    showNumber('🎲');
    
    // Очищаем сохраненное состояние
    localStorage.removeItem('loto_game_state');
    setCookie('loto_game_active', 'false', 1);
}

// Проверка на наличие сохраненной игры
function checkForSavedGame() {
    const savedState = loadGameState();
    if (savedState && savedState.calledNumbers && savedState.calledNumbers.length > 0) {
        calledNumbers = savedState.calledNumbers;
        availableNumbers = savedState.availableNumbers;
        updateHistory();
        showNumber(calledNumbers[calledNumbers.length - 1] || '—');
        resumeModal.classList.add('show');
    }
}

// Обновление UI кнопок голоса
function updateVoiceButtons() {
    voiceBtns.forEach(btn => {
        if (btn.dataset.voice === currentVoiceType) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Инициализация
function init() {
    loadSettings();
    checkForSavedGame();
    
    // Слушатели событий
    speedSlider.addEventListener('input', (e) => {
        currentSpeed = parseFloat(e.target.value);
        speedValue.textContent = currentSpeed.toFixed(1) + ' сек';
        saveSettings();
        
        // Обновляем интервал если игра активна
        if (isGameActive && gameInterval) {
            clearInterval(gameInterval);
            gameInterval = setInterval(async () => {
                if (isGameActive) {
                    await callNextNumber();
                }
            }, currentSpeed * 1000);
        }
    });
    
    voiceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentVoiceType = btn.dataset.voice;
            updateVoiceButtons();
            saveSettings();
        });
    });
    
    startBtn.addEventListener('click', () => startGame(false));
    stopBtn.addEventListener('click', endGame);
    settingsBtn.addEventListener('click', () => {
        settingsPanel.classList.toggle('hidden');
    });
    
    resumeYes.addEventListener('click', () => {
        resumeModal.classList.remove('show');
        startGame(true);
    });
    
    resumeNo.addEventListener('click', () => {
        resumeModal.classList.remove('show');
        localStorage.removeItem('loto_game_state');
        setCookie('loto_game_active', 'false', 1);
        calledNumbers = [];
        availableNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
        updateHistory();
        showNumber('—');
    });
}

// Запуск после загрузки страницы
document.addEventListener('DOMContentLoaded', init);
