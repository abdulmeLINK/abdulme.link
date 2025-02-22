let isAnimating = false;
let commandHistory = [];
let currentHistoryIndex = -1;
let isOutputing = false;
let promptLength = 0;
const term = new Terminal({
    theme: {
        background: "rgba(0, 0, 0, 0.0)",
    },

    allowTransparency: true,
    rendererType: "dom",
});

// Custom writeln function
function writeln(data) {
    isOutputing = true;
    term.writeln(data);
}
let currentPath = ["home"];
var fileSystem;
//export fileSystem as json
export const fileSystemJson = JSON.stringify(fileSystem);
console.log(fileSystemJson);
let currentSuggestionIndex = 0;
let firstInput = null;

// ===== NEW: Add filesystem initialization flag =====
let fileSystemInitialized = false;

$.ajax({
    url: './db/filesystem.json',
    type: 'GET',
    success: function(data) {
        fileSystem = data;
        fileSystemInitialized = true; // mark filesystem as ready
        console.log('Local filesystem loaded:', fileSystem);
        // Additional initialization if needed with the local filesystem data
    },
    error: function(jqXHR, textStatus, errorThrown) {
        console.error('Failed to load local filesystem:', errorThrown);
        writeln("\x1b[31mError: Failed to load local filesystem. Some commands may not work properly.\x1b[0m");
    }
});

