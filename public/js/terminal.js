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
        contact_information: {
            type: "directory",
            user: "root",
            permissions: "r",
        },
        objective_statement: {
            type: "directory",
            user: "root",
            permissions: "r",
        },
        education: {
            type: "directory",
            user: "root",
            permissions: "r",
        },
        work_experience: {
            type: "directory",
            user: "root",
            permissions: "r",
        },
        skills: {
            type: "directory",
            user: "root",
            permissions: "r",
        },
        certifications: {
            type: "directory",
            user: "root",
            permissions: "r",
        },
        projects: {
            type: "directory",
            user: "root",
            permissions: "r",
        },
        references: {
            type: "directory",
            user: "root",
            permissions: "r",
        },
    },
    contact_information: {
        "contact.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "\x1b[33mContact\x1b[0m\n\n" +
                "📧 Email: abdulmeliksaylan@gmail.com\n" +
                "🌐 Website: abdulme.link\n",
        },
    },
    objective_statement: {
        "objective.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "\x1b[33mObjective\x1b[0m\n\n" +
                "A highly motivated individual seeking a software development position...",
        },
    },
    education: {
        "education.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "\x1b[33mEducation\x1b[0m\n\n" +
                "Bachelor's Degree in Software Engineering (ongoing)\n" +
                "University of Muğla Sıtkı Koçman, Muğla, TR",
        },
    },
    work_experience: {
        "job1.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "\x1b[33mJob 1\x1b[0m\n\n" +
                "Software Developer at XYZ Company\n" +
                "Responsibilities: ...\n" +
                "Achievements: ...",
        },
        "job2.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "\x1b[33mJob 2\x1b[0m\n\n" +
                "Junior Developer at ABC Company\n" +
                "Responsibilities: ...\n" +
                "Achievements: ...",
        },
    },
    skills: {
        "info.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            // Explain the purpose of this directory
            content:
                "\x1b[33mSkills\x1b[0m\n\n" +
                "🔹 Programming Languages\n" +
                "🔹 Frameworks\n" +
                "🔹 Environments\n" +
                "🔹 Development Tools\n" +
                "🔹 Cloud Services\n" +
                "🔹 Design Tools\n" +
                "🔹 Hardware\n" +
                "\x1b[32mNote:\x1b[0m The skills listed here are ones that I have used in at least one project, not just taken a course or familiar with the syntax. I believe that the best way to learn a programming language or framework is to use it in a real-world project, not just read about it or watch tutorials. This is why I have only listed the ones that I have used in a project or competition.",
        },
        "languages.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "\x1b[33m🔤 Languages\x1b[0m\n\n" +
                "• C\n" +
                "• C++\n" +
                "• C#\n" +
                "• Dart\n" +
                "• Go\n" +
                "• HTML\n" +
                "• Java\n" +
                "• JavaScript\n" +
                "• Python\n" +
                "• PHP\n" +
                "• SQL\n" +
                "• XML Scheme",
        },
        "frameworks.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "\x1b[33m🛠️ Frameworks\x1b[0m\n\n" +
                "• Flutter\n" +
                "• Laravel\n" +
                "• NodeJS\n" +
                "• VueJS (familiar)\n" +
                "• Bootstrap\n" +
                "• Unity",
        },
        "environments.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "\x1b[33m🌐 Environments\x1b[0m\n\n" +
                "• Linux (primary)\n" +
                "• Windows\n" +
                "• Android Studio\n" +
                "• ADB",
        },
        "development_tools.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "\x1b[33m🔧 Development Tools\x1b[0m\n\n" +
                "• Git\n" +
                "• Google Colab\n" +
                "• XAMPP\n" +
                "• Nginx\n" +
                "• Visual Studio\n" +
                "• Web Debug Tools",
        },
        "cloud_services.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "\x1b[33m☁️ Cloud Services\x1b[0m\n\n" +
                "• AWS\n" +
                "• Firebase\n" +
                "• Google Cloud\n" +
                "• Heroku",
        },
        "design_tools.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "\x1b[33m🎨 Design Tools\x1b[0m\n\n" +
                "• Adobe XD\n" +
                "• SketchUp",
        },
        "hardware.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "\x1b[33m🖥️ Hardware\x1b[0m\n\n" +
                "• Arduino\n" +
                "• NodeMCU\n" +
                "• Raspberry Pi",
        },
    },
    certifications: {
        "certifications.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "\x1b[33mCertifications\x1b[0m\n\n" +
                "AWS Certified Developer\n" +
                "Google Cloud Associate Cloud Engineer",
        },
    },
    projects: {
        "charm.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "🔹 \x1b[1;33mCharm (2021) (Test Phase):\x1b[0m\n" +
                "   • 🚀 Launched the project with an idea that app gives free video games, promotions and community to the people who don’t have access to this kind of products.\n" +
                "   • 🌐 Created the remotely updatable localization system.\n" +
                "   • 💼 Designed and built sponsorship system.\n" +
                "   • 🏗️ Created the full app structure, frontend to backend.\n" +
                "   • 🛠️ Utilized: \x1b[1;36mDart, Flutter, AWS, Admob, Firebase, Google Services, PHP, Laravel, HTML, Javascript, Bootstrap\x1b[0m",
        },
        "liseler_arasi_iha_yarismasi.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "🔹 \x1b[1;33mLiseler Arası IHA Yarışması TEKNOFEST-TÜBİTAK (2020) (Team) (Competition):\x1b[0m\n" +
                "   • 🚁 Designed and built multi-copter drone circuit by using Flight Computer, ESC, Electric Motors, fuse etc.\n" +
                "   • 🌐 Implemented the 4G communication method to the Flight Computer thus, range of control almost became global without satellite communication.\n" +
                "   • 📐 Designed the 3D model of the drone frame.\n" +
                "   • 💻 Structured the service software that awakes and manages the 4G module.\n" +
                "   • 📝 Predicted the flight performance, overall utilization and overall cost before funding arrived, documented and reported them to the competition committee.\n" +
                "   • 📦 Managed all the purchase process, delivery tracking and expense proofs to be proven to committee.\n" +
                "   • 👥 Supervised and taught the processes to the 2 students in the our 3-member team by explaining the work principles behind the drone.\n" +
                "   • 🛠️ Utilized: \x1b[1;36mPython, Bash script, Mission Planner Ground Control Software, QGroundControl, Raspberry pi, Emerald Navio2, Sketch Up, Sixfab 4G module, ESC, Electric Motor\x1b[0m",
        },
        "two_factor_authentication_based_vault.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "🔹 \x1b[1;33m2-Factor Authentication Based Vault TÜBİTAK 4006 (2019) (Solo):\x1b[0m\n" +
                "   • 🔒 Implemented 2-Factor Authentication System to a private vault using an Android app and mail verification system.\n" +
                "   • 📐 Designed the circuit establishes the connection between modules and microcontrollers.\n" +
                "   • 💻 Structured the connection protocol between microcontrollers by using I/O pins.\n" +
                "   • 📱 Created Native Android app for tracking status of the vault.\n" +
                "   • 🛠️ Utilized: \x1b[1;36mArduino, NodeMCU, Java, XML, Firebase, Blynk\x1b[0m",
        },
        "smart_house_demo.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "🔹 \x1b[1;33mSmart House Demo TÜBİTAK 4006 (2019) (Team):\x1b[0m\n" +
                "   • 🏠 Designed and built the full structure and software of Bluetooth communication between mobile app and micro controllers.\n" +
                "   • 💡 Designed and built the circuit that demonstrates lights, outlets and automated doors by using LEDs, sensors and motors.\n" +
                "   • 🛠️ Utilized: \x1b[1;36mArduino, C, Java\x1b[0m",
        },
        games: {
            type: "directory",
            user: "root",
            permissions: "r",
        },
    },
    games: {
        "satellite_management.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "🔹 \x1b[1;33mSatellite Management (2018) (Game) (Removed):\x1b[0m\n" +
                "   • 🎮 Created an idle type and space theme game using Unity game engine.\n" +
                "   • 🛠️ Utilized: \x1b[1;36mC#, Unity, Admob\x1b[0m",
        },
        "geometry_zombies.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "🔹 \x1b[1;33mGeometry Zombies (2018) (Game) (Removed):\x1b[0m\n" +
                "   • 🎮 Created an idle type and space theme game using Unity game engine.\n" +
                "   • 🛠️ Utilized: \x1b[1;36mC#, Unity, Admob, Firebase, Google Play Games\x1b[0m",
        },
    },

    references: {
        "references.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content: "\x1b[33mReferences\x1b[0m\n\n" + "Available upon request",
        },
    },
    // Additional directories and files can be added here
};

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
    mylinks: {
        description: "Show my profile links",
        action: (term) => {
            writeln("\x1b[36mGitHub:\x1b[0m https://github.com/yourusername");
            writeln(
                "\x1b[34mLinkedIn:\x1b[0m https://linkedin.com/in/yourusername"
            );
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
