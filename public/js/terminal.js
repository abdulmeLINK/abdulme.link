let isAnimating = false;
let commandHistory = [];
let currentCommand = "";
let promptLength = 0;
let currentHistoryIndex = -1;
let isOutputing = true;
const term = new Terminal({
    theme: {
        background: "rgba(0, 0, 0, 0.0)",
    },

    allowTransparency: true,
    rendererType: "dom",
});
function customWrite(term, data) {
    term.write(data);
}

// Custom writeln function
function writeln(data) {
    isOutputing = true;
    term.writeln(data);
}
let currentPath = ["home"];
const fileSystem = {
    home: {
        "subjects.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "\x1b[33mSubjects\x1b[0m\n\n" +
                "📚 Computer Science\n" +
                "🔬 Artificial Intelligence\n" +
                "🌐 Web Development\n" +
                "⚡️ Data Science\n" +
                "🎮 Game Development",
        },
        "projects.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "\x1b[33mProjects\x1b[0m\n\n" +
                "🌍 Personal Website: Built a responsive website using HTML, CSS, and JavaScript.\n" +
                "🤖 Chatbot: Developed a natural language processing chatbot using Python and NLTK.\n" +
                "📊 Data Analysis: Performed data analysis and visualization on a real-world dataset using Python and Pandas.\n" +
                "🎯 Game App: Created a mobile game app using Unity and C#.\n" +
                "🤝 Volunteer Platform: Developed a web platform to connect volunteers with local community organizations.",
        },
        dir1: {
            type: "directory",
            user: "root",
            permissions: "r",
        },
    },
    dir1: {
        "resume.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "\x1b[33mResume\x1b[0m\n\n" +
                "Education: Bachelor's Degree in Computer Science\n" +
                "Experience: 3 years of software development experience\n" +
                "Skills: HTML, CSS, JavaScript, Python, Java, SQL\n" +
                "Certifications: AWS Certified Developer, Google Cloud Associate Cloud Engineer",
        },
        "contact.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "\x1b[33mContact\x1b[0m\n\n" +
                "📧 Email: example@example.com\n" +
                "🌐 Website: www.example.com\n" +
                "📞 Phone: +1234567890\n" +
                "🏢 Address: 123 Main Street, City, Country",
        },
    },
    // Additional directories and files can be added here
};

export function initializeTerminal() {
    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.open(document.getElementById("xterm-container"));
    term.focus();
    writeln("Welcome to Abdulmelik Saylan's website!");
    writeln('Type "help" for available commands.');
    promptUser(term);

    // Get the .mac-window element
    const macWindow = $(".mac-window");

    // Create a simple debounce function
    let debounceTimeout;
    const debounce = (func, delay) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(func, delay);
    };

    // Create a new MutationObserver instance
    const observer = new MutationObserver(() => {
        // Fit the terminal when the .mac-window size changes, but debounce the call
        debounce(() => fitAddon.fit(), 200);
    });

    // Start observing the .mac-window element
    observer.observe(macWindow[0], {
        attributes: true,
        childList: true,
        characterData: true,
        subtree: true,
    });

    $("#terminal").click(() => {
        term.focus();
    });

    let input = "";
    let cursorPosition = 0;

    term.onData(function (data) {
        if (isAnimating) {
            return;
        }

        const code = data.charCodeAt(0);

        if (code === 13) {
            term.write("\r\n");
            handleCommand(input, term);
            if (!isAnimating) promptUser(term);
            input = "";
            cursorPosition = 0;
        } else if (code === 127) {
            if (cursorPosition > 0) {
                input =
                    input.slice(0, cursorPosition - 1) +
                    input.slice(cursorPosition);
                cursorPosition--;
                term.write("\b \b");
                term.write(input.slice(cursorPosition) + " ");
                term.write("\b".repeat(input.length - cursorPosition + 1));
            }
        } else if (code === 27) {
            const arrowKey = data.slice(1);
            if (arrowKey === "[D" && cursorPosition > 0) {
                cursorPosition--;
                term.write("\b");
            } else if (arrowKey === "[C" && cursorPosition < input.length) {
                cursorPosition++;
                term.write(input[cursorPosition - 1]);
            } else if (arrowKey === "[A" && currentHistoryIndex > 0) {
                // Up arrow key
                currentHistoryIndex--;
                term.write("\b \b");
                term.write(input.slice(cursorPosition) + " ");
                term.write("\b".repeat(input.length));
                input = commandHistory[currentHistoryIndex];
                // term.write("\x1b[2K\r"); // Clear line and move cursor to beginning
                term.write(input);
                cursorPosition = input.length;
            } else if (
                arrowKey === "[B" &&
                currentHistoryIndex < commandHistory.length - 1
            ) {
                // Down arrow key
                currentHistoryIndex++;
                term.write("\b \b");
                term.write(input.slice(cursorPosition) + " ");
                term.write("\b".repeat(input.length));
                input = commandHistory[currentHistoryIndex];
                //   term.write("\x1b[2K\r"); // Clear line and move cursor to beginning
                term.write(input);
                cursorPosition = input.length;
            }
        } else if (code >= 32) {
            input =
                input.slice(0, cursorPosition) +
                data +
                input.slice(cursorPosition);
            cursorPosition++;
            term.write(data + input.slice(cursorPosition));
            term.write("\b".repeat(input.length - cursorPosition));
        }

        console.log(input);
    });

    setInterval(() => {
        term.write("\x1b[?25h");
        setTimeout(() => {
            term.write("\x1b[?25l");
        }, 500);
    }, 1000);
}

let commands = {
    help: {
        description: "Show available commands",
        action: (term) => {
            let output = "Available commands:\r\n";
            for (let command in commands) {
                output += `- ${command}: ${commands[command].description}\r\n`;
            }
            animateOutput(output, term);
        },
    },
    portfolio: {
        description: "View my portfolio",
        action: () => (window.location.href = "/portfolio"),
    },
    about: {
        description: "Learn more about me",
        action: (term) => {
            writeln("Abdulmelik Saylan is a software developer.");
            writeln(
                "He specializes in web development and mobile app development."
            );
        },
    },
    ls: {
        description: "List directory contents",
        action: (term, options) => {
            const colors = {
                file: "\x1b[37m", // white
                directory: "\x1b[34m", // blue
            };
            const reset = "\x1b[0m";

            for (let item in fileSystem[currentPath[currentPath.length - 1]]) {
                let color =
                    colors[
                        fileSystem[currentPath[currentPath.length - 1]][item]
                            .type
                    ] || colors["file"];
                let permissions =
                    fileSystem[currentPath[currentPath.length - 1]][item]
                        .permissions;
                let user =
                    fileSystem[currentPath[currentPath.length - 1]][item].user;
                let size =
                    fileSystem[currentPath[currentPath.length - 1]][item]
                        .size || 0;
                let modDate =
                    fileSystem[currentPath[currentPath.length - 1]][item]
                        .modDate || new Date();

                if (options && options.includes("l")) {
                    writeln(
                        `${permissions} ${user} ${size} ${modDate.toLocaleDateString()} ${modDate.toLocaleTimeString()} ${color}${item}${reset}`
                    );
                } else {
                    writeln(`${color}${item}${reset}`);
                }
            }
        },
    },

    cd: {
        description: "Change the current directory",
        action: (term, dir) => {
            if (dir === "..") {
                if (currentPath.length > 1) {
                    currentPath.pop();
                }
            } else if (fileSystem[dir]) {
                currentPath.push(dir);
            } else {
                writeln(`Directory not found: ${dir}`);
            }
        },
    },

    pwd: {
        description: "Print the current directory",
        action: (term) => {
            writeln(currentPath.join("/"));
        },
    },
    cat: {
        description: "Read file contents",
        action: (term, fileName) => {
            if (fileSystem[currentPath[currentPath.length - 1]][fileName]) {
                writeln(
                    fileSystem[currentPath[currentPath.length - 1]][
                        fileName
                    ].content.replace(/\n/g, "\r\n")
                );
            } else {
                writeln(`File not found: ${fileName}`);
            }
        },
    },

    switchtheme: {
        description: "Switch the theme of the application",
        action: () => {
            let ts = $("#themeSwitch");
            if (ts) {
                ts.click();
                // get theme from storag and print the current theme
                let currentTheme = localStorage.getItem("theme");
                //print current theme
                if (currentTheme === "light") {
                    writeln("Theme is set to light mode.");
                } else {
                    writeln("Theme is set to dark mode.");
                }
            } else {
                writeln("switchTheme function is not available.");
            }
        },
    },
    clear: {
        description: "Clear the terminal",
        action: (term) => {
            term.clear();
        },
    },
};

function handleCommand(command, term) {
    let [cmd, ...args] = command.toLowerCase().trim().split(" ");
    if (commands[cmd]) {
        isOutputing = true;
        commands[cmd].action(term, ...args);
    } else {
        writeln('Command not found. Type "help" for available commands.');
    }

    commandHistory.push(command); // Add command to history
    currentHistoryIndex = commandHistory.length;
}

function animateOutput(output, term, delay = 10) {
    let i = 0;
    isAnimating = true;
    const intervalId = setInterval(() => {
        if (i < output.length) {
            term.write(output[i]);
            i++;
        } else {
            clearInterval(intervalId);
            promptUser(term);
            isAnimating = false;
        }
    }, delay);
}

function promptUser(term) {
    const green = "\x1b[32m";
    const blue = "\x1b[34m";
    const reset = "\x1b[0m";
    let prompt =
        "guest@" +
        window.location.hostname +
        ":" +
        currentPath.join("/") +
        "$ ";
    let printable =
        "\r\n" +
        green +
        "guest@" +
        window.location.hostname +
        ":" +
        blue +
        currentPath.join("/") +
        green +
        "$ " +
        reset;

    term.write(printable);
    promptLength = prompt.length;
}

document.addEventListener("DOMContentLoaded", () => {
    initializeTerminal();
});
