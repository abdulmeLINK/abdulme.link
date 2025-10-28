/**
 * Typing Test Game - Measure typing speed and accuracy
 * Type the displayed text as quickly and accurately as possible
 */
class TypingGame {
    constructor() {
        this.gameState = {
            text: '',
            currentIndex: 0,
            startTime: null,
            endTime: null,
            errors: 0,
            correctChars: 0,
            totalChars: 0,
            wpm: 0,
            accuracy: 100,
            gameRunning: false,
            userInput: ''
        };
        this.terminal = null;
        this.keyDisposable = null;
        this.difficulty = 'medium'; // easy, medium, hard
        this.testTexts = {
            easy: [
                "The cat sat on the mat.",
                "A quick brown fox jumps over a lazy dog.",
                "Hello world! This is an easy typing test.",
                "Simple words make typing practice fun and easy."
            ],
            medium: [
                "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet at least once.",
                "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole filled with worms and oozy smells.",
                "Programming is the art of telling another human what one wants the computer to do. It requires logical thinking and creativity.",
                "Artificial intelligence is intelligence demonstrated by machines, in contrast to the natural intelligence displayed by humans.",
                "The best way to predict the future is to invent it. Technology advances through innovation and persistent effort."
            ],
            hard: [
                "Code is like humor. When you have to explain it, it's bad. Good code should be self-documenting and elegant.",
                "Debugging is twice as hard as writing the code in the first place. Therefore, if you write code as cleverly as possible, you are not smart enough to debug it.",
                "The complexity of software is an essential property, not an accidental one. Hence, descriptions of a software entity that abstract away its complexity often abstract away its essence.",
                "Any fool can write code that a computer can understand. Good programmers write code that humans can understand. - Martin Fowler",
                "First, solve the problem. Then, write the code. Don't try to do both at the same time, or you'll end up with neither working properly."
            ]
        };
    }

    async execute(args, terminal) {
        try {
            this.terminal = terminal;
            
            // Check for difficulty argument
            if (args.length > 0) {
                const diff = args[0].toLowerCase();
                if (['easy', 'medium', 'hard'].includes(diff)) {
                    this.difficulty = diff;
                }
            }
            
            this.showDifficultySelection();
        } catch (error) {
            console.error('TypingGame: Failed to start:', error);
            terminal.writeln('\x1b[31mError: Failed to start typing game\x1b[0m');
        }
    }

    showDifficultySelection() {
        this.terminal.terminal.write('\x1b[2J\x1b[H');
        this.terminal.writeln('\x1b[34m⌨️  TYPING SPEED TEST\x1b[0m');
        this.terminal.writeln('\x1b[90mSelect difficulty or start with current setting\x1b[0m');
        this.terminal.writeln('');
        this.terminal.writeln(`Current difficulty: \x1b[33m${this.difficulty.toUpperCase()}\x1b[0m`);
        this.terminal.writeln('');
        this.terminal.writeln('\x1b[36m1\x1b[0m - Easy (short, simple words)');
        this.terminal.writeln('\x1b[33m2\x1b[0m - Medium (standard sentences)');
        this.terminal.writeln('\x1b[31m3\x1b[0m - Hard (complex programming text)');
        this.terminal.writeln('');
        this.terminal.writeln('\x1b[32mENTER\x1b[0m - Start test with current difficulty');
        this.terminal.writeln('\x1b[90mESC / Ctrl+C\x1b[0m - Return to terminal');
        
        this.setupDifficultyHandler();
    }

    setupDifficultyHandler() {
        // Dispose of any existing handler first to prevent accumulation
        if (this.keyDisposable) {
            this.keyDisposable.dispose();
            this.keyDisposable = null;
        }
        
        this.keyDisposable = this.terminal.terminal.onKey((event) => {
            const key = event.key;
            event.domEvent.preventDefault();
            event.domEvent.stopPropagation();
            
            // Handle ESC and Ctrl+C to quit
            if (key === '\x1b' || key === '\x03') { // ESC or Ctrl+C
                if (this.keyDisposable) {
                    this.keyDisposable.dispose();
                    this.keyDisposable = null;
                }
                this.terminal.setGameRunning(false);
                this.terminal.writePrompt();
                return;
            }
            
            if (key === '\r' || key === '\n') { // ENTER
                if (this.keyDisposable) {
                    this.keyDisposable.dispose();
                    this.keyDisposable = null;
                }
                this.startTest();
                return;
            }
            
            if (key === '1') {
                this.difficulty = 'easy';
                this.showDifficultySelection();
            } else if (key === '2') {
                this.difficulty = 'medium';
                this.showDifficultySelection();
            } else if (key === '3') {
                this.difficulty = 'hard';
                this.showDifficultySelection();
            }
        });
    }

