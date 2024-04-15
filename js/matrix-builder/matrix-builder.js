import { generateMatrixShell } from "./generate-matrix.js";
import fillMatrix from "./fill-matrix.js";

document.addEventListener("DOMContentLoaded", () => {
    document.cookie = "page=2;";
    const nBox = document.getElementById("n");
    const mBox = document.getElementById("m");

    generateMatrixShell(Math.pow(2, parseInt(mBox.value)), Math.pow(2, parseInt(nBox.value)));

    n.onchange = () => generateMatrixShell(Math.pow(2, parseInt(mBox.value)), Math.pow(2, parseInt(nBox.value)));
    m.onchange = () => generateMatrixShell(Math.pow(2, parseInt(mBox.value)), Math.pow(2, parseInt(nBox.value)));

    document.querySelector("#fill-matrix").onclick = () => fillMatrix(Math.pow(2, parseInt(mBox.value)), Math.pow(2, parseInt(nBox.value)));
    document.querySelector("#clear-matrix").onclick = () => generateMatrixShell(Math.pow(2, parseInt(mBox.value)), Math.pow(2, parseInt(nBox.value)));
    document.querySelector("#download-matrix").onclick = () => downloadSVG();

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
});

function downloadSVG() {
    var matrix = document.querySelector("#table");

    var svgData = new XMLSerializer().serializeToString(matrix);
    var svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    var svgUrl = URL.createObjectURL(svgBlob);
    var downloadLink = document.createElement("a");
    var fileName = prompt("Enter file name", "level-");
    downloadLink.href = svgUrl;
    downloadLink.download = fileName + ".svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}