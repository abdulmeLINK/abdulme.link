/**
 * 2048 Game - Number puzzle game for the terminal
 * WASD or Arrow Keys to move tiles, Q to quit
 * Combine tiles with the same number to reach 2048!
 * @class
 */
class Game2048 {
    /**
     * Initialize 2048 Game
     * @constructor
     */
    constructor() {
        this.gameState = {
            board: [],
            score: 0,
            gameRunning: false,
            paused: false,
            size: 4
        };
        this.terminal = null;
        this.colors = {
            2: '\x1b[47m\x1b[30m',     // White bg, black text
            4: '\x1b[46m\x1b[30m',     // Cyan bg, black text  
            8: '\x1b[43m\x1b[30m',     // Yellow bg, black text
            16: '\x1b[42m\x1b[30m',    // Green bg, black text
            32: '\x1b[45m\x1b[30m',    // Magenta bg, black text
            64: '\x1b[41m\x1b[37m',    // Red bg, white text
            128: '\x1b[44m\x1b[37m',   // Blue bg, white text
            256: '\x1b[40m\x1b[33m',   // Black bg, yellow text
            512: '\x1b[40m\x1b[32m',   // Black bg, green text
            1024: '\x1b[40m\x1b[36m',  // Black bg, cyan text
            2048: '\x1b[40m\x1b[31m'   // Black bg, red text
        };
    }

    /**
     * Execute game from terminal command
     * @param {Array} args - Command arguments
     * @param {Terminal} terminal - Terminal instance
     * @returns {Promise<void>}
     */
    async execute(args, terminal) {
        try {
            this.terminal = terminal;
            this.startGame();
        } catch (error) {
            console.error('Game2048: Failed to start:', error);
            terminal.writeln('\x1b[31mError: Failed to start 2048 game\x1b[0m');
        }
    }

    startGame() {
        this.terminal.clear();
        this.gameState.gameRunning = true;
        this.gameState.score = 0;
        this.initBoard();
        this.addRandomTile();
        this.addRandomTile();

        this.terminal.writeln('\x1b[36m🎯 2048 GAME\x1b[0m');
        this.terminal.writeln('\x1b[33mUse WASD or Arrow Keys to move tiles. Q to quit.\x1b[0m');
        this.terminal.writeln('\x1b[33mCombine tiles with the same number to reach 2048!\x1b[0m\n');
        
        this.setupInputHandler();
        this.renderGame();
    }

    initBoard() {
        this.gameState.board = Array(this.gameState.size).fill().map(() => 
            Array(this.gameState.size).fill(0)
        );
    }