    startTest() {
        // Completely clear terminal and disable input
        this.terminal.terminal.write('\x1b[2J\x1b[H'); // Clear screen and home cursor
        this.terminal.setGameRunning(true);
        
        // Select random text based on difficulty
        const texts = this.testTexts[this.difficulty];
        this.gameState.text = texts[Math.floor(Math.random() * texts.length)];
        
        // Reset all game state
        this.gameState.gameRunning = true;
        this.gameState.currentIndex = 0;
        this.gameState.userInput = '';
        this.gameState.errors = 0;
        this.gameState.correctChars = 0;
        this.gameState.totalChars = 0;
        this.gameState.wpm = 0;
        this.gameState.accuracy = 100;
        this.gameState.startTime = null;
        this.gameState.endTime = null;
        
        this.setupInputHandler();
        this.renderTest();
    }

    setupInputHandler() {
        // Dispose of any existing handler first
        if (this.keyDisposable) {
            this.keyDisposable.dispose();
            this.keyDisposable = null;
        }
        
        this.keyDisposable = this.terminal.terminal.onKey((event) => {
            if (!this.gameState.gameRunning) return;
            
            const key = event.key;
            
            // Prevent the key from being echoed to terminal
            event.domEvent.preventDefault();
            event.domEvent.stopPropagation();
            
            // Handle ESC and Ctrl+C to quit
            if (key === '\x1b' || key === '\x03') { // ESC or Ctrl+C
                this.endTest();
                return;
            }
            
            if (key === '\x7f' || key === '\b') { // Backspace
                if (this.gameState.userInput.length > 0) {
                    this.gameState.userInput = this.gameState.userInput.slice(0, -1);
                    if (this.gameState.currentIndex > 0) {
                        this.gameState.currentIndex--;
                    }
                    this.renderTest();
                }
                return;
            }
            
            // Regular character input
            if (key.length === 1 && key.charCodeAt(0) >= 32) {
                if (!this.gameState.startTime) {
                    this.gameState.startTime = Date.now();
                }
                
                this.gameState.userInput += key;
                this.gameState.totalChars++;
                
                if (key === this.gameState.text[this.gameState.currentIndex]) {
                    this.gameState.correctChars++;
                    this.gameState.currentIndex++;
                } else {
                    this.gameState.errors++;
                    // Still advance to next character for continued typing
                    this.gameState.currentIndex++;
                }
                
                this.gameState.accuracy = Math.round((this.gameState.correctChars / this.gameState.totalChars) * 100);
                
                // Calculate WPM
                if (this.gameState.startTime) {
                    const elapsed = (Date.now() - this.gameState.startTime) / 1000 / 60;
                    const wordsTyped = this.gameState.currentIndex / 5;
                    this.gameState.wpm = Math.round(wordsTyped / elapsed);
                }
                
                if (this.gameState.currentIndex >= this.gameState.text.length) {
                    this.gameState.endTime = Date.now();
                    this.endTest();
                    return;
                }

                this.renderTest();
            }
        });
    }

    renderTest() {
        // Clear screen and move cursor to home
        this.terminal.terminal.write('\x1b[2J\x1b[H');
        
        this.terminal.writeln('\x1b[34m⌨️  TYPING SPEED TEST\x1b[0m \x1b[90m(' + this.difficulty.toUpperCase() + ')\x1b[0m');
        this.terminal.writeln('\x1b[90mType the text below as accurately and quickly as possible.\x1b[0m');
        this.terminal.writeln('\x1b[90mPress ESC or Ctrl+C to quit.\x1b[0m');
        this.terminal.writeln('');

        // Show stats
        const wpm = this.gameState.wpm;
        const accuracy = this.gameState.accuracy;
        const progress = Math.round((this.gameState.currentIndex / this.gameState.text.length) * 100);
        
        this.terminal.writeln(`WPM: \x1b[36m${wpm}\x1b[0m | Accuracy: \x1b[32m${accuracy}%\x1b[0m | Progress: \x1b[36m${progress}%\x1b[0m`);
        this.terminal.writeln(`Errors: \x1b[31m${this.gameState.errors}\x1b[0m | Correct: \x1b[32m${this.gameState.correctChars}\x1b[0m`);
        this.terminal.writeln('');

        // Show text with highlighting
        const text = this.gameState.text;
        const current = this.gameState.currentIndex;
        const userInput = this.gameState.userInput;
        
        this.terminal.writeln('📝 Text to type:');
        
        // Build display with character-by-character comparison
        let textDisplay = '';
        for (let i = 0; i < text.length; i++) {
            if (i < userInput.length) {
                // Character has been typed
                if (userInput[i] === text[i]) {
                    textDisplay += '\x1b[32m' + text[i] + '\x1b[0m'; // Correct (green)
                } else {
                    textDisplay += '\x1b[41m\x1b[37m' + text[i] + '\x1b[0m'; // Error (red background)
                }
            } else if (i === current) {
                textDisplay += '\x1b[43m\x1b[30m' + text[i] + '\x1b[0m'; // Current char (yellow highlight)
            } else {
                textDisplay += '\x1b[90m' + text[i] + '\x1b[0m'; // Not yet typed (gray)
            }
        }
        
        this.terminal.writeln(textDisplay);
        this.terminal.writeln('');

        // Show user input with cursor
        this.terminal.writeln('✍️  Your input:');
        this.terminal.writeln('\x1b[36m' + this.gameState.userInput + '\x1b[33m▋\x1b[0m'); // Cursor at end
        
        // Show current WPM if typing has started
        if (this.gameState.startTime && this.gameState.currentIndex > 0) {
            const elapsed = (Date.now() - this.gameState.startTime) / 1000 / 60; // minutes
            const wordsTyped = this.gameState.currentIndex / 5; // Standard: 5 characters = 1 word
            const currentWpm = Math.round(wordsTyped / elapsed);
            this.terminal.writeln('');
            this.terminal.writeln(`Current WPM: \x1b[36m${currentWpm}\x1b[0m`);
        }
    }

