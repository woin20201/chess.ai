// Этот файл заменит CDN версию
class Stockfish {
    constructor() {
        this.worker = new Worker(window.URL.createObjectURL(new Blob([`
            const stockfish = new Worker('stockfish.wasm.js');
            onmessage = function(e) {
                stockfish.postMessage(e.data);
            };
            stockfish.onmessage = function(e) {
                postMessage(e.data);
            };
        `], {type: 'text/javascript'})));
        
        this.onmessage = null;
        this.worker.onmessage = (e) => {
            if (this.onmessage) this.onmessage(e);
        };
    }

    postMessage(data) {
        this.worker.postMessage(data);
    }
}
