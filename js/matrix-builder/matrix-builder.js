import { generateMatrixShell, showPopup } from "./generate-matrix.js";
import fillMatrix from "./fill-matrix.js";

document.addEventListener("DOMContentLoaded", () => {
    document.cookie = "page=1;";
    const nBox = document.getElementById("n");
    const mBox = document.getElementById("m");
    nBox.value = 1;
    mBox.value = 1;

    generateMatrixShell(Math.pow(2, parseInt(mBox.value)), Math.pow(2, parseInt(nBox.value)));

    n.onchange = () => generateMatrixShell(Math.pow(2, parseInt(mBox.value)), Math.pow(2, parseInt(nBox.value)));
    m.onchange = () => generateMatrixShell(Math.pow(2, parseInt(mBox.value)), Math.pow(2, parseInt(nBox.value)));

    document.querySelector("#fill-matrix").onclick = () => fillMatrix(Math.pow(2, parseInt(mBox.value)), Math.pow(2, parseInt(nBox.value)));
    document.querySelector("#clear-matrix").onclick = () => generateMatrixShell(Math.pow(2, parseInt(mBox.value)), Math.pow(2, parseInt(nBox.value)));

    const propertiesDisplay = document.querySelector("#properties-overlay");
    document.querySelector("#properties-info").onclick = () => propertiesDisplay.classList.remove("hidden");
    document.querySelector("#close-x").onclick = () => propertiesDisplay.classList.add("hidden");
    
    window.onresize = () => {
        const rows = Math.pow(2, parseInt(mBox.value));
        const columns = Math.pow(2, parseInt(nBox.value));

        var cellWidth = -6.75 * n.value + 51.75;
        var cellHeight = -6.75 * m.value + 51.75;
        const cellSize = Math.min(cellWidth, cellHeight);

        const tableMatrix = document.querySelector("#table");
        tableMatrix.setAttributeNS(null, "width", columns * cellWidth);
        tableMatrix.setAttributeNS(null, "height", rows * cellHeight);

        document.querySelectorAll("rect").forEach(e => {
            e.setAttributeNS(null, "x", cellSize * e.dataset.x);
            e.setAttributeNS(null, "y", cellSize * (rows - e.dataset.y - 1)); // reverses so that (00..., 00...) is in bottom left instead of top left
            e.setAttributeNS(null, "width", cellSize);
            e.setAttributeNS(null, "height", cellSize);
        });
    };

    const popup = document.querySelector("#info-popup");
    document.querySelector("main").onscroll = () => {
        if(!popup.classList.contains("hidden")) {
            showPopup();
        }
    };
});