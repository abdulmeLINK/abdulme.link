/**
 * Snake Game - Classic snake game for the terminal
 * Arrow keys or WASD to move, Q to quit, SPACE to pause
 * @class
 */
class SnakeGame {
    /**
     * Initialize Snake Game
     * @constructor
     */
    constructor() {
        this.gameState = {
            board: [],
            snake: [{x: 10, y: 10}],
            food: {x: 15, y: 10},
            direction: {x: 1, y: 0},
            score: 0,
            gameRunning: false,
            paused: false,
            width: 30,
            height: 20
        };
        this.gameInterval = null;
        this.terminal = null;
        this.keyDisposable = null;
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
            console.error('SnakeGame: Failed to start:', error);
            terminal.writeln('\x1b[31mError: Failed to start Snake game\x1b[0m');
        }
    }

    startGame() {
        // Completely clear terminal and disable input
        this.terminal.terminal.write('\x1b[2J\x1b[H'); // Clear screen and home cursor
        this.terminal.setGameRunning(true);
        this.gameState.gameRunning = true;
        this.gameState.paused = false;
        
        // Initialize snake in the center of the board
        const centerX = Math.floor(this.gameState.width / 2);
        const centerY = Math.floor(this.gameState.height / 2);
        this.gameState.snake = [{x: centerX, y: centerY}];
        
        this.gameState.food = this.generateFood();
        this.gameState.score = 0;
        this.gameState.direction = {x: 1, y: 0}; // Start moving right

        // Initial render to show game immediately
        this.renderGame();

        // Set up input handler
        this.setupInputHandler();
        
        // Start game loop
        this.gameInterval = setInterval(() => {
            if (this.gameState.gameRunning && !this.gameState.paused) {
                this.updateGame();
                this.renderGame();
            }
        }, 150);
    }

    setupInputHandler() {
        this.keyDisposable = this.terminal.terminal.onKey((event) => {
            const key = event.key.toLowerCase();
            
            // Prevent the key from being echoed to terminal
            event.domEvent.preventDefault();
            event.domEvent.stopPropagation();
            
            if (key === 'q' || key === '\x1b') { // Q or ESC
                this.endGame();
                return;
            }
            
            if (key === ' ') { // Spacebar for pause
                this.gameState.paused = !this.gameState.paused;
                this.renderGame();
                return;
            }

            // Direction controls - only change if not moving in opposite direction
            switch(key) {
                case 'w':
                case 'arrowup':
                    if (this.gameState.direction.y === 0) {
                        this.gameState.direction = {x: 0, y: -1};
                    }
                    break;
                case 's':
                case 'arrowdown':
                    if (this.gameState.direction.y === 0) {
                        this.gameState.direction = {x: 0, y: 1};
                    }
                    break;
                case 'a':
                case 'arrowleft':
                    if (this.gameState.direction.x === 0) {
                        this.gameState.direction = {x: -1, y: 0};
                    }
                    break;
                case 'd':
                case 'arrowright':
                    if (this.gameState.direction.x === 0) {
                        this.gameState.direction = {x: 1, y: 0};
                    }
                    break;
            }
        });
    }

    updateGame() {
        // Don't update if game is not running
        if (!this.gameState.gameRunning) {
            return;
        }

        const head = {...this.gameState.snake[0]};
        head.x += this.gameState.direction.x;
        head.y += this.gameState.direction.y;

        // Check wall collision
        if (head.x < 0 || head.x >= this.gameState.width || 
            head.y < 0 || head.y >= this.gameState.height) {
            this.endGame();
            return;
        }

        // Check self collision - check if new head position collides with body segments (excluding current head)
        for (let i = 1; i < this.gameState.snake.length; i++) {
            const segment = this.gameState.snake[i];
            if (segment.x === head.x && segment.y === head.y) {
                this.endGame();
                return;
            }
        }

        // Add new head
        this.gameState.snake.unshift(head);

        // Check food collision
        if (head.x === this.gameState.food.x && head.y === this.gameState.food.y) {
            this.gameState.score += 10;
            this.gameState.food = this.generateFood();
            // Don't remove tail when eating food (snake grows)
        } else {
            // Remove tail when not eating food (snake moves)
            this.gameState.snake.pop();
        }
    }

    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.gameState.width),
                y: Math.floor(Math.random() * this.gameState.height)
            };
        } while (this.gameState.snake.some(segment => segment.x === food.x && segment.y === food.y));
        return food;
    }

    renderGame() {
        // Clear screen and move cursor to home
        this.terminal.terminal.write('\x1b[2J\x1b[H');
        
        this.terminal.writeln('\x1b[32m🐍 SNAKE GAME\x1b[0m');
        this.terminal.writeln('\x1b[90mWASD/Arrow Keys: Move | SPACE: Pause | Q/ESC: Quit\x1b[0m');
        this.terminal.writeln(`Score: \x1b[36m${this.gameState.score}\x1b[0m | Length: \x1b[33m${this.gameState.snake.length}\x1b[0m`);
        
        if (this.gameState.paused) {
            this.terminal.writeln('\x1b[43m\x1b[30m ⏸️  PAUSED - Press SPACE to continue \x1b[0m');
        }
        
        this.terminal.writeln('');

        // Draw game board with borders
        this.terminal.writeln('┌' + '─'.repeat(this.gameState.width) + '┐');
        
        for (let y = 0; y < this.gameState.height; y++) {
            let line = '│';
            for (let x = 0; x < this.gameState.width; x++) {
                if (this.gameState.snake.some(segment => segment.x === x && segment.y === y)) {
                    if (x === this.gameState.snake[0].x && y === this.gameState.snake[0].y) {
                        line += '\x1b[32m●\x1b[0m'; // Head (solid circle)
                    } else {
                        line += '\x1b[32m○\x1b[0m'; // Body (hollow circle)
                    }
                } else if (x === this.gameState.food.x && y === this.gameState.food.y) {
                    line += '\x1b[31m♦\x1b[0m'; // Food (diamond)
                } else {
                    line += ' ';
                }
            }
            line += '│';
            this.terminal.writeln(line);
        }
        
        this.terminal.writeln('└' + '─'.repeat(this.gameState.width) + '┘');
    }

    endGame() {
        // Immediately stop the game to prevent further updates
        this.gameState.gameRunning = false;
        
        // Clear the game interval
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        
        // Dispose of the key handler
        if (this.keyDisposable) {
            this.keyDisposable.dispose();
            this.keyDisposable = null;
        }

        // Wait a moment to ensure game loop stops, then show game over
        setTimeout(() => {
            // Clear screen and show game over
            this.terminal.terminal.write('\x1b[2J\x1b[H');
            
            // Restore normal terminal input handling
            this.terminal.setGameRunning(false);

            // Save high score
            const highScore = this.saveHighScore();
            
            // Big, visible game over display
            this.terminal.writeln('');
            this.terminal.writeln('\x1b[41m\x1b[37m                                    \x1b[0m');
            this.terminal.writeln('\x1b[41m\x1b[37m         🐍 GAME OVER! 🐍          \x1b[0m');
            this.terminal.writeln('\x1b[41m\x1b[37m                                    \x1b[0m');
            this.terminal.writeln('');
            this.terminal.writeln(`\x1b[36m📊 Final Score: \x1b[33m${this.gameState.score}\x1b[0m`);
            this.terminal.writeln(`\x1b[36m🏆 High Score: \x1b[33m${highScore}\x1b[0m`);
            this.terminal.writeln(`\x1b[36m📏 Snake Length: \x1b[33m${this.gameState.snake.length}\x1b[0m`);
            
            if (this.gameState.score === highScore && this.gameState.score > 0) {
                this.terminal.writeln('');
                this.terminal.writeln('\x1b[32m🎉 NEW HIGH SCORE! 🎉\x1b[0m');
            }
            
            this.terminal.writeln('');
            this.terminal.writeln('\x1b[90mPress any key to return to terminal...\x1b[0m');
            
            // Set up a one-time key handler to return to terminal
            const returnKeyHandler = this.terminal.terminal.onKey(() => {
                returnKeyHandler.dispose();
                this.terminal.writePrompt();
            });
        }, 100); // Small delay to ensure game loop has stopped
    }

    saveHighScore() {
        const storageKey = 'snake_high_score';
        const currentHigh = parseInt(localStorage.getItem(storageKey)) || 0;
        const newHigh = Math.max(currentHigh, this.gameState.score);
        localStorage.setItem(storageKey, newHigh.toString());
        return newHigh;
    }
}

export default SnakeGame;