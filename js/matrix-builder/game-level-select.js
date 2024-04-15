import { startLevel } from "./game.js";
var levelsData;

async function loadJSON() {
    // load json file asynchronusly
    const jsonResponse = await fetch("../res/levelData.json");
    var json = await jsonResponse.text();
    // return the <value> of the json file
    levelsData = JSON.parse(json);
}

window.addEventListener("DOMContentLoaded", () => {
    document.cookie = "page=2;";
    levelsData = loadJSON();
    
    // get all buttons
    let buttons = document.querySelectorAll("#level-select button");

    // attach event listener to each button
    buttons.forEach(button => {
        button.addEventListener("click", function () {
            // get the level number
            let level = parseInt(this.innerHTML.split(" ")[1]);

            // get the level data
            var n = levelsData[level].n;
            var m = levelsData[level].m;
            var allowedProperties = levelsData[level].allowedProperties;
            var goal = "../res/graphics/level-" + level + ".svg";
            var optimalSolution = levelsData[level].optimalSolution;
            var notes = levelsData[level].notes;

            // start the level
                startLevel(level, n, m, allowedProperties, goal, optimalSolution, notes);
        });
    });
});