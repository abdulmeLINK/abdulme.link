let isAnimating = false;

export function initializeTerminal() {
    const term = new Terminal({
        theme: {
            background: "rgba(0, 0, 0, 0.0)",
        },

        allowTransparency: true,
        rendererType: "dom",
    });
    term.open(document.getElementById("xterm-container"));
    term.focus();
    term.writeln("Welcome to Abdulmelik Saylan's website!");
    term.writeln('Type "help" for available commands.');
    promptUser(term);

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
    });

    setInterval(() => {
        term.write("\x1b[?25h");
        setTimeout(() => {
            term.write("\x1b[?25l");
        }, 500);
    }, 1000);
}

function handleCommand(command, term) {
    switch (command.toLowerCase().trim()) {
        case "help":
            animateOutput(
                "Available commands:\r\n- portfolio: View my portfolio.\r\n- about: Learn more about me.",
                term
            );
            break;
        case "portfolio":
            window.location.href = "/portfolio";
            break;
        case "about":
            term.writeln("Abdulmelik Saylan is a software developer.");
            term.writeln(
                "He specializes in web development and mobile app development."
            );

            break;
        default:
            term.writeln(
                'Command not found. Type "help" for available commands.'
            );
    }
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
    const reset = "\x1b[0m";
    term.write(
        "\r\n" + green + "guest@" + window.location.hostname + ":~$ " + reset
    );
}

document.addEventListener("DOMContentLoaded", () => {
    initializeTerminal();
});
