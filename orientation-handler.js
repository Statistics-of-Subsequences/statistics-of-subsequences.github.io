function setup() {
    // if the device is in portrait mode
    if (window.innerHeight > window.innerWidth) {
        document.getElementById("orientation").href = "portrait-style.css";
    } else {
        document.getElementById("orientation").href = "landscape-style.css";
    }
}

window.addEventListener("resize", setup);
window.addEventListener("orientationchange", setup);