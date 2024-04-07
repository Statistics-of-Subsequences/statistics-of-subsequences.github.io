function attachBackArrow() {
    const backButton = document.createElement("div");
    backButton.id = "back-button";
    backButton.tabIndex = 0;
    backButton.classList.add("center");

    const backArrowSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    backArrowSVG.setAttributeNS(null, "viewBox", "0 0 38.273 38.273");

    const backArrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    backArrowPath.setAttributeNS(null, "d", "M 20.621 10.484 L 20.621 5.84 C 20.621 5.032 20.163 4.292 19.44 3.931 C 18.718 3.572 17.851 3.652 17.204 4.137 L 7.718 11.284 C 7.041 11.576 6.601 11.954 6.317 12.342 L 0.849 16.461 C 0.312 16.866 -0.003 17.501 0 18.173 C 0.002 18.846 0.322 19.478 0.862 19.879 L 17.217 32.012 C 17.863 32.492 18.727 32.566 19.447 32.203 C 20.167 31.841 20.621 31.103 20.621 30.298 L 20.621 24.781 C 20.634 24.781 20.646 24.781 20.659 24.781 C 24.501 24.781 31.346 25.87 34.025 33.167 C 34.336 34.013 35.141 34.564 36.026 34.564 C 36.105 34.564 36.183 34.56 36.262 34.551 C 37.237 34.443 38.013 33.683 38.142 32.711 C 38.194 32.317 39.35 23.029 33.681 16.481 C 30.621 12.948 26.235 10.935 20.621 10.484 Z");

    backArrowSVG.appendChild(backArrowPath);
    backButton.appendChild(backArrowSVG);
    document.querySelector("header").prepend(backButton);

    backButton.onclick = () => {
        window.open("./index.html", "_self");
    };
}

window.addEventListener("DOMContentLoaded", attachBackArrow);