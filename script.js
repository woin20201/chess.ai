// Инициализация
const board = Chessboard('board', {
    position: 'start',
    draggable: true,
    onDrop: handleMove,
    pieceTheme: 'images/{piece}.png'
});

const game = new Chess();
let stockfish = new Worker('https://cdn.jsdelivr.net/npm/stockfish.js@10/stockfish.js');

// Обработка ходов
function handleMove(source, target) {
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Автоматическое превращение в ферзя
    });

    if (move === null) return 'snapback';
    updateStatus();
}

// Анализ позиции
document.getElementById('analyze-btn').addEventListener('click', async () => {
    if (game.game_over()) {
        alert('Игра окончена! Начните новую.');
        return;
    }

    document.getElementById('result').innerHTML = '<p>Анализ...</p>';
    
    stockfish.postMessage(`position fen ${game.fen()}`);
    stockfish.postMessage('go depth 18');
});

stockfish.onmessage = (e) => {
    if (e.data.startsWith('bestmove')) {
        const bestMove = e.data.split(' ')[1];
        game.move(bestMove);
        board.position(game.fen());
        document.getElementById('result').innerHTML = `
            <p>Лучший ход: <strong>${bestMove}</strong></p>
            <p>Оценка: ${getEvaluation(e.data)}</p>
        `;
    }
};

// Функция для извлечения оценки из вывода Stockfish
function getEvaluation(output) {
    const score = output.match(/score cp (-?\d+)/);
    if (score) {
        const value = parseInt(score[1]) / 100;
        return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
    }
    return "N/A";
}

// Анализ фото
document.getElementById('analyze-photo-btn').addEventListener('click', async () => {
    const fileInput = document.getElementById('photo-upload');
    if (!fileInput.files.length) {
        alert('Загрузите фото доски!');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        document.getElementById('loader').style.display = 'block';
        document.getElementById('photo-preview').innerHTML = `
            <img src="${e.target.result}" alt="Загруженная доска">
        `;

        // Имитация API (замените на реальный запрос к ChessVision.ai)
        setTimeout(() => {
            const mockFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            game.load(mockFEN);
            board.position(mockFEN);
            document.getElementById('loader').style.display = 'none';
            document.getElementById('result').innerHTML = `
                <p>Распознанная позиция:</p>
                <pre>${mockFEN}</pre>
            `;
        }, 2000);
    };

    reader.readAsDataURL(file);
});

// Сброс игры
document.getElementById('reset-btn').addEventListener('click', () => {
    game.reset();
    board.start();
    document.getElementById('result').innerHTML = '';
});

// Отмена хода
document.getElementById('undo-btn').addEventListener('click', () => {
    game.undo();
    board.position(game.fen());
});

// Обновление статуса
function updateStatus() {
    if (game.in_checkmate()) {
        alert('Шах и мат!');
    } else if (game.in_draw()) {
        alert('Ничья!');
    }
}
        }, 2000);
    };
    
    reader.readAsDataURL(file);
});