    addRandomTile() {
        const emptyCells = [];
        for (let row = 0; row < this.gameState.size; row++) {
            for (let col = 0; col < this.gameState.size; col++) {
                if (this.gameState.board[row][col] === 0) {
                    emptyCells.push({row, col});
                }
            }
        }

        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            this.gameState.board[randomCell.row][randomCell.col] = value;
        }
    }

    setupInputHandler() {
        this.keyDisposable = this.terminal.terminal.onKey((event) => {
            if (!this.gameState.gameRunning) return;
            
            const key = event.key.toLowerCase();
            
            // Prevent the key from being echoed to terminal
            event.domEvent.preventDefault();
            event.domEvent.stopPropagation();
            
            let moved = false;
            
            switch(key) {
                case 'q':
                    this.endGame();
                    return;
                case 'w':
                case 'arrowup':
                    moved = this.move('up');
                    break;
                case 's':
                case 'arrowdown':
                    moved = this.move('down');
                    break;
                case 'a':
                case 'arrowleft':
                    moved = this.move('left');
                    break;
                case 'd':
                case 'arrowright':
                    moved = this.move('right');
                    break;
            }
            
            if (moved) {
                this.addRandomTile();
                this.renderGame();
                
                if (this.checkWin()) {
                    this.winGame();
                } else if (this.checkGameOver()) {
                    this.endGame();
                }
            }
        });
    }

    move(direction) {
        const newBoard = this.gameState.board.map(row => [...row]);
        let moved = false;
        let scoreIncrease = 0;

        if (direction === 'left' || direction === 'right') {
            for (let row = 0; row < this.gameState.size; row++) {
                const line = direction === 'left' ? 
                    newBoard[row] : 
                    newBoard[row].slice().reverse();
                
                const {newLine, score} = this.mergeLine(line);
                scoreIncrease += score;
                
                const finalLine = direction === 'left' ? newLine : newLine.reverse();
                
                if (!this.arraysEqual(newBoard[row], finalLine)) {
                    moved = true;
                    newBoard[row] = finalLine;
                }
            }
        } else {
            for (let col = 0; col < this.gameState.size; col++) {
                const line = [];
                for (let row = 0; row < this.gameState.size; row++) {
                    line.push(newBoard[direction === 'up' ? row : this.gameState.size - 1 - row][col]);
                }
                
                const {newLine, score} = this.mergeLine(line);
                scoreIncrease += score;
                
                for (let row = 0; row < this.gameState.size; row++) {
                    const newValue = newLine[row];
                    const boardRow = direction === 'up' ? row : this.gameState.size - 1 - row;
                    
                    if (newBoard[boardRow][col] !== newValue) {
                        moved = true;
                        newBoard[boardRow][col] = newValue;
                    }
                }
            }
        }

        if (moved) {
            this.gameState.board = newBoard;
            this.gameState.score += scoreIncrease;
        }

        return moved;
    }

    mergeLine(line) {
        // Remove zeros
        const filtered = line.filter(val => val !== 0);
        let score = 0;
        
        // Merge adjacent equal values
        for (let i = 0; i < filtered.length - 1; i++) {
            if (filtered[i] === filtered[i + 1]) {
                filtered[i] *= 2;
                score += filtered[i];
                filtered.splice(i + 1, 1);
            }
        }
        
        // Add zeros to fill the line
        while (filtered.length < this.gameState.size) {
            filtered.push(0);
        }
        
        return {newLine: filtered, score};
    }

    arraysEqual(a, b) {
        return a.length === b.length && a.every((val, i) => val === b[i]);
    }

    checkWin() {
        for (let row = 0; row < this.gameState.size; row++) {
            for (let col = 0; col < this.gameState.size; col++) {
                if (this.gameState.board[row][col] === 2048) {
                    return true;
                }
            }
        }
        return false;
    }

    checkGameOver() {
        // Check for empty cells
        for (let row = 0; row < this.gameState.size; row++) {
            for (let col = 0; col < this.gameState.size; col++) {
                if (this.gameState.board[row][col] === 0) {
                    return false;
                }
            }
        }

        // Check for possible merges
        for (let row = 0; row < this.gameState.size; row++) {
            for (let col = 0; col < this.gameState.size; col++) {
                const current = this.gameState.board[row][col];
                
                // Check right neighbor
                if (col < this.gameState.size - 1 && this.gameState.board[row][col + 1] === current) {
                    return false;
                }
                
                // Check bottom neighbor
                if (row < this.gameState.size - 1 && this.gameState.board[row + 1][col] === current) {
                    return false;
                }
            }
        }

        return true;
    }

    renderGame() {
        // Clear screen and move cursor to home
        this.terminal.terminal.write('\x1b[2J\x1b[H');
        
        this.terminal.writeln('\x1b[36m🎯 2048 GAME\x1b[0m');
        this.terminal.writeln('\x1b[90mWASD/Arrow Keys: Move tiles | SPACE: Pause | Q/ESC: Quit\x1b[0m');
        this.terminal.writeln('\x1b[90mCombine tiles with the same number to reach 2048!\x1b[0m');
        this.terminal.writeln('');
        
        if (this.gameState.paused) {
            this.terminal.writeln('\x1b[43m\x1b[30m ⏸️  PAUSED - Press SPACE to continue \x1b[0m');
            this.terminal.writeln('');
        }
        
        this.terminal.writeln(`Score: \x1b[36m${this.gameState.score}\x1b[0m`);
        this.terminal.writeln('');

        // Draw board with more compact layout
        this.terminal.writeln('┌' + '────┬'.repeat(this.gameState.size - 1) + '────┐');
        
        for (let row = 0; row < this.gameState.size; row++) {
            let line = '│';
            for (let col = 0; col < this.gameState.size; col++) {
                const value = this.gameState.board[row][col];
                let cellContent;
                
                if (value === 0) {
                    cellContent = '    ';
                } else {
                    const color = this.colors[value] || '\x1b[37m';
                    const text = value.toString().padStart(4);
                    cellContent = `${color}${text}\x1b[0m`;
                }
                
                line += cellContent;
                if (col < this.gameState.size - 1) line += '│';
            }
            line += '│';
            this.terminal.writeln(line);
            
            if (row < this.gameState.size - 1) {
                this.terminal.writeln('├' + '────┼'.repeat(this.gameState.size - 1) + '────┤');
            }
        }
        
        this.terminal.writeln('└' + '────┴'.repeat(this.gameState.size - 1) + '────┘');
    }

    winGame() {
        this.gameState.gameRunning = false;
        
        // Dispose of the key handler
        if (this.keyDisposable) {
            this.keyDisposable.dispose();
        }
        
        this.saveHighScore();
        
        this.terminal.writeln('\n\x1b[32m🎉 CONGRATULATIONS! YOU REACHED 2048! 🎉\x1b[0m');
        this.terminal.writeln(`Final Score: \x1b[36m${this.gameState.score}\x1b[0m`);
        this.terminal.writePrompt();
    }

    endGame() {
        this.gameState.gameRunning = false;
        
        // Dispose of the key handler
        if (this.keyDisposable) {
            this.keyDisposable.dispose();
        }
        
        const highScore = this.saveHighScore();
        
        this.terminal.writeln('\n\x1b[31mGame Over!\x1b[0m');
        this.terminal.writeln(`Final Score: \x1b[36m${this.gameState.score}\x1b[0m`);
        this.terminal.writeln(`High Score: \x1b[33m${highScore}\x1b[0m`);
        this.terminal.writePrompt();
    }

    saveHighScore() {
        try {
            const stored = localStorage.getItem('2048_high_score');
            const currentHigh = stored ? parseInt(stored) : 0;
            const newHigh = Math.max(currentHigh, this.gameState.score);
            localStorage.setItem('2048_high_score', newHigh.toString());
            return newHigh;
        } catch (e) {
            return this.gameState.score;
        }
    }
}

export default Game2048;