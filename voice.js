// Менеджер голосов для Анны (человеческий голос)
class VoiceManager {
    constructor() {
        this.basePath = 'voice/anna/';
        this.audioCache = {};
        this.currentAudio = null;
    }

    // Предзагрузка аудио (опционально)
    preloadNumbers() {
        for (let i = 1; i <= 90; i++) {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.src = `${this.basePath}${i}.mp3`;
            this.audioCache[i] = audio;
        }
        
        const gameEndAudio = new Audio();
        gameEndAudio.preload = 'auto';
        gameEndAudio.src = `${this.basePath}gameend.mp3`;
        this.audioCache['gameend'] = gameEndAudio;
    }

    // Воспроизведение числа
    async playNumber(number) {
        return new Promise((resolve) => {
            // Останавливаем текущее воспроизведение
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
            }
            
            let audio;
            if (this.audioCache[number]) {
                audio = this.audioCache[number];
                audio.currentTime = 0;
            } else {
                audio = new Audio(`${this.basePath}${number}.mp3`);
                this.audioCache[number] = audio;
            }
            
            this.currentAudio = audio;
            
            audio.onended = () => {
                this.currentAudio = null;
                resolve();
            };
            
            audio.onerror = () => {
                console.warn(`Не удалось загрузить ${this.basePath}${number}.mp3`);
                this.currentAudio = null;
                resolve();
            };
            
            audio.play().catch(e => {
                console.warn('Ошибка воспроизведения:', e);
                resolve();
            });
        });
    }

    // Воспроизведение окончания игры
    playGameEnd() {
        return new Promise((resolve) => {
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
            }
            
            let audio;
            if (this.audioCache['gameend']) {
                audio = this.audioCache['gameend'];
                audio.currentTime = 0;
            } else {
                audio = new Audio(`${this.basePath}gameend.mp3`);
                this.audioCache['gameend'] = audio;
            }
            
            this.currentAudio = audio;
            
            audio.onended = () => {
                this.currentAudio = null;
                resolve();
            };
            
            audio.onerror = () => {
                console.warn(`Не удалось загрузить gameend.mp3`);
                this.currentAudio = null;
                resolve();
            };
            
            audio.play().catch(e => console.warn('Ошибка:', e));
        });
    }

    // Воспроизведение обратного отсчета (цифры)
    playCountdown(number) {
        return this.playNumber(number);
    }
}

// Создаем экземпляр менеджера
const voiceManager = new VoiceManager();

// Экспортируем функции для использования в script.js
window.playHumanVoice = (number) => voiceManager.playNumber(number);
window.playGameEnd = () => voiceManager.playGameEnd();
window.playCountdown = (number) => voiceManager.playCountdown(number);

// Опционально: предзагружаем первые 10 чисел для плавности
setTimeout(() => {
    for (let i = 1; i <= 10; i++) {
        voiceManager.playNumber(i).catch(() => {});
    }
}, 1000);
