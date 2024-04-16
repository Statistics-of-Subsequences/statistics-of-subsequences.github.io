function setTheme() {
    const cookies = document.cookie.split(";");
    if(cookies.map(c => c.trim()).filter(c => c.match("theme=dark")).length > 0) {
        document.body.classList.add("night-mode");
    } else if (cookies.filter(c => c.match("theme=light")).length > 0) {
        document.body.classList.remove("night-mode");
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add("night-mode");
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if(event.matches) {
            document.body.classList.add("night-mode");
        } else {
            document.body.classList.remove("night-mode");
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const sunWrapper = document.querySelector("#sun-wrapper");
    sunWrapper.addEventListener("click", () => {
        if(document.body.classList.contains("night-mode")) {
            document.body.classList.remove("night-mode");
            document.cookie = "theme=light;";
        }
    });
    sunWrapper.onkeyup = e => e.key === "Enter" && sunWrapper.click();

    const moonWrapper = document.querySelector("#moon-wrapper");
    moonWrapper.addEventListener("click", () => {
        if(!document.body.classList.contains("night-mode")) {
            document.body.classList.add("night-mode");
            document.cookie = "theme=dark;";
        }
    });
    moonWrapper.onkeyup = e => e.key === "Enter" && moonWrapper.click();
});