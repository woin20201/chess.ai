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

// Анализ позиции
document.getElementById('analyze-btn').addEventListener('click', () => {
    if (game.game_over()) {
        alert('Игра окончена! Начните новую.');
        return;
    }
    
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<p>Анализ... (это займёт 10-20 секунд)</p>';
    
    try {
        const stockfish = new Worker('https://unpkg.com/stockfish.js@10.0.2/src/stockfish.js');
        
        stockfish.onmessage = function(e) {
            if (e.data.startsWith('bestmove')) {
                const bestMove = e.data.split(' ')[1];
                if (bestMove && bestMove !== '(none)') {
                    game.move(bestMove);
                    board.position(game.fen());
                    resultDiv.innerHTML = `
                        <p>Лучший ход: <strong>${bestMove}</strong></p>
                        <p>Оценка позиции: ${getEvaluation(e.data)}</p>
                    `;
                }
                stockfish.terminate();
            }
        };
        
        stockfish.postMessage(`position fen ${game.fen()}`);
        stockfish.postMessage('go depth 16');
    } catch (error) {
        document.getElementById('result').innerHTML = '<p>Ошибка загрузки движка. Попробуйте позже.</p>';
        console.error('Stockfish error:', error);
    }
});

// Функция для получения оценки
function getEvaluation(output) {
    const score = output.match(/score cp (-?\d+)/);
    if (score) {
        const value = parseInt(score[1]) / 100;
        return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
    }
    return "N/A";
}

// Сброс доски
document.getElementById('reset-btn').addEventListener('click', () => {
    game.reset();
    board.start();
    document.getElementById('result').innerHTML = '';
});

// Переключение темы
document.getElementById('theme-btn').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const themeBtn = document.getElementById('theme-btn');
    themeBtn.textContent = document.body.classList.contains('dark') 
        ? '☀️ Включить светлую тему' 
        : '🌙 Включить тёмную тему';
    
    // Обновляем доску для применения фильтров
    board.position(game.fen());
});

// Обновление статуса игры
function updateStatus() {
    if (game.in_checkmate()) alert('Шах и мат!');
    if (game.in_draw()) alert('Ничья!');
}
