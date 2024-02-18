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
                "📧 Email: abdulmeliksaylan@gmail.com | mailto:me@abdulme.link\n" +
                "🌐 Website: http://abdulme.link\n",
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
        "freelance.txt": {
            type: "file",
            user: "root",
            permissions: "r",
            content:
                "\x1b[33m📌 Providing a comprehensive range of services primarily focused on mobile and web software development,\x1b[0m 💻 \n\n" +
                "\x1b[36m🔹 I catered to a diverse clientele seeking solutions for various aspects of their digital platforms. A significant portion of my work involved assisting clients in maintaining or modernizing their existing software infrastructure. This entailed a multitude of tasks, such as revamping user interfaces, integrating new microservices, and incorporating analytical tools to enhance \x1b[33mperformance\x1b[36m and functionality.\x1b[0m\n\n" +
                "\x1b[36m🔹 For clients looking to rejuvenate their applications, I specialized in reskinning and integrating new features, including facilitating the seamless integration of Google Admob and Google AdSense advertisements to optimize revenue streams. Additionally, I adeptly configured APIs and web interfaces to streamline communication with servers, ensuring smooth data flow and efficient operations. Moreover, I provided support in setting up administrative interfaces, empowering clients to effectively manage their software environments.\x1b[0m\n\n" +
                "\x1b[36m🔹 In instances where clients required the development of new functionalities and backend systems based on preliminary designs or mock-ups, I leveraged my expertise to bring their concepts to life. Utilizing frameworks such as Flutter, I translated design concepts into fully functional applications, meticulously ensuring alignment with client specifications and preferences.\x1b[0m\n\n" +
                "\x1b[36m🔹 Moreover, I facilitated the deployment of applications to prominent digital marketplaces, such as Google Play and the App Store, managing all aspects of the process, from market descriptions to APK signing and API integrations. This comprehensive approach ensured a smooth and successful launch for each app, enhancing visibility and accessibility for end-users.\x1b[0m\n\n" +
                "\x1b[36m🔹 In handling projects ranging from low to mid complexity, I meticulously analyzed client requirements and anticipated demands to develop scalable solutions capable of accommodating growth and fluctuating user volumes. By leveraging my expertise in database management and server optimization, I ensured optimal performance and responsiveness, even under \x1b[33mhigh traffic conditions\x1b[36m.\x1b[0m\n\n" +
                "\x1b[36m🔹 Additionally, I provided tailored solutions for clients seeking web scraping and automation services to streamline their business processes. Through meticulous planning and execution, I delivered automated solutions that effectively gathered and processed relevant data, empowering clients to make informed decisions and gain a competitive edge in their respective industries.\x1b[0m\n\n" +
                "\x1b[36m🔹 Over the course of my tenure, I successfully completed nearly \x1b[33m30 projects\x1b[36m spanning durations ranging from two days to three months, each characterized by a collaborative approach and a commitment to exceeding client expectations. With a track record of achieving \x1b[33m100% project completion\x1b[36m and consistently high levels of customer satisfaction, I am well-equipped to address the diverse needs of clients in the realm of software development and beyond.\x1b[0m\n\n" +
                "\x1b[36m🔹 In addition to serving a diverse clientele, I also provided tailored software solutions to local startups and businesses, addressing their specific needs and contributing to the growth and efficiency of the local business ecosystem. From conceptualization to execution, I collaborated closely with these entities to develop bespoke software applications that aligned with their objectives and operational requirements.\x1b[0m\n\n" +
                "\x1b[36m🔹 Furthermore, I offered on-site maintenance services, ensuring the smooth functioning and continuous optimization of software systems within the premises of various businesses. This hands-on approach allowed me to promptly address any issues or updates, minimizing downtime and maximizing productivity for my clients.\x1b[0m\n\n" +
                "\x1b[36m🔹 By fostering strong relationships with local startups and businesses, I not only supported their technological endeavors but also contributed to the overall prosperity of the community. My dedication to providing personalized solutions and ongoing support underscored my commitment to the success and sustainability of these ventures, further solidifying my reputation as a trusted partner in software development and maintenance. 🚀\x1b[0m",
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
let currentSuggestionIndex = 0;
let firstInput = null;

function autoCompleteCommand(input) {
    let actualInput = firstInput !== null ? firstInput : input;
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

    term.onData(function (data) {
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
        action: (term) => {
            writeln("Abdulmelik Saylan is a software developer.");
            writeln(
                "He specializes in web development and mobile app development."
            );
        },
    },

    ls: {
        description: "List directory contents",
        action: (term, ...options) => {
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
        console.log(args);
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
