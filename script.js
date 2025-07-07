// Инициализация
const game = new Chess();
const board = Chessboard('board', {
    position: 'start',
    draggable: true,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
});

// Анализ позиции
document.getElementById('analyze-btn').addEventListener('click', () => {
    const stockfish = new Worker('https://cdn.jsdelivr.net/npm/stockfish.js@10/stockfish.js');
    
    stockfish.onmessage = (e) => {
        if (e.data.startsWith('bestmove')) {
            const move = e.data.split(' ')[1];
            game.move(move);
            board.position(game.fen());
            document.getElementById('result').innerHTML = `Лучший ход: <strong>${move}</strong>`;
            stockfish.terminate();
        }
    };
    
    stockfish.postMessage(`position fen ${game.fen()}`);
    stockfish.postMessage('go depth 15');
});

// Сброс доски
document.getElementById('reset-btn').addEventListener('click', () => {
    game.reset();
    board.start();
    document.getElementById('result').innerHTML = '';
});
