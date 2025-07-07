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

// Анализ позиции (исправленная версия)
document.getElementById('analyze-btn').addEventListener('click', () => {
    if (game.game_over()) {
        alert('Игра окончена! Начните новую.');
        return;
    }
    
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<p>Анализ... (это займёт 10-20 секунд)</p>';
    
    // Исправленный URL для Stockfish
    const stockfish = new Worker('https://unpkg.com/stockfish.js@10/stockfish.js');
    let evaluation = "N/A";
    let bestMove = null;
    
    stockfish.onmessage = function(event) {
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
            bestMove = data.split(' ')[1];
            
            if (bestMove && bestMove !== '(none)') {
                resultDiv.innerHTML = `
                    <p>Лучший ход: <strong>${bestMove}</strong></p>
                    <p>Оценка позиции: ${evaluation}</p>
                    <button id="apply-move-btn">Сделать этот ход</button>
                `;
                
                // Добавляем обработчик для применения хода
                document.getElementById('apply-move-btn').addEventListener('click', () => {
                    game.move(bestMove);
                    board.position(game.fen());
                    updateStatus();
                });
            } else {
                resultDiv.innerHTML = '<p>Лучший ход не найден</p>';
            }
            stockfish.terminate();
        }
    };
    
    // Последовательность команд для Stockfish
    stockfish.postMessage('uci');
    stockfish.postMessage('isready');
    stockfish.postMessage(`position fen ${game.fen()}`);
    stockfish.postMessage('go depth 14');
});

// Сброс доски (исправленная версия)
document.getElementById('reset-btn').addEventListener('click', () => {
    game.reset();
    board.position(game.fen()); // Используем FEN вместо board.start()
    document.getElementById('result').innerHTML = '';
});

// Переключение темы (исправленная версия)
document.getElementById('theme-btn').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const themeBtn = document.getElementById('theme-btn');
    themeBtn.textContent = document.body.classList.contains('dark') 
        ? '☀️ Включить светлую тему' 
        : '🌙 Включить тёмную тему';
    
    // Принудительно обновляем доску
    board.position(game.fen());
});

// Обновление статуса игры
function updateStatus() {
    const resultDiv = document.getElementById('result');
    
    if (game.in_checkmate()) {
        resultDiv.innerHTML = '<p class="checkmate">Шах и мат!</p>';
    } else if (game.in_draw()) {
        resultDiv.innerHTML = '<p class="draw">Ничья!</p>';
    } else if (game.in_check()) {
        resultDiv.innerHTML = '<p class="check">Шах!</p>';
    }
}

// Инициализация темы при загрузке
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark');
    document.getElementById('theme-btn').textContent = '☀️ Включить светлую тему';
}
