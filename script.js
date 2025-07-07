// Ждем полной загрузки страницы
window.addEventListener('load', function() {
    // Инициализация игры
    const game = new Chess();
    
    // Инициализация доски
    const board = Chessboard('board', {
        position: 'start',
        draggable: true,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
        onDrop: function(source, target) {
            const move = game.move({
                from: source,
                to: target,
                promotion: 'q'
            });
            
            if (move === null) return 'snapback';
            updateStatus();
        }
    });

    // Функция обновления статуса
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

    // Переключение темы
    document.getElementById('theme-btn').addEventListener('click', function() {
        document.body.classList.toggle('dark');
        this.textContent = document.body.classList.contains('dark') 
            ? '☀️ Включить светлую тему' 
            : '🌙 Включить тёмную тему';
    });

    // Анализ позиции
    document.getElementById('analyze-btn').addEventListener('click', function() {
        if (game.game_over()) {
            showResult('Игра окончена! Начните новую.', 'error');
            return;
        }
        
        showResult('Анализ Stockfish...', 'info');
        
        const stockfish = new Worker('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');
        
        stockfish.onmessage = function(event) {
            const data = event.data;
            console.log("Stockfish:", data); // Для отладки
            
            if (data.includes('bestmove')) {
                const bestMove = data.split(' ')[1];
                if (bestMove && bestMove !== '(none)') {
                    showResult(`Лучший ход: ${bestMove}`);
                    stockfish.terminate();
                }
            }
        };
        
        stockfish.postMessage('uci');
        stockfish.postMessage('isready');
        stockfish.postMessage(`position fen ${game.fen()}`);
        stockfish.postMessage('go depth 12');
    });

    // Сброс доски
    document.getElementById('reset-btn').addEventListener('click', function() {
        game.reset();
        board.position('start');
        document.getElementById('result').innerHTML = '';
    });

    // Проверка системной темы
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark');
        document.getElementById('theme-btn').textContent = '☀️ Включить светлую тему';
    }
});

function showResult(message, type) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<p class="${type || 'info'}">${message}</p>`;
}
