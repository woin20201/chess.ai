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
    
    // Создаем Web Worker для Stockfish
    const stockfish = new Worker('https://cdn.jsdelivr.net/npm/stockfish.js@10/stockfish.js');
    let evaluation = "N/A";
    
    stockfish.onmessage = function(event) {
        const data = event.data;
        
        // Ловим сообщения с оценкой позиции
        if (data.includes('score cp')) {
            const match = data.match(/score cp (-?\d+)/);
            if (match) {
                const score = parseInt(match[1]) / 100;
                evaluation = score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1);
            }
        }
        
        // Ловим сообщения о мате
        else if (data.includes('score mate')) {
            const match = data.match(/score mate (-?\d+)/);
            if (match) {
                const moves = Math.abs(parseInt(match[1]));
                evaluation = match[1] > 0 ? `Мат в ${moves} ходов` : `Мат через ${moves} ходов (для чёрных)`;
            }
        }
        
        // Обрабатываем лучший ход
        else if (data.startsWith('bestmove')) {
            const bestMove = data.split(' ')[1];
            
            if (bestMove && bestMove !== '(none)') {
                // Показываем результат без автоматического хода
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
    
    // Отправляем команды Stockfish
    stockfish.postMessage('uci');
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
    
    // Обновляем текст кнопки
    themeBtn.textContent = document.body.classList.contains('dark') 
        ? '☀️ Включить светлую тему' 
        : '🌙 Включить тёмную тему';
    
    // Принудительно обновляем отображение доски
    board.position(game.fen());
});

// Обновление статуса игры
function updateStatus() {
    if (game.in_checkmate()) {
        document.getElementById('result').innerHTML = '<p class="checkmate">Шах и мат!</p>';
    }
    if (game.in_draw()) {
        document.getElementById('result').innerHTML = '<p class="draw">Ничья!</p>';
    }
}
