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

// Анализ позиции с Stockfish 17.1
document.getElementById('analyze-btn').addEventListener('click', async () => {
    if (game.game_over()) {
        alert('Игра окончена! Начните новую.');
        return;
    }
    
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<p>Анализ Stockfish 17.1... (это займёт 10-20 секунд)</p>';
    
    try {
        const stockfish = await loadStockfish();
        let evaluation = "N/A";
        let bestMove = null;
        
        // Обработчик сообщений от Stockfish
        stockfish.onData = (event) => {
            const data = event.data;
            
            if (data.includes('score cp')) {
                const match = data.match(/score cp (-?\d+)/);
                if (match) {
                    const score = parseInt(match[1]) / 100;
                    evaluation = score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1);
                }
            }
            else if (data.includes('score mate')) {
                const match = data.match(/score mate (-?\d+)/);
                if (match) {
                    const moves = Math.abs(parseInt(match[1]));
                    evaluation = match[1] > 0 
                        ? `Мат белым в ${moves} ходов` 
                        : `Мат чёрным в ${moves} ходов`;
                }
            }
            else if (data.startsWith('bestmove')) {
                bestMove = data.split(' ')[1];
                
                if (bestMove && bestMove !== '(none)') {
                    resultDiv.innerHTML = `
                        <p>Лучший ход: <strong>${bestMove}</strong></p>
                        <p>Оценка позиции: ${evaluation}</p>
                        <button id="apply-move-btn">Сделать этот ход</button>
                    `;
                    
                    document.getElementById('apply-move-btn').addEventListener('click', () => {
                        game.move(bestMove);
                        board.position(game.fen());
                        updateStatus();
                    });
                } else {
                    resultDiv.innerHTML = '<p>Лучший ход не найден</p>';
                }
            }
        };
        
        // Последовательность команд для Stockfish
        stockfish.postMessage('uci');
        stockfish.postMessage('setoption name Skill Level value 20');
        stockfish.postMessage('isready');
        stockfish.postMessage(`position fen ${game.fen()}`);
        stockfish.postMessage('go depth 16');
        
    } catch (error) {
        resultDiv.innerHTML = '<p>Ошибка: ' + error.message + '</p>';
        console.error('Stockfish error:', error);
    }
});

// Сброс доски
document.getElementById('reset-btn').addEventListener('click', () => {
    game.reset();
    board.position(game.fen());
    document.getElementById('result').innerHTML = '';
});

// Переключение темы (исправленная версия)
document.getElementById('theme-btn').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const themeBtn = document.getElementById('theme-btn');
    themeBtn.textContent = document.body.classList.contains('dark') 
        ? '☀️ Включить светлую тему' 
        : '🌙 Включить тёмную тему';
});

// Обновление статуса игры
function updateStatus() {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '';
    
    if (game.in_checkmate()) {
        resultDiv.innerHTML = '<p class="checkmate">Шах и мат!</p>';
    } else if (game.in_draw()) {
        resultDiv.innerHTML = '<p class="draw">Ничья!</p>';
    } else if (game.in_check()) {
        resultDiv.innerHTML = '<p class="check">Шах!</p>';
    }
}

// Инициализация темы при загрузке
window.addEventListener('DOMContentLoaded', () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark');
        document.getElementById('theme-btn').textContent = '☀️ Включить светлую тему';
    }
    
    // Принудительно обновляем доску после загрузки
    setTimeout(() => board.position(game.fen()), 100);
});
