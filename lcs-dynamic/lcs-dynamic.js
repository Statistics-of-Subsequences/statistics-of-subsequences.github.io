import { generateSVGTable, fillTable } from './table-render.js';
import { generateLCSMemo, findAllLCS } from './table-calculate.js';

const cellWidth = 50;
const cellHeight = 50;

document.addEventListener("DOMContentLoaded", () => {
    const string1 = document.querySelector("#x-box");
    const string2 = document.querySelector("#y-box");
    string1.oninput = () => {
        generateSVGTable(string1.value, string2.value, cellWidth, cellHeight);
        const memo = generateLCSMemo(string1.value, string2.value);
        fillTable(memo, cellWidth, cellHeight);
        const paths = findAllLCS(string1.value, string2.value, memo);
        createLCSButtons(string1.value, string2.value, paths);
        displayLCSInformation(string1.value, string2.value, paths);
    }
    string2.oninput = string1.oninput;

    generateSVGTable("", "", cellWidth, cellHeight);
});

function createLCSButtons(string1, string2, paths) {
    const lcsResults = document.querySelector("#lcs-results");
    const lcsConfigurations = lcsResults.querySelector("#lcs-configurations");
    const lcsSet = lcsResults.querySelector("#lcs-buttons");
    lcsSet.innerHTML = "";
    
    for (let lcs of paths.keys()) {
        const button = document.createElement("button");
        button.textContent = lcs;
        button.onclick = displayLCSInformation(string1, string2, lcs, paths.get(lcs))
        lcsSet.appendChild(button);
    }
	
	// if there is an lcs, show the configurations
    if (lcsSet.innerHTML !== "") {
        lcsConfigurations.style.display = "block";
        lcsConfigurations.innerHTML = "";
        lcsResults.classList.remove("hidden");
    } else {
        lcsResults.classList.add("hidden");
        lcsConfigurations.style.display = "none";
    }
}

function displayLCSInformation(string1, string2, lcs, lcsPaths) {
    return;
    // clear the configurations
    lcsConfigurations.innerHTML = "<h3>Configurations of \"" + lcs + "\"</h3>";

    // make a table
    var table = document.createElement("table");
    table.setAttribute("border", "0");
    table.setAttribute("cellspacing", "0");
    table.setAttribute("cellpadding", "0");
    table.setAttribute("width", "50%");
    table.setAttribute("height", "100%");

    // add table to the configurations and center it
    lcsConfigurations.appendChild(table);
    lcsConfigurations.setAttribute("align", "center");

    // add header row
    var headerRow = document.createElement("tr");
    table.appendChild(headerRow);

    // add header cells
    var headerCell = document.createElement("th");
    headerCell.innerHTML = "<b>Configurations in \"" + x + "\"</b>";
    headerRow.appendChild(headerCell);

    headerCell = document.createElement("th");
    headerCell.innerHTML = "<b>Configurations in \"" + y + "\"</b>";
    headerRow.appendChild(headerCell);

    // add the configurations
    var configurationsX = configurations(x, lcs);
    var configurationsY = configurations(y, lcs);

    // make another row
    var row = document.createElement("tr");
    table.appendChild(row);

    var xCell = document.createElement("td");
    xCell.setAttribute("valign", "top");
    xCell.setAttribute("align", "center");

    var yCell = document.createElement("td");
    yCell.setAttribute("valign", "top");
    yCell.setAttribute("align", "center");

    for (let configurationX of configurationsX) {
        if (xCell.innerHTML != "") {
            xCell.innerHTML += "<br>";
        }
        xCell.innerHTML += x.split('').map((char, index) => configurationX.includes(index) ? "<span class=\"included\">" + char + "</span>" : char).join('');
    }

    for (let configurationY of configurationsY) {
        if (yCell.innerHTML != "") {
            yCell.innerHTML += "<br>";
        }
        yCell.innerHTML += y.split('').map((char, index) => configurationY.includes(index) ? "<span class=\"included\">" + char + "</span>" : char).join('');
    }

    row.appendChild(xCell);
    row.appendChild(yCell);

    // animate the backtracking
    animateBacktracking(lcs);
}

