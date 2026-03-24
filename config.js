// ============================================
// КОНФИГУРАЦИЯ ГОЛОСОВ
// ============================================

const VOICE_CONFIG = {
    // Настройки голосов
    voices: {
        robot: {
            name: 'Робот',
            type: 'speechSynthesis',
            lang: 'ru-RU',
            rate: 0.85,      // Скорость речи (медленнее для четкости)
            pitch: 1.0
        },
        anna: {
            name: 'Анна',
            type: 'mp3',
            basePath: 'voice/anna/',
            files: {
                // Числа от 1 до 90
                numbers: {
                    path: 'voice/anna/',  // voice/anna/1.mp3, voice/anna/2.mp3 и т.д.
                    pattern: '{number}.mp3'
                },
                // Окончание игры
                gameEnd: 'voice/anna/gameend.mp3'
            }
        }
    },
    
    // Настройки по умолчанию
    defaults: {
        speed: 2.5,          // секунд между числами
        voice: 'anna'        // 'robot' или 'anna'
    }
};

// Экспортируем для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VOICE_CONFIG;
}
