import { generateLCSMemo } from "../LCS.js";
import generateGradient from "../gradient.js";

import fillMatrix from "./fill-matrix.js";

document.addEventListener("DOMContentLoaded", () => {
    const nBox = document.getElementById("n");
    const mBox = document.getElementById("m");

    generateMatrixShell(Math.pow(2, parseInt(mBox.value)), Math.pow(2, parseInt(nBox.value)));

    n.onchange = () => generateMatrixShell(Math.pow(2, parseInt(mBox.value)), Math.pow(2, parseInt(nBox.value)));
    m.onchange = () => generateMatrixShell(Math.pow(2, parseInt(mBox.value)), Math.pow(2, parseInt(nBox.value)));

    document.querySelector("#fill-matrix").onclick = () => fillMatrix(Math.pow(2, parseInt(mBox.value)), Math.pow(2, parseInt(nBox.value)));
    document.querySelector("#clear-matrix").onclick = () => generateMatrixShell(Math.pow(2, parseInt(mBox.value)), Math.pow(2, parseInt(nBox.value)));
    document.querySelector("#download-matrix").onclick = downloadSVG;
});

function generateMatrixShell(rows, columns) {
    const xLength = parseInt(document.getElementById("n").value);
    const yLength = parseInt(document.getElementById("m").value);

    const tableWrapper = document.querySelector("#table-wrapper");

    const cellSize = Math.min(Math.min(tableWrapper.clientWidth / columns, tableWrapper.clientHeight / rows), 50);

    const tableSVG = document.querySelector("#table-svg");
    tableSVG.style.height = cellSize * rows;
    tableSVG.style.width = cellSize * columns;

    const popup = document.querySelector("#info-popup");
    const tableMatrix = document.querySelector("#table");
    tableMatrix.innerHTML = "";

    const gradientMap = generateGradient([0xfde724, 0x79d151, 0x29788e, 0x404387, 0x440154], Math.min(xLength, yLength) + 1);

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            const entry = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            entry.setAttributeNS(null, "x", cellSize * j);
            entry.setAttributeNS(null, "y", cellSize * (rows - i - 1)); // reverses so that (00..., 00...) is in bottom left instead of top left
            entry.setAttributeNS(null, "width", cellSize);
            entry.setAttributeNS(null, "height", cellSize);
            entry.setAttributeNS(null, "fill", "#FFFFFF");
            entry.setAttributeNS(null, "stroke", "#000000");
            entry.dataset.length = "Unknown";
            entry.dataset.derivation = "Not Derived Yet";
            entry.dataset.x = j;
            entry.dataset.y = i;
            entry.dataset.xString = j.toString(2).padStart(xLength, "0");
            entry.dataset.yString = i.toString(2).padStart(yLength, "0");
            entry.ariaSelected = false;

            entry.addEventListener("click", () => selectCell(entry, gradientMap));
            entry.addEventListener("mouseover", () => showPopup(entry));
            entry.addEventListener("mouseout", () => popup.classList.add("hidden"));
            
            tableMatrix.appendChild(entry);
        }
    }
}

function selectCell(cell, gradientMap) {
    // if cell is not white, then set it to white
    if (cell.ariaSelected === "true") {
        cell.setAttributeNS(null, "fill", "white");
        cell.dataset.length = "Unknown";
        cell.dataset.derivation = "Not Derived Yet";
    } else {
        const lcs = generateLCSMemo(cell.dataset.xString, cell.dataset.yString);
        cell.dataset.length = lcs[lcs.length - 1][lcs[0].length - 1].len;
        cell.dataset.derivation = "User Selected";
        cell.setAttributeNS(null, "fill", `#${gradientMap[cell.dataset.length].toString(16)}`);
    }

    cell.ariaSelected = !(cell.ariaSelected === "true");
    showPopup(cell);
}

function showPopup(cell) {
    const popup = document.querySelector("#info-popup");

    popup.querySelector("#lcs-string-1").textContent = cell.dataset.xString;
    popup.querySelector("#lcs-string-2").textContent = cell.dataset.yString;
    popup.querySelector("#lcs-length").textContent = cell.dataset.length;
    popup.querySelector("#lcs-derivation").innerHTML = cell.dataset.derivation;

    const iconPos = cell.getBoundingClientRect();
    popup.classList.remove("hidden");
    popup.style.left = iconPos.x + iconPos.width + "px";
    popup.style.top = (iconPos.y + iconPos.height / 2 - popup.getBoundingClientRect().height / 2) + "px";
}

async function downloadSVG() {
    const n = document.getElementById("n").value;
    const m = document.getElementById("m").value;
    const matrix = document.querySelector("#table-svg");

    if(window.showSaveFilePicker) {
        try {
            let types = [ {description: "SVG File", accept: { "image/svg+xml": [".svg"]}} ];

            const file = await window.showSaveFilePicker({ 
                startIn: "downloads", 
                suggestedName: `matrix${n}x${m}`, 
                types: types,
                excludeAcceptAllOption: true
            });
            
            let fileData, writer;
            const fileParts = file.name.split(".");
            switch(fileParts[fileParts.length - 1]) {
                case "svg":
                    fileData = new XMLSerializer().serializeToString(matrix);

                    writer = await file.createWritable();
                    await writer.write(fileData);
                    await writer.close();
                    break;
                default:
                    throw "Attempting to save to unknown file type.";
            }
        } catch(err) {
            console.error(err.name, err.message);
        }
    } else {
        const svgData = new XMLSerializer().serializeToString(matrix);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml" });
        const svgUrl = URL.createObjectURL(svgBlob);
        window.open(svgUrl);
    }
}