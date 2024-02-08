import "bootstrap/dist/css/bootstrap.css";
import "../css/app.css";
import "bootstrap";

window.addEventListener("scroll", function () {
    document.querySelectorAll(".roadmap-point").forEach(function (point) {
        var rect = point.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            point.setAttribute("data-anim", "show");
        } else {
            point.setAttribute("data-anim", "hide");
        }
    });
});

const themeSwitch = document.getElementById("themeSwitch");
const themeLabel = document.querySelector('label[for="themeSwitch"]');
const navbar = document.querySelector(".navbar");
const footer = document.querySelector("footer");
const themeTexts = document.querySelectorAll(".theme-text");
const currentTheme = localStorage.getItem("theme");

export function switchTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    navbar.classList.remove(
        "navbar-light",
        "navbar-dark",
        "bg-light",
        "bg-dark"
    );
    navbar.classList.add(theme === "light" ? "navbar-light" : "navbar-dark");
    navbar.classList.add(theme === "light" ? "bg-light" : "bg-dark");
    footer.classList.remove("bg-light", "bg-dark");
    footer.classList.add(theme === "light" ? "bg-light" : "bg-dark");
    themeTexts.forEach((el) => {
        el.classList.remove("text-light", "text-dark");
        el.classList.add(theme === "light" ? "text-dark" : "text-light");
    });
}

export function initializeTheme() {
    if (currentTheme) {
        switchTheme(currentTheme);
        if (currentTheme === "light") {
            themeSwitch.checked = true;
            themeLabel.textContent = "Light Mode";
        }
    } else {
        let currentHour = new Date().getHours();
        if (currentHour >= 6 && currentHour < 18) {
            switchTheme("light");
            themeSwitch.checked = true;
            themeLabel.textContent = "Light Mode";
        } else {
            switchTheme("dark");
            themeSwitch.checked = false;
            themeLabel.textContent = "Dark Mode";
        }
    }
}
//after dom loaded
document.addEventListener("DOMContentLoaded", function () {
    initializeTheme();
    themeSwitch.addEventListener("change", function () {
        if (themeSwitch.checked) {
            switchTheme("light");
            themeLabel.textContent = "Light Mode";
            localStorage.setItem("theme", "light");
        } else {
            switchTheme("dark");
            themeLabel.textContent = "Dark Mode";
            localStorage.setItem("theme", "dark");
        }
    });
});
