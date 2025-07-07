// Инициализация
const game = new Chess();
const board = Chessboard('board', {
    position: 'start',
    draggable: true,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
});

// Анализ позиции
document.getElementById('analyze-btn').addEventListener('click', async () => {
    if (game.game_over()) {
        alert("Игра окончена! Начните новую.");
        return;
    }

    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = "<p>Анализ... (ждём 5-10 секунд)</p>";

    // Используем Stockfish через CDN
    const stockfish = new Worker('https://cdn.jsdelivr.net/npm/stockfish.js@10/stockfish.js');

    stockfish.onmessage = (e) => {
        if (e.data.startsWith('bestmove')) {
            const bestMove = e.data.split(' ')[1];
            if (bestMove && bestMove !== '(none)') {
                game.move(bestMove);
                board.position(game.fen());
                resultDiv.innerHTML = `
                    <p>Лучший ход: <strong>${bestMove}</strong></p>
                    <p>Оценка: ${getEvaluation(e.data)}</p>
                `;
            } else {
                resultDiv.innerHTML = "<p>AI не нашёл ходов (возможно, мат или пат).</p>";
            }
            stockfish.terminate();
        }
    };

    stockfish.postMessage(`position fen ${game.fen()}`);
    stockfish.postMessage('go depth 18'); // Глубина анализа (больше = точнее, но медленнее)
});

// Функция для извлечения оценки из вывода Stockfish
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
