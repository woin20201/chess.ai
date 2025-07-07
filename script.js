// Инициализация доски
const board = Chessboard('board', {
    position: 'start',
    draggable: true
});

const game = new Chess();

// Анализ позиции с помощью Stockfish
document.getElementById('analyze-btn').addEventListener('click', () => {
    const stockfish = new Worker('https://cdn.jsdelivr.net/npm/stockfish.js@10/stockfish.js');
    
    stockfish.onmessage = (e) => {
        if (e.data.startsWith('bestmove')) {
            const move = e.data.split(' ')[1];
            game.move(move);
            board.position(game.fen());
            document.getElementById('result').innerHTML = `
                <p>Лучший ход: <strong>${move}</strong></p>
                <p>Нотация: ${game.history()[game.history().length-1]}</p>
            `;
            stockfish.terminate();
        }
    };
    
    stockfish.postMessage(`position fen ${game.fen()}`);
    stockfish.postMessage('go depth 18');
});

// Сброс доски
document.getElementById('reset-btn').addEventListener('click', () => {
    game.reset();
    board.start();
    document.getElementById('result').innerHTML = '';
    document.getElementById('photo-preview').innerHTML = '';
});

// Анализ фото
document.getElementById('analyze-photo-btn').addEventListener('click', () => {
    const fileInput = document.getElementById('photo-upload');
    if (fileInput.files.length === 0) return;
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
        // Показываем превью фото
        document.getElementById('photo-preview').innerHTML = `
            <img src="${e.target.result}" alt="Загруженная доска">
            <p>Идет анализ...</p>
        `;
        
        // Здесь будет подключение к API распознавания
        setTimeout(() => {
            // Временная заглушка - случайный ход
            const moves = game.moves();
            if (moves.length > 0) {
                const randomMove = moves[Math.floor(Math.random() * moves.length)];
                game.move(randomMove);
                board.position(game.fen());
                document.getElementById('photo-preview').innerHTML += `
                    <p>AI рекомендует ход: <strong>${randomMove}</strong></p>
                `;
            }
        }, 2000);
    };
    
    reader.readAsDataURL(file);
});
