// ============================================
// ГОЛОСОВОЙ МОДУЛЬ
// Поддерживает: робот (Web Speech API) и Анна (MP3)
// ============================================

class VoiceModule {
    constructor() {
        this.currentVoice = 'anna';  // 'robot' или 'anna'
        this.currentAudio = null;
        this.audioCache = {};
        this.speechQueue = [];
        this.isSpeaking = false;
        
        // Загружаем конфиг, если он есть
        if (typeof VOICE_CONFIG !== 'undefined') {
            this.config = VOICE_CONFIG;
        } else {
            // Фallback конфиг
            this.config = {
                voices: {
                    robot: { lang: 'ru-RU', rate: 0.85, pitch: 1.0 },
                    anna: { basePath: 'voice/anna/' }
                }
            };
        }
    }
    
    // Установить голос
    setVoice(voiceType) {
        if (voiceType === 'robot' || voiceType === 'anna') {
            this.currentVoice = voiceType;
            // Останавливаем текущее воспроизведение
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio = null;
            }
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
            return true;
        }
        return false;
    }
    
    // Говорить число
    async speakNumber(number) {
        if (this.currentVoice === 'robot') {
            return this.speakRobot(number.toString());
        } else {
            return this.speakAnna(number);
        }
    }
    
    // Робот-голос (Web Speech API) - ТЕПЕРЬ ПО-РУССКИ!
    speakRobot(text) {
        return new Promise((resolve) => {
            if (!window.speechSynthesis) {
                console.warn('Web Speech API не поддерживается');
                resolve();
                return;
            }
            
            // Останавливаем предыдущую речь
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ru-RU';           // РУССКИЙ ЯЗЫК!
            utterance.rate = 0.85;               // Медленнее, чтобы было понятно
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            // Ждем загрузки голоса
            const trySpeak = () => {
                const voices = window.speechSynthesis.getVoices();
                const russianVoice = voices.find(v => v.lang === 'ru-RU' || v.lang.startsWith('ru'));
                if (russianVoice) {
                    utterance.voice = russianVoice;
                }
                utterance.onend = () => resolve();
                utterance.onerror = () => resolve();
                window.speechSynthesis.speak(utterance);
            };
            
            if (window.speechSynthesis.getVoices().length > 0) {
                trySpeak();
            } else {
                window.speechSynthesis.onvoiceschanged = trySpeak;
            }
        });
    }
    
    // Голос Анны (MP3 файлы)
    async speakAnna(number) {
        return new Promise((resolve) => {
            // Останавливаем текущее воспроизведение
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
            }
            
            const audioPath = `voice/anna/${number}.mp3`;
            const audio = new Audio(audioPath);
            this.currentAudio = audio;
            
            audio.onended = () => {
                this.currentAudio = null;
                resolve();
            };
            
            audio.onerror = () => {
                console.warn(`❌ Не найден файл: ${audioPath}`);
                this.currentAudio = null;
                resolve();
            };
            
            audio.play().catch(e => {
                console.warn('Ошибка воспроизведения:', e);
                resolve();
            });
        });
    }
    
    // Окончание игры
    async speakGameEnd() {
        if (this.currentVoice === 'robot') {
            return this.speakRobot('Игра закончена');
        } else {
            return new Promise((resolve) => {
                if (this.currentAudio) {
                    this.currentAudio.pause();
                    this.currentAudio.currentTime = 0;
                }
                
                const audio = new Audio('voice/anna/gameend.mp3');
                this.currentAudio = audio;
                
                audio.onended = () => {
                    this.currentAudio = null;
                    resolve();
                };
                audio.onerror = () => {
                    console.warn('❌ Не найден файл: voice/anna/gameend.mp3');
                    this.currentAudio = null;
                    resolve();
                };
                audio.play().catch(e => resolve());
            });
        }
    }
    
    // Обратный отсчет
    async speakCountdown(number) {
        if (this.currentVoice === 'robot') {
            return this.speakRobot(number.toString());
        } else {
            return this.speakAnna(number);
        }
    }
}

// Создаем экземпляр
const voiceModule = new VoiceModule();

// Глобальные функции для использования в script.js
window.speakNumber = (num) => voiceModule.speakNumber(num);
window.speakGameEnd = () => voiceModule.speakGameEnd();
window.speakCountdown = (num) => voiceModule.speakCountdown(num);
window.setVoiceType = (type) => voiceModule.setVoice(type);
