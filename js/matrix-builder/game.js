import { generateMatrixShell } from "./generate-matrix.js";
import fillMatrix from "./fill-matrix.js";
import getSortedLevels from "./level.js";

function loadLevelData(level) {
    const rows = Math.pow(2, level.m);
    const columns = Math.pow(2, level.n);

    document.getElementById("goal").src = level.goal;
    const optimalSolution = level.optimalSolution;

    // set checkboxes
    document.getElementById("commute").checked = level.allowedProperties.commute;
    document.getElementById("complement").checked = level.allowedProperties.complement;
    document.getElementById("reverse").checked = level.allowedProperties.reverse;
    document.getElementById("slice-prefix").checked = level.allowedProperties.slicePrefix;
    document.getElementById("slice-suffix").checked = level.allowedProperties.sliceSuffix;
    document.getElementById("slice-circumfix").checked = level.allowedProperties.sliceCircumfix;

    generateMatrixShell(rows, columns);

    document.querySelector("#fill-matrix").onclick = () => checkSolution(rows, columns, optimalSolution);
    document.querySelector("#clear-matrix").onclick = () => generateMatrixShell(rows, columns);
}

function checkSolution(rows, columns, optimalSolution) {
    fillMatrix(rows, columns);

    // current checking method does not work
    // maybe compare the rect colors instead?

    var solutionSVGData = table.innerHTML;
    fetch(document.getElementById("goal").src)
        .then(response => response.text())
        .then(text => {
            const parsed = new DOMParser().parseFromString(text, 'text/html');
            var goalSVGData = parsed.querySelector('svg').innerHTML;
            if (solutionSVGData == goalSVGData) {
                if (currentSolution == optimalSolution) {
                    alert("You have found an optimal solution!");
                } else {
                    alert("You have found a solution, but it is not optimal.");
                }
            } else {
                alert("Your solution is incorrect. Try again!");
                generateMatrixShell(rows, columns);
            }
        });
}

window.addEventListener("DOMContentLoaded", async () => {
    document.querySelector("#back-button").onclick = () => {
        window.open("../../matrix-builder-game-level-select.html", "_self");
    };

    const params = new URLSearchParams(document.location.search);
    const levelNum = parseInt(params.get("id"));

    document.querySelector("#game-label").textContent = `Level ${levelNum + 1}`;

    const levels = await getSortedLevels();
    loadLevelData(levels[parseInt(levelNum)]);
});