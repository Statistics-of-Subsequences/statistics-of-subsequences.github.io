import { generateMatrixShell, showPopup, selectCell, gradientMap, userSelectedCells } from "./generate-matrix.js";
import fillMatrix from "./fill-matrix.js";
import getSortedLevels from "./level.js";

let count = 200;
let currentLevel = 0;
const defaults = {
    origin: { y: 0.7 }
};

function fire(particleRatio, opts) {
    confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * Math.ceil(currentLevel / 5) * particleRatio)
    });
}

async function loadLevelData(level, levelNum) {
    currentLevel = levelNum + 1;
    const rows = Math.pow(2, level.m);
    const columns = Math.pow(2, level.n);

    const goalHTML = document.querySelector("#goal");
    goalHTML.innerHTML = await fetch(`../../res/graphics/level-${levelNum + 1}.svg`).then(r => r.text());
    const optimalSolution = level.optimalSolution;

    // set checkboxes
    document.querySelector("#commute").checked = level.allowedProperties.commute;
    document.querySelector("#complement").checked = level.allowedProperties.complement;
    document.querySelector("#reverse").checked = level.allowedProperties.reverse;
    document.querySelector("#slice-prefix").checked = level.allowedProperties.slicePrefix;
    document.querySelector("#slice-suffix").checked = level.allowedProperties.sliceSuffix;
    document.querySelector("#slice-circumfix").checked = level.allowedProperties.sliceCircumfix;

    generateMatrixShell(rows, columns);

    document.querySelector("#fill-matrix").onclick = () => checkSolution(rows, columns, optimalSolution);
    document.querySelector("#clear-matrix").onclick = () => generateMatrixShell(rows, columns);
}

function checkSolution(rows, columns, optimalSolution) {
    fillMatrix(rows, columns);

    var solutionSVGData = document.querySelector("#table").innerHTML;
    var solutionSVGDataSanitized = solutionSVGData.replace(/ (?:data[^=]+(?:=".*?")|aria[^=]+(?:=".*?"))/gm, ""); // remove any tag starting with the word " data" or " aria"

    fetch(`../../res/graphics/level-${currentLevel}.svg`)
        .then(response => response.text())
        .then(text => {
            const parsed = new DOMParser().parseFromString(text, 'text/html');
            var goalSVGData = parsed.querySelector('svg').innerHTML;
            var goalSVGDataSanitized = goalSVGData.replace(/ (?:data[^=]+(?:=".*?")|aria[^=]+(?:=".*?"))/gm, ""); // remove any tag starting with the word " data" or " aria"
            goalSVGDataSanitized = goalSVGDataSanitized.match(/.+(?:<\/rect>)/gm)[0]; // remove any junk after document element

            var userSelectedCellCoordinates = userSelectedCells.map(e => ({ x: e.dataset.x, y: e.dataset.y }));
            if (solutionSVGDataSanitized === goalSVGDataSanitized) {
                if (userSelectedCells.length == optimalSolution) {
                    displayResult("optimal", optimalSolution);
                } else {
                    displayResult("suboptimal", optimalSolution, userSelectedCellCoordinates, rows, columns);
                    
                }
            } else {
                displayResult("incorrect", optimalSolution, userSelectedCellCoordinates, rows, columns);
            }
        });
}