function autoCompleteCommand(input) {
    let actualInput = firstInput !== null ? firstInput : input;
    if (!fileSystemInitialized) {
        return input; // Skip auto-completion if filesystem is not loaded
    }
    const parts = actualInput.split(" ");
    const command = parts[0];
    const path = parts[1] || "";
    const pathParts = path.split("/");
    let currentDir = currentPath.reduce((acc, cur) => acc[cur], fileSystem);

    for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (part in currentDir) {

            
            currentDir = currentDir[part];
        } else {
            // Path does not exist
            return input;
        }
    }

    const lastPart = pathParts[pathParts.length - 1];
    const suggestions = Object.keys(currentDir).filter(
        (key) =>
            key.startsWith(lastPart) &&
            (currentDir[key].type === "directory" ||
                currentDir[key].type === "file")
    );

    console.log(Object.keys(currentDir));

    if (suggestions.length > 0) {
        // If there are one or more suggestions, auto-complete the command with the current suggestion
        if (firstInput === null) {
            firstInput = input;
            currentSuggestionIndex = 0;
        }
        const suggestion =
            suggestions[currentSuggestionIndex % suggestions.length];
        currentSuggestionIndex++;
        return `${command} ${pathParts.slice(0, -1).join("/")}${
            pathParts.length > 1 ? "/" : ""
        }${suggestion}`;
    } else {
        // If there are no suggestions, do not auto-complete the command
        firstInput = null;
        return input;
    }
}
export function initializeTerminal() {
    const fitAddon = new FitAddon.FitAddon();
    const webLinksAddon = new WebLinksAddon.WebLinksAddon();
    term.loadAddon(webLinksAddon);
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

    term.onData(async function (data) {
        if (isAnimating) {
            return;
        }

        const code = data.charCodeAt(0);
        if (code !== 9) {
            firstInput = null;
        }
        if (code === 9) {
            // ASCII code for Tab
            // Handle Tab key press
            // Check if the command should have auto-completion

            const completedCommand = autoCompleteCommand(input);
            if (completedCommand !== input) {
                // Clear the current input
                term.write("\b \b".repeat(input.length));
                term.write(completedCommand); // Write the completed command
                input = completedCommand; // Update the input
                cursorPosition = input.length; // Update the cursor position
            }
        }
        if (code === 13) {
            term.write("\r\n");
            await handleCommand(input, term);
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
                term.write("\b \b".repeat(input.length)); // Clear the current input
                input = commandHistory[currentHistoryIndex];
                term.write(input); // Write the new input
                cursorPosition = input.length; // Update the cursor position
                let diff = input.length - cursorPosition;
                if (diff > 0) {
                    // If the new input is longer, add extra spaces and move the cursor back
                    term.write(" ".repeat(diff) + "\b".repeat(diff));
                }
            } else if (
                arrowKey === "[B" &&
                currentHistoryIndex < commandHistory.length - 1
            ) {
                // Down arrow key
                currentHistoryIndex++;
                term.write("\b \b".repeat(input.length)); // Clear the current input
                input = commandHistory[currentHistoryIndex];
                term.write(input); // Write the new input
                cursorPosition = input.length; // Update the cursor position
                let diff = input.length - cursorPosition;
                if (diff > 0) {
                    // If the new input is longer, add extra spaces and move the cursor back
                    term.write(" ".repeat(diff) + "\b".repeat(diff));
                }
            }
        } else if (code >= 32) {
            if (data.length > 1) {
                // Handle case where data is a string of characters
                for (let i = 0; i < data.length; i++) {
                    input =
                        input.slice(0, cursorPosition) +
                        data[i] +
                        input.slice(cursorPosition);
                    cursorPosition++;
                    term.write(data[i] + input.slice(cursorPosition));
                    term.write("\b".repeat(input.length - cursorPosition));
                }
            } else {
                // Handle case where data is a single character
                input =
                    input.slice(0, cursorPosition) +
                    data +
                    input.slice(cursorPosition);
                cursorPosition++;
                term.write(data + input.slice(cursorPosition));
                term.write("\b".repeat(input.length - cursorPosition));
            }
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
        action: async function() {
            try {
                const data = await fetchData('api/about');
                if (data && data.about) {
                    writeln(`\x1b[34m${data.about.title}\x1b[0m`); // Blue color
                    writeln(`\x1b[31m${data.about.description}\x1b[0m`); // Red color
                } else {
                    writeln("\x1b[31mError: Could not load about information\x1b[0m");
                }
            } catch (error) {
                writeln(`\x1b[31mError: ${error.message}\x1b[0m`);
            }
        },
    },

    ls: {
        description: "List directory contents",
        action: (term, ...options) => {
            if (!fileSystemInitialized) {
                writeln("\x1b[31mError: Filesystem not initialized\x1b[0m");
                return;
            }
            const colors = {
                file: "\x1b[37m", // white
                directory: "\x1b[34m", // blue
            };
            const reset = "\x1b[0m";
            const wd = currentPath[currentPath.length - 1];
            // Extract name from options
            let name =
                options.find(
                    (option) =>
                        typeof option === "string" && !option.startsWith("-")
                ) || wd;

            if (name == ".") {
                name = wd;
            }

            // If no name is found, print an error message and return
            if (!fileSystem[name] && !fileSystem[wd][name]) {
                writeln(
                    `ls: cannot access '${name}': No such file or directory`
                );
                return;
            }

            // If the name is a directory, list its contents
            if (
                name &&
                name in fileSystem &&
                (name == wd || fileSystem[wd][name].type === "directory")
            ) {
                for (let item in fileSystem[name]) {
                    if (typeof fileSystem[name][item] === "object") {
                        let color =
                            colors[fileSystem[name][item].type] ||
                            colors["file"];
                        let permissions = fileSystem[name][item].permissions;
                        let user = fileSystem[name][item].user;

                        if (options.includes("-l")) {
                            writeln(
                                `${permissions} ${user} ${color}${item}${reset}`
                            );
                        } else {
                            writeln(`${color}${item}${reset}`);
                        }
                    }
                }
            } else {
                // If the name is a file, list the file
                let color = colors[fileSystem[wd][name].type] || colors["file"];
                let permissions = fileSystem[wd][name].permissions;
                let user = fileSystem[wd][name].user;

                if (options.includes("-l")) {
                    writeln(`${permissions} ${user} ${color}${name}${reset}`);
                } else {
                    writeln(`${color}${name}${reset}`);
                }
            }
        },
    },
    cd: {
        description: "Change the current directory",
        action: (term, dir) => {
            if (!fileSystemInitialized) {
                writeln("\x1b[31mError: Filesystem not initialized\x1b[0m");
                return;
            }
            if (dir === "..") {
                if (currentPath.length > 1) {
                    currentPath.pop();
                }
            } else {
                const currentDir = currentPath.reduce((acc, cur) => acc[cur], fileSystem);
                if (currentDir[dir] && currentDir[dir].type === "directory") {
                    currentPath.push(dir);
                } else {
                    writeln(`Directory not found: ${dir}`);
                }
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
    mylinks: {
        description: "Show my profile links",
        action: (term) => {
            writeln("\x1b[36mGitHub:\x1b[0m https://github.com/abdulmeLINK");
            writeln(
                "\x1b[34mLinkedIn:\x1b[0m https://www.linkedin.com/in/abdulmelik-saylan-889096228/"
            );
        },
    },
};

async function fetchData(url) {
    try {
        const data = await $.ajax({ url, type: 'POST' });
        return data;
    } catch (error) {
        writeln(`An error occurred: ${error.message}`);
        return null;
    }
}

async function handleCommand(command, term) {
    let [cmd, ...args] = command.toLowerCase().trim().split(" ");
    if (commands[cmd]) {
        isOutputing = true;
        console.log(args);
        await commands[cmd].action(term, ...args);
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
