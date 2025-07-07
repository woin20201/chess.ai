// Инициализация игры и доски
const game = new Chess();
const board = Chessboard('board', {
    position: 'start',
    draggable: true,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onDrop: handleMove
});

// Обработка ходов
function handleMove(source, target) {
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });
    
    if (move === null) return 'snapback';
    updateStatus();
}

// Анализ позиции с Stockfish (исправленная версия)
document.getElementById('analyze-btn').addEventListener('click', async () => {
    if (game.game_over()) {
        showResult('Игра окончена! Начните новую.', 'error');
        return;
    }
    
    showResult('Анализ Stockfish 10... (10-20 секунд)', 'info');
    
    try {
        // Проверяем доступность Stockfish
        if (typeof Stockfish === 'undefined') {
            throw new Error('Stockfish engine not loaded');
        }
        
        // Инициализация Stockfish
        const stockfish = await Stockfish();
        let evaluation = "0.0";
        let bestMove = null;
        let isAnalysisComplete = false;
        
        // Таймер для отслеживания времени выполнения
        const analysisTimer = setTimeout(() => {
            if (!isAnalysisComplete) {
                showResult('Анализ занял слишком много времени. Попробуйте ещё раз.', 'warning');
                stockfish.terminate();
            }
        }, 30000);
        
        // Обработчик сообщений от Stockfish
        stockfish.onmessage = (event) => {
            const data = event.data;
            
            // Парсим оценку позиции
            if (data.includes('score cp')) {
                const match = data.match(/score cp (-?\d+)/);
                if (match) {
                    const score = parseInt(match[1]) / 100;
                    evaluation = score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1);
                }
            }
            // Обработка мата
            else if (data.includes('score mate')) {
                const match = data.match(/score mate (-?\d+)/);
                if (match) {
                    const moves = Math.abs(parseInt(match[1]));
                    evaluation = match[1] > 0 
                        ? `Мат белым в ${moves} ходов` 
                        : `Мат чёрным в ${moves} ходов`;
                }
            }
            // Лучший ход
            else if (data.startsWith('bestmove')) {
                isAnalysisComplete = true;
                clearTimeout(analysisTimer);
                
                bestMove = data.split(' ')[1];
                
                if (bestMove && bestMove !== '(none)') {
                    showResult(`
                        <p><strong>Лучший ход:</strong> ${bestMove}</p>
                        <p><strong>Оценка позиции:</strong> ${evaluation}</p>
                        <button id="apply-move-btn" class="apply-btn">Сделать этот ход</button>
                    `);
                    
                    document.getElementById('apply-move-btn').addEventListener('click', () => {
                        game.move(bestMove);
                        board.position(game.fen());
                        updateStatus();
                    });
                } else {
                    showResult('Лучший ход не найден', 'warning');
                }
                
                stockfish.terminate();
            }
        };
        
        // Последовательность команд для Stockfish
        stockfish.postMessage('uci');
        stockfish.postMessage('isready');
        stockfish.postMessage(`position fen ${game.fen()}`);
        stockfish.postMessage('go depth 14');
        
    } catch (error) {
        showResult(`Ошибка: ${error.message}. Попробуйте обновить страницу.`, 'error');
        console.error('Stockfish error:', error);
    }
});

// Сброс доски
document.getElementById('reset-btn').addEventListener('click', () => {
    game.reset();
    board.position('start');
    document.getElementById('result').innerHTML = '';
});

// Переключение темы (меняет фон страницы и цвет доски)
document.getElementById('theme-btn').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const themeBtn = document.getElementById('theme-btn');
    themeBtn.textContent = document.body.classList.contains('dark') 
        ? '☀️ Включить светлую тему' 
        : '🌙 Включить тёмную тему';
});

// Обновление статуса игры
function updateStatus() {
    if (game.in_checkmate()) {
        showResult('Шах и мат!', 'checkmate');
    } else if (game.in_draw()) {
        showResult('Ничья!', 'draw');
    } else if (game.in_check()) {
        showResult('Шах!', 'check');
    } else {
        document.getElementById('result').innerHTML = '';
    }
}

// Показать результат анализа
function showResult(message, type = 'info') {
    const resultDiv = document.getElementById('result');
    
    switch(type) {
        case 'error':
            resultDiv.innerHTML = `<p class="error">${message}</p>`;
            break;
        case 'warning':
            resultDiv.innerHTML = `<p class="warning">${message}</p>`;
            break;
        case 'checkmate':
            resultDiv.innerHTML = `<p class="checkmate">${message}</p>`;
            break;
        case 'draw':
            resultDiv.innerHTML = `<p class="draw">${message}</p>`;
            break;
        case 'check':
            resultDiv.innerHTML = `<p class="check">${message}</p>`;
            break;
        case 'info':
            resultDiv.innerHTML = `<p>${message}</p>`;
            break;
        default:
            resultDiv.innerHTML = message;
    }
}

// Инициализация при загрузке
window.addEventListener('DOMContentLoaded', () => {
    // Определение системной темы
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark');
        document.getElementById('theme-btn').textContent = '☀️ Включить светлую тему';
    }
    
    // Проверка поддержки WebAssembly
    if (!window.WebAssembly) {
        showResult('Ваш браузер не поддерживает WebAssembly. Обновите браузер.', 'error');
        document.getElementById('analyze-btn').disabled = true;
    }
});