    endTest() {
        this.gameState.gameRunning = false;
        
        // Dispose of the key handler
        if (this.keyDisposable) {
            this.keyDisposable.dispose();
            this.keyDisposable = null;
        }

        // Clear screen and show results
        this.terminal.terminal.write('\x1b[2J\x1b[H');
        
        // Restore normal terminal input handling
        this.terminal.setGameRunning(false);

        if (this.gameState.startTime && this.gameState.endTime) {
            const totalTime = (this.gameState.endTime - this.gameState.startTime) / 1000; // seconds
            const totalChars = this.gameState.text.length;
            const wordsTyped = totalChars / 5; // Standard: 5 characters = 1 word
            const finalWPM = Math.round((wordsTyped / totalTime) * 60);
            const accuracy = Math.round(((totalChars - this.gameState.errors) / totalChars) * 100);
            
            this.terminal.writeln('\x1b[32m✓ TYPING TEST COMPLETED!\x1b[0m');
            this.terminal.writeln('');
            this.terminal.writeln(`\x1b[36mFinal Results:\x1b[0m`);
            this.terminal.writeln(`  WPM: \x1b[33m${finalWPM}\x1b[0m`);
            this.terminal.writeln(`  Accuracy: \x1b[32m${accuracy}%\x1b[0m`);
            this.terminal.writeln(`  Errors: \x1b[31m${this.gameState.errors}\x1b[0m`);
            this.terminal.writeln(`  Time: \x1b[36m${totalTime.toFixed(1)}s\x1b[0m`);
            this.terminal.writeln(`  Difficulty: \x1b[35m${this.difficulty.toUpperCase()}\x1b[0m`);
            this.terminal.writeln('');
            
            // Save and show best score
            this.saveBestScore(finalWPM, accuracy);
        } else {
            this.terminal.writeln('\x1b[33mTest cancelled.\x1b[0m');
        }
        
        this.terminal.writeln('');
        this.terminal.writePrompt();
    }

    saveBestScore(wpm, accuracy) {
        try {
            const key = `typing_best_${this.difficulty}`;
            const stored = localStorage.getItem(key);
            const currentBest = stored ? JSON.parse(stored) : { wpm: 0, accuracy: 0 };
            
            if (wpm > currentBest.wpm) {
                const newBest = { wpm, accuracy, date: new Date().toLocaleDateString() };
                localStorage.setItem(key, JSON.stringify(newBest));
                this.terminal.writeln(`\x1b[32m🎊 New personal best WPM for ${this.difficulty.toUpperCase()}!\x1b[0m`);
            } else {
                this.terminal.writeln(`\x1b[36mYour best ${this.difficulty.toUpperCase()} WPM: ${currentBest.wpm}\x1b[0m`);
            }
            
            // Show all best scores
            this.terminal.writeln('');
            this.terminal.writeln('\x1b[90m--- Personal Bests ---\x1b[0m');
            ['easy', 'medium', 'hard'].forEach(diff => {
                const bestKey = `typing_best_${diff}`;
                const best = localStorage.getItem(bestKey);
                if (best) {
                    const data = JSON.parse(best);
                    this.terminal.writeln(`${diff.toUpperCase()}: \x1b[33m${data.wpm} WPM\x1b[0m (${data.accuracy}%)`);
                } else {
                    this.terminal.writeln(`${diff.toUpperCase()}: \x1b[90mNo record\x1b[0m`);
                }
            });
        } catch (e) {
            // localStorage not available
            this.terminal.writeln('\x1b[90m(Score saving not available)\x1b[0m');
        }
    }
}

export default TypingGame;