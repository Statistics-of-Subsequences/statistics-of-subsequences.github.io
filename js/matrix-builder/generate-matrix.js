import { generateLCSMemo } from "../LCS.js";
import generateGradient from "../gradient.js";

export var userSelectedCells;
export var gradientMap;

export function generateMatrixShell(rows, columns) {
    const n = Math.log2(columns);
    const m = Math.log2(rows);

    const xLength = parseInt(n);
    const yLength = parseInt(m);

    var cellWidth = -6.75 * n + 51.75;
    var cellHeight = -6.75 * m + 51.75;
    const cellSize = Math.min(cellWidth, cellHeight);

    const popup = document.querySelector("#info-popup");
    const tableMatrix = document.querySelector("#table");
    tableMatrix.innerHTML = "";
    tableMatrix.setAttributeNS(null, "width", columns * cellWidth);
    tableMatrix.setAttributeNS(null, "height", rows * cellHeight);

    userSelectedCells = [];
    gradientMap = generateGradient([0xfde724, 0x79d151, 0x29788e, 0x404387, 0x440154], Math.min(xLength, yLength) + 1);

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

    const activeCell = tableMatrix.querySelector("rect:hover");
    activeCell && showPopup(activeCell);
}

export function selectCell(cell, gradientMap) {
    // if cell is not white, then set it to white
    if (cell.ariaSelected === "true") {
        cell.setAttributeNS(null, "fill", "white");
        cell.dataset.length = "Unknown";
        cell.dataset.derivation = "Not Derived Yet";
        userSelectedCells = userSelectedCells.filter(e => e !== cell);
    } else {
        const lcs = generateLCSMemo(cell.dataset.xString, cell.dataset.yString);
        cell.dataset.length = lcs[lcs.length - 1][lcs[0].length - 1].len;
        cell.dataset.derivation = "User Selected";
        cell.setAttributeNS(null, "fill", `#${gradientMap[cell.dataset.length].toString(16)}`);
        userSelectedCells.push(cell);
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