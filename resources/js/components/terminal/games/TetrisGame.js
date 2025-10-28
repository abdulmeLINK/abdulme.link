/**
 * Tetris Game - Classic block puzzle game for the terminal
 * A/D to move, S for soft drop, W to rotate, Q to quit
 */
class TetrisGame {
    constructor() {
        this.gameState = {
            board: [],
            currentPiece: null,
            nextPiece: null,
            score: 0,
            level: 1,
            lines: 0,
            gameRunning: false,
            width: 10,
            height: 20,
            pieceX: 0,
            pieceY: 0
        };
        this.gameInterval = null;
        this.terminal = null;
        this.pieces = [
            // I-piece (4x4 grid for consistency)
            [
                [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // Horizontal
                [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]], // Vertical
                [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]], // Horizontal
                [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]  // Vertical
            ],
            // O-piece (2x2 - doesn't need rotation)
            [
                [[1,1],[1,1]]
            ],
            // T-piece (3x3 grid)
            [
                [[0,1,0],[1,1,1],[0,0,0]], // Up
                [[0,1,0],[0,1,1],[0,1,0]], // Right
                [[0,0,0],[1,1,1],[0,1,0]], // Down
                [[0,1,0],[1,1,0],[0,1,0]]  // Left
            ],
            // S-piece (3x3 grid)
            [
                [[0,1,1],[1,1,0],[0,0,0]], // Horizontal
                [[0,1,0],[0,1,1],[0,0,1]]  // Vertical
            ],
            // Z-piece (3x3 grid)
            [
                [[1,1,0],[0,1,1],[0,0,0]], // Horizontal
                [[0,0,1],[0,1,1],[0,1,0]]  // Vertical
            ],
            // J-piece (3x3 grid)
            [
                [[1,0,0],[1,1,1],[0,0,0]], // Up
                [[0,1,1],[0,1,0],[0,1,0]], // Right
                [[0,0,0],[1,1,1],[0,0,1]], // Down
                [[0,1,0],[0,1,0],[1,1,0]]  // Left
            ],
            // L-piece (3x3 grid)
            [
                [[0,0,1],[1,1,1],[0,0,0]], // Up
                [[0,1,0],[0,1,0],[0,1,1]], // Right
                [[0,0,0],[1,1,1],[1,0,0]], // Down
                [[1,1,0],[0,1,0],[0,1,0]]  // Left
            ]
        ];
    }

    async execute(args, terminal) {
        try {
            this.terminal = terminal;
            this.startGame();
        } catch (error) {
            console.error('TetrisGame: Failed to start:', error);
            terminal.writeln('\x1b[31mError: Failed to start Tetris game\x1b[0m');
        }
    }

    startGame() {
        // Completely clear terminal and disable input
        this.terminal.terminal.write('\x1b[2J\x1b[H'); // Clear screen and home cursor
        this.terminal.setGameRunning(true);
        this.gameState.gameRunning = true;
        this.gameState.score = 0;
        this.gameState.level = 1;
        this.gameState.lines = 0;
        this.initBoard();
        this.spawnPiece();

        // Initial render to show game immediately
        this.renderGame();
        
        this.setupInputHandler();
        this.gameLoop();
    }

    initBoard() {
        this.gameState.board = Array(this.gameState.height).fill().map(() => 
            Array(this.gameState.width).fill(0)
        );
    }

    spawnPiece() {
        const pieceIndex = Math.floor(Math.random() * this.pieces.length);
        this.gameState.currentPiece = {
            shape: this.pieces[pieceIndex][0],
            type: pieceIndex,
            rotation: 0
        };
        
        // Handle different piece sizes for proper centering
        let pieceWidth;
        if (pieceIndex === 0) { // I-piece (4x4)
            pieceWidth = 4;
            this.gameState.pieceX = Math.floor((this.gameState.width - pieceWidth) / 2);
            this.gameState.pieceY = -2; // Start higher for I-piece
        } else if (pieceIndex === 1) { // O-piece (2x2)
            pieceWidth = 2;
            this.gameState.pieceX = Math.floor((this.gameState.width - pieceWidth) / 2);
            this.gameState.pieceY = 0;
        } else { // All other pieces (3x3)
            pieceWidth = 3;
            this.gameState.pieceX = Math.floor((this.gameState.width - pieceWidth) / 2);
            this.gameState.pieceY = -1;
        }

        // Check for game over
        if (this.checkCollision()) {
            this.endGame();
            return;
        }
        
        // Update the game loop speed based on level
        this.updateGameSpeed();
    }

    setupInputHandler() {
        this.keyDisposable = this.terminal.terminal.onKey((event) => {
            if (!this.gameState.gameRunning) return;
            
            const key = event.key.toLowerCase();
            
            // Prevent the key from being echoed to terminal
            event.domEvent.preventDefault();
            event.domEvent.stopPropagation();
            
            let shouldRender = false;
            
            switch(key) {
                case 'q':
                case '\x1b': // ESC
                    this.endGame();
                    return;
                case 'a':
                case 'arrowleft':
                    shouldRender = this.movePiece(-1, 0);
                    break;
                case 'd':
                case 'arrowright':
                    shouldRender = this.movePiece(1, 0);
                    break;
                case 's':
                case 'arrowdown':
                    shouldRender = this.movePiece(0, 1) || !this.gameState.gameRunning;
                    break;
                case 'w':
                case 'arrowup':
                    this.rotatePiece();
                    shouldRender = true;
                    break;
            }
            
            // Only render if something actually changed
            if (shouldRender) {
                this.renderGame();
            }
        });
    }

    movePiece(dx, dy) {
        const oldX = this.gameState.pieceX;
        const oldY = this.gameState.pieceY;
        
        this.gameState.pieceX += dx;
        this.gameState.pieceY += dy;
        
        if (this.checkCollision()) {
            // Revert movement
            this.gameState.pieceX = oldX;
            this.gameState.pieceY = oldY;
            
            // If this was a downward movement that failed, place the piece
            if (dy > 0) {
                this.placePiece();
                this.clearLines();
                this.spawnPiece();
                return false; // Indicate piece was placed
            }
            return false; // Movement failed
        }
        return true; // Movement successful
    }

    rotatePiece() {
        const piece = this.gameState.currentPiece;
        const rotations = this.pieces[piece.type];
        
        // Skip rotation for O-piece (square) since it's the same in all rotations
        if (piece.type === 1) return;
        
        const newRotation = (piece.rotation + 1) % rotations.length;
        const oldShape = piece.shape;
        const oldRotation = piece.rotation;
        const oldX = this.gameState.pieceX;
        
        // Try the rotation
        piece.shape = rotations[newRotation];
        piece.rotation = newRotation;
        
        // If collision, try wall kicks (simple adjustments)
        if (this.checkCollision()) {
            // Try moving left one space
            this.gameState.pieceX = oldX - 1;
            if (this.checkCollision()) {
                // Try moving right one space from original position
                this.gameState.pieceX = oldX + 1;
                if (this.checkCollision()) {
                    // Try moving right two spaces from original position
                    this.gameState.pieceX = oldX + 2;
                    if (this.checkCollision()) {
                        // For I-piece, try moving left two spaces
                        if (piece.type === 0) {
                            this.gameState.pieceX = oldX - 2;
                            if (this.checkCollision()) {
                                // Rotation failed completely, revert everything
                                this.gameState.pieceX = oldX;
                                piece.shape = oldShape;
                                piece.rotation = oldRotation;
                            }
                        } else {
                            // Rotation failed, revert everything
                            this.gameState.pieceX = oldX;
                            piece.shape = oldShape;
                            piece.rotation = oldRotation;
                        }
                    }
                }
            }
        }
    }

    checkCollision() {
        const piece = this.gameState.currentPiece.shape;
        const px = this.gameState.pieceX;
        const py = this.gameState.pieceY;
        
        for (let y = 0; y < piece.length; y++) {
            for (let x = 0; x < piece[y].length; x++) {
                if (piece[y][x]) {
                    const newX = px + x;
                    const newY = py + y;
                    
                    if (newX < 0 || newX >= this.gameState.width || 
                        newY >= this.gameState.height ||
                        (newY >= 0 && this.gameState.board[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    placePiece() {
        const piece = this.gameState.currentPiece.shape;
        const px = this.gameState.pieceX;
        const py = this.gameState.pieceY;
        
        for (let y = 0; y < piece.length; y++) {
            for (let x = 0; x < piece[y].length; x++) {
                if (piece[y][x] && py + y >= 0) {
                    this.gameState.board[py + y][px + x] = this.gameState.currentPiece.type + 1;
                }
            }
        }
    }

    clearLines() {
        let linesCleared = 0;
        
        // Check each row from bottom to top
        for (let y = this.gameState.height - 1; y >= 0; y--) {
            if (this.gameState.board[y].every(cell => cell !== 0)) {
                // Remove the completed line
                this.gameState.board.splice(y, 1);
                // Add a new empty line at the top
                this.gameState.board.unshift(Array(this.gameState.width).fill(0));
                linesCleared++;
                y++; // Check the same row again since we removed one
            }
        }
        
        if (linesCleared > 0) {
            this.gameState.lines += linesCleared;
            
            // Scoring system: more lines at once = more points
            const baseScore = [0, 40, 100, 300, 1200][linesCleared] || 1200;
            this.gameState.score += baseScore * this.gameState.level;
            
            // Level up every 10 lines
            const newLevel = Math.floor(this.gameState.lines / 10) + 1;
            if (newLevel > this.gameState.level) {
                this.gameState.level = newLevel;
                this.updateGameSpeed(); // Increase speed for new level
            }
        }
    }

    updateGameSpeed() {
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
        }
        
        // Speed increases with level, minimum 50ms
        const speed = Math.max(50, 800 - (this.gameState.level - 1) * 75);
        
        this.gameInterval = setInterval(() => {
            if (this.gameState.gameRunning) {
                const moved = this.movePiece(0, 1);
                // Only render if something changed
                if (!moved || this.gameState.gameRunning) {
                    this.renderGame();
                }
            }
        }, speed);
    }

    gameLoop() {
        this.updateGameSpeed();
    }

    renderGame() {
        // Clear screen and move cursor to home
        this.terminal.terminal.write('\x1b[2J\x1b[H');
        
        this.terminal.writeln('\x1b[35m🧩 TETRIS\x1b[0m');
        this.terminal.writeln('\x1b[90mA/D: Move | S: Drop | W: Rotate | Q/ESC: Quit\x1b[0m');
        this.terminal.writeln(`Score: \x1b[36m${this.gameState.score}\x1b[0m | Level: \x1b[33m${this.gameState.level}\x1b[0m | Lines: \x1b[32m${this.gameState.lines}\x1b[0m`);
        this.terminal.writeln('');

        // Create display board
        const display = this.gameState.board.map(row => [...row]);
        
        // Add current piece
        if (this.gameState.currentPiece) {
            const piece = this.gameState.currentPiece.shape;
            const px = this.gameState.pieceX;
            const py = this.gameState.pieceY;
            
            for (let y = 0; y < piece.length; y++) {
                for (let x = 0; x < piece[y].length; x++) {
                    if (piece[y][x] && py + y >= 0 && py + y < this.gameState.height && px + x >= 0 && px + x < this.gameState.width) {
                        display[py + y][px + x] = -1; // Current piece marker
                    }
                }
            }
        }

        // Render board
        this.terminal.writeln('┌' + '─'.repeat(this.gameState.width) + '┐');
        
        for (let y = 0; y < this.gameState.height; y++) {
            let line = '│';
            for (let x = 0; x < this.gameState.width; x++) {
                const cell = display[y][x];
                if (cell === -1) {
                    line += '\x1b[43m \x1b[0m'; // Current piece (yellow)
                } else if (cell === 0) {
                    line += ' '; // Empty
                } else {
                    const colors = [
                        '\x1b[41m \x1b[0m', // Red
                        '\x1b[42m \x1b[0m', // Green  
                        '\x1b[44m \x1b[0m', // Blue
                        '\x1b[45m \x1b[0m', // Magenta
                        '\x1b[46m \x1b[0m', // Cyan
                        '\x1b[47m \x1b[0m', // White
                        '\x1b[40m \x1b[0m'  // Black
                    ];
                    line += colors[(cell - 1) % colors.length];
                }
            }
            line += '│';
            this.terminal.writeln(line);
        }
        
        this.terminal.writeln('└' + '─'.repeat(this.gameState.width) + '┘');
    }

    endGame() {
        this.gameState.gameRunning = false;
        
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        
        // Dispose of the key handler
        if (this.keyDisposable) {
            this.keyDisposable.dispose();
            this.keyDisposable = null;
        }
        
        // Clear screen and show game over
        this.terminal.terminal.write('\x1b[2J\x1b[H');
        
        // Restore normal terminal input handling
        this.terminal.setGameRunning(false);
        
        this.terminal.writeln('');
        this.terminal.writeln('\x1b[41m\x1b[37m                                    \x1b[0m');
        this.terminal.writeln('\x1b[41m\x1b[37m        🧩 GAME OVER! 🧩         \x1b[0m');
        this.terminal.writeln('\x1b[41m\x1b[37m                                    \x1b[0m');
        this.terminal.writeln('');
        this.terminal.writeln(`\x1b[36m📊 Final Score: \x1b[33m${this.gameState.score}\x1b[0m`);
        this.terminal.writeln(`\x1b[36m🏆 Level Reached: \x1b[33m${this.gameState.level}\x1b[0m`);
        this.terminal.writeln(`\x1b[36m📈 Lines Cleared: \x1b[33m${this.gameState.lines}\x1b[0m`);
        this.terminal.writeln('');
        this.terminal.writeln('\x1b[90mPress any key to return to terminal...\x1b[0m');
        
        // Set up a one-time key handler to return to terminal
        const returnKeyHandler = this.terminal.terminal.onKey((event) => {
            event.domEvent.preventDefault();
            event.domEvent.stopPropagation();
            returnKeyHandler.dispose();
            this.terminal.writePrompt();
        });
    }
}

export default TetrisGame;