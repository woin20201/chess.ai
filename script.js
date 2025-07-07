// Инициализация
const game = new Chess();
const board = Chessboard('board', {
    position: 'start',
    draggable: true,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
});

// Анализ позиции (исправленная версия)
document.getElementById('analyze-btn').addEventListener('click', async () => {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = "<p>Анализ... (это займёт 10-15 секунд)</p>";
    
    try {
        // Альтернативный CDN для Stockfish
        const stockfish = new Worker('https://unpkg.com/stockfish.js@10.0.2/src/stockfish.js');
        
        stockfish.onmessage = (e) => {
            if (e.data.startsWith('bestmove')) {
                const bestMove = e.data.split(' ')[1];
                if (bestMove && bestMove !== '(none)') {
                    game.move(bestMove);
                    board.position(game.fen());
                    const evalScore = extractEvaluation(e.data);
                    resultDiv.innerHTML = `
                        <p>Лучший ход: <strong>${bestMove}</strong></p>
                        <p>Оценка: ${evalScore}</p>
                    `;
                }
                stockfish.terminate();
            }
        };
        
        stockfish.postMessage(`position fen ${game.fen()}`);
        stockfish.postMessage('go depth 16');
    } catch (error) {
        resultDiv.innerHTML = "<p>Ошибка загрузки AI. Обновите страницу.</p>";
        console.error("Stockfish error:", error);
    }
});

// Извлечение оценки
function extractEvaluation(output) {
    const score = output.match(/score cp (-?\d+)/);
    if (score) {
        const value = parseInt(score[1]) / 100;
        return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
    }
    return "N/A";
}