function displayResult(type, optimal, userSelectedCellCoordinates, rows, columns) {
    switch (type) {
        case "incorrect":
            document.querySelector("#result-heading").textContent = "Not Quite...";
            document.querySelector("#result-body").textContent = "Click/Tap anywhere to try again";
            break;
        case "optimal":
            document.querySelector("#result-heading").textContent = "Great Job!";
            document.querySelector("#result-body").innerHTML = `You reached our goal score of ${optimal} squares!.<br />Click/Tap anywhere to close`;
            break;
        case "suboptimal":
            document.querySelector("#result-heading").textContent = "Good, but...";
            document.querySelector("#result-body").innerHTML = `You can do better!<br />Your solution has ${userSelectedCellCoordinates.length} squares selected.<br />The best solution has at most ${optimal} squares selected.<br />Click/tap anywhere to try again`;
            break;
        default:
            console.error("Unexpected result type provided.");
    }
    const resultPopup = document.querySelector("#result-popup");
    resultPopup.onclick = null;
    resultPopup.classList.remove("hidden");

    if (type === "optimal") {
        fire(0.25, {
            spread: 26,
            startVelocity: 55,
        });
        fire(0.2, {
            spread: 60,
        });
        fire(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8
        });
        fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2
        });
        fire(0.1, {
            spread: 120,
            startVelocity: 45,
        });
    }

    // Prevent accidentally closing
    setTimeout(() => {
        resultPopup.onclick = () => {
            resultPopup.classList.add("hidden");
            if (type === 'suboptimal') {
                if (currentLevel >= 10) {
                    generateMatrixShell(rows, columns);
                    for (let i = 0; i < userSelectedCellCoordinates.length; i++) {
                        selectCell(document.querySelector(`rect[data-x="${userSelectedCellCoordinates[i].x}"][data-y="${userSelectedCellCoordinates[i].y}"]`), gradientMap);
                    }
                    document.querySelector("#info-popup").classList.add("hidden");
                }
            } else if (type === 'incorrect') {
                generateMatrixShell(rows, columns);
                if (currentLevel < 22) {
                    for (let i = 0; i < userSelectedCellCoordinates.length; i++) {
                        selectCell(document.querySelector(`rect[data-x="${userSelectedCellCoordinates[i].x}"][data-y="${userSelectedCellCoordinates[i].y}"]`), gradientMap);
                    }
                    document.querySelector("#info-popup").classList.add("hidden");
                }
            }
        }
    }, 200);
}

window.addEventListener("DOMContentLoaded", async () => {
    document.querySelector("#back-button").onclick = () => {
        window.open("../../matrix-builder-game-level-select.html", "_self");
    };

    const params = new URLSearchParams(document.location.search);
    const levelNum = parseInt(params.get("id"));

    const levels = await getSortedLevels();
    console.log(levels);
    const level = levels[parseInt(levelNum)];

    let subHeaderString = `Level ${levelNum + 1}`;
    if(level.notes) {
        subHeaderString += " - ";
        subHeaderString += level.notes;
    }
    document.querySelector("#game-label").innerHTML = subHeaderString;

    window.onresize = () => {
        const rows = Math.pow(2, level.m);
        const columns = Math.pow(2, level.n);

        const cellWidth = -6.75 * level.m + 51.75;
        const cellHeight = -6.75 * level.n + 51.75;
        const cellSize = Math.min(cellWidth, cellHeight);

        const tableMatrix = document.querySelector("#table");
        tableMatrix.setAttributeNS(null, "width", columns * cellSize);
        tableMatrix.setAttributeNS(null, "height", rows * cellSize);

        tableMatrix.querySelectorAll("rect").forEach(e => {
            e.setAttributeNS(null, "x", cellSize * e.dataset.x);
            e.setAttributeNS(null, "y", cellSize * (rows - e.dataset.y - 1)); // reverses so that (00..., 00...) is in bottom left instead of top left
            e.setAttributeNS(null, "width", cellSize);
            e.setAttributeNS(null, "height", cellSize);
        });

        const goalHTML = document.querySelector("#goal");
        const goalSVG = goalHTML.querySelector("svg");
        const matrixWidth = tableMatrix.getAttributeNS(null, "width");
        const matrixHeight = tableMatrix.getAttributeNS(null, "height");
        goalSVG.setAttributeNS(null, "width", matrixWidth);
        goalSVG.setAttributeNS(null, "height", matrixHeight);
        const svgRows = goalSVG.querySelectorAll("g");
        for (let row = 0; row < svgRows.length; row++) {
            const rowCols = svgRows[row].querySelectorAll("rect");
            for (let col = 0; col < rowCols.length; col++) {
                rowCols[col].setAttributeNS(null, "x", col * matrixHeight / rows);
                rowCols[col].setAttributeNS(null, "y", row * matrixWidth / columns);
                rowCols[col].setAttributeNS(null, "width", matrixWidth / rows);
                rowCols[col].setAttributeNS(null, "height", matrixHeight / columns);

                const fill = rowCols[col].getAttributeNS(null, "fill");
                rowCols[col].dataset.length = (fill === "white" || fill === "#FFFFFF") ? "Unknown" : "Known";
            }
        }
    };

    const popup = document.querySelector("#info-popup");
    document.querySelector("main").onscroll = () => {
        if (!popup.classList.contains("hidden")) {
            showPopup();
        }
    };

    loadLevelData(level, levelNum);
});