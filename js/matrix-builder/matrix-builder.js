import { generateLCSMemo } from "../LCS.js";
import generateGradient from "../gradient.js";

let allowedProperties = {
    "commute": true,
    "complement": true,
    "reverse": true,
    "slicePrefix": true,
    "sliceSuffix": true,
    "sliceCircumfix": true
};

document.addEventListener("DOMContentLoaded", () => {
    const nBox = document.getElementById("n");
    const mBox = document.getElementById("m");

    nBox.selectedIndex = 0;
    mBox.selectedIndex = 0;
    generateMatrixShell();

    let checkboxes = document.getElementsByTagName("input");
    for (let i = 0; i < checkboxes.length; i++) {
        const x = i; //const x to prevent all checkboxes using the last value of i
        checkboxes[i].onchange = () => allowedProperties[checkboxes[x]] = checkboxes[x].value;
    }

    n.onchange = generateMatrixShell;
    m.onchange = generateMatrixShell;
});

function generateMatrixShell() {
    const xLength = parseInt(document.getElementById("n").value);
    const yLength = parseInt(document.getElementById("m").value);

    const tableWrapper = document.querySelector("#table-wrapper");
    const columns = Math.pow(2, xLength);
    const rows = Math.pow(2, yLength);

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
    popup.querySelector("#lcs-derivation").textContent = cell.dataset.derivation;

    const iconPos = cell.getBoundingClientRect();
    popup.classList.remove("hidden");
    popup.style.left = iconPos.x + iconPos.width + "px";
    popup.style.top = (iconPos.y + iconPos.height / 2 - popup.getBoundingClientRect().height / 2) + "px";
}

function downloadSVG() {
    let svgData = new XMLSerializer().serializeToString(matrix);
    let svgBlob = new Blob([svgData], {type: "image/svg+xml;charset=utf-8"});
    let svgUrl = URL.createObjectURL(svgBlob);
    let downloadLink = document.createElement("a");
    let fileName = prompt("Enter file name", "level-");
    downloadLink.href = svgUrl;
    downloadLink.download = fileName + ".svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}