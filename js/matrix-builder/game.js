import { generateMatrixShell, selectCell, gradientMap, userSelectedCells } from "./generate-matrix.js";
import fillMatrix from "./fill-matrix.js";

let level = 0;

export function startLevel(level, n, m, allowedProperties, goal, optimalSolution, notes) {
    window.open("./matrix-builder-game.html", "_self", "height=10");
    document.cookie = `level=${level};`;
    document.cookie = `n=${n};`;
    document.cookie = `m=${m};`;
    document.cookie = `allowedProperties=${JSON.stringify(allowedProperties)};`;
    document.cookie = `goal=${goal};`;
    document.cookie = `optimalSolution=${optimalSolution};`;
    document.cookie = `notes=${notes};`;
}

document.addEventListener("readystatechange", () => {
    level = parseInt(getCookieValue("level"));
    var n = parseInt(getCookieValue("n"));
    var m = parseInt(getCookieValue("m"));
    const rows = Math.pow(2, m);
    const columns = Math.pow(2, n);

    const allowedProperties = {};
    getCookieValue("allowedProperties").split(",").forEach(e => {
        allowedProperties[e.replace(/[^0-9a-z:]/gi, '').split(":")[0]] = e.replace(/[^0-9a-z:]/gi, '').split(":")[1] == "true";
    });

    document.getElementById("goal").src = getCookieValue("goal");
    const optimalSolution = parseInt(getCookieValue("optimalSolution"));

    var notes = getCookieValue("notes");
    if (notes == "No notes for this level.") {
        document.getElementById("notes").innerHTML = "";
    } else {
        document.getElementById("notes").innerHTML = notes;
    }

    // set checkboxes
    document.getElementById("commute").checked = allowedProperties["commute"];
    document.getElementById("complement").checked = allowedProperties["complement"];
    document.getElementById("reverse").checked = allowedProperties["reverse"];
    document.getElementById("slice-prefix").checked = allowedProperties["slicePrefix"];
    document.getElementById("slice-suffix").checked = allowedProperties["sliceSuffix"];
    document.getElementById("slice-circumfix").checked = allowedProperties["sliceCircumfix"];

    generateMatrixShell(rows, columns);

    document.querySelector("#fill-matrix").onclick = () => checkSolution(rows, columns, optimalSolution);
    document.querySelector("#clear-matrix").onclick = () => generateMatrixShell(rows, columns);
});

function checkSolution(rows, columns, optimalSolution) {
    fillMatrix(rows, columns);

    var solutionSVGData = table.innerHTML;
    var solutionSVGDataSanitized = solutionSVGData.replace(/ (?:data[^=]+(?:=".*?")|aria[^=]+(?:=".*?"))/gm, ""); // remove any tag starting with the word " data" or " aria"

    fetch(document.getElementById("goal").src)
        .then(response => response.text())
        .then(text => {
            const parsed = new DOMParser().parseFromString(text, 'text/html');
            var goalSVGData = parsed.querySelector('svg').innerHTML;
            var goalSVGDataSanitized = goalSVGData.replace(/ (?:data[^=]+(?:=".*?")|aria[^=]+(?:=".*?"))/gm, ""); // remove any tag starting with the word " data" or " aria"
            goalSVGDataSanitized = goalSVGDataSanitized.match(/.+(?:<\/rect>)/gm)[0]; // remove any junk after document element

            var userSelectedCellCoordinates = userSelectedCells.map(e => ({ x: e.dataset.x, y: e.dataset.y }));
            if (solutionSVGDataSanitized === goalSVGDataSanitized) {
                if (userSelectedCells.length == optimalSolution) {
                    alert("You have found an optimal solution!");
                } else {
                    alert("You have found a solution, but it is not optimal.");
                    if (level >= 13) {
                        generateMatrixShell(rows, columns);
                        for (let i = 0; i < userSelectedCellCoordinates.length; i++) {
                            selectCell(document.querySelector(`rect[data-x="${userSelectedCellCoordinates[i].x}"][data-y="${userSelectedCellCoordinates[i].y}"]`), gradientMap);
                        }
                        document.querySelector("#info-popup").classList.add("hidden");
                    }
                }
            } else {
                alert("Your solution is incorrect. Try again!");
                generateMatrixShell(rows, columns);
                if (level < 22) {
                    for (let i = 0; i < userSelectedCellCoordinates.length; i++) {
                        selectCell(document.querySelector(`rect[data-x="${userSelectedCellCoordinates[i].x}"][data-y="${userSelectedCellCoordinates[i].y}"]`), gradientMap);
                    }
                    document.querySelector("#info-popup").classList.add("hidden");
                }
            }
        });
}

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
        if (window.location.pathname.includes("level-select")) {
            window.open("./matrix-builder.html", "_self");
        } else {
            window.open("./matrix-builder-game-level-select.html", "_self");
        }
    };
}

function getCookieValue(name) {
    const regex = new RegExp(`(^| )${name}=([^;]+)`)
    const match = document.cookie.match(regex)
    if (match) {
        return match[2]
    }
}

window.addEventListener("DOMContentLoaded", attachBackArrow);