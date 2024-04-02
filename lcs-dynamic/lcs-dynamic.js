import { generateSVGTable, fillTable } from './table-render.js';
import { generateLCSMemo, findOccurences } from '../LCS.js';
import { setString1Path, setString2Path, animateBacktracking } from './table-animate.js';

const cellWidth = 50;
const cellHeight = 50;

document.addEventListener("DOMContentLoaded",  () => {
    const string1 = document.querySelector("#x-box");
    const string2 = document.querySelector("#y-box");
    string1.oninput = async () => {
        setString1Path([]);
        setString2Path([]);
        generateSVGTable(string1.value, string2.value, cellWidth, cellHeight);
        const memo = generateLCSMemo(string1.value, string2.value);
        fillTable(memo, cellWidth, cellHeight);
        createLCSButtons(string1.value, string2.value, memo);
    }
    string2.oninput = string1.oninput;

    generateSVGTable("", "", cellWidth, cellHeight);
});

function createLCSButtons(string1, string2, memo) {
    const lcsResults = document.querySelector("#lcs-results");
    const lcsConfigurations = lcsResults.querySelector("#lcs-configurations");
    const lcsSet = lcsResults.querySelector("#lcs-buttons");
    lcsSet.innerHTML = "";
    lcsConfigurations.classList.add("hidden");
    
    if(string1.length > 0 && string2.length > 0 && memo[string1.length - 1][string2.length - 1].lcs.length > 0) {
        for (let lcs of memo[string1.length - 1][string2.length - 1].lcs) {
            const button = document.createElement("button");
            button.textContent = lcs;
            button.onclick = () => {
                displayLCSInformation(string1, string2, lcs);
                lcsConfigurations.classList.remove("hidden");
            };
            lcsSet.appendChild(button);
        }

        lcsResults.classList.remove("hidden");
    } else {
        lcsResults.classList.add("hidden");
    }
}

let selectedX, selectedY;
function displayLCSInformation(string1, string2, lcs) {
    document.querySelector("#lcs-config-string").textContent = `Configurations of "${lcs}"`;
    const tableBody = document.querySelector("#lcs-config-table").querySelector("tbody");
    tableBody.innerHTML = '';
    document.querySelector("#string1-config").textContent = `Configurations in "${string1}"`;
    document.querySelector("#string2-config").textContent = `Configurations in "${string2}"`;

    const string1Subsequences = findOccurences(string1, lcs).filter(s => s.pop());
    const string2Subsequences = findOccurences(string2, lcs).filter(s => s.pop());
    const sequences = Array(Math.max(string1Subsequences.length, string2Subsequences.length))
                        .fill()
                        .map((_,i) => {return {x: string1Subsequences[i], y: string2Subsequences[i]}});

    for (let rowData of sequences) {
        const row = document.createElement("tr");

        const xWordWrapper = document.createElement("div");
        if(rowData.x) {
            for(let x = 0; x < string1.length; x++) {
                const letter = document.createElement("p");
                letter.textContent = string1[x];
                if(rowData.x[x] > 0) {
                    letter.classList.add("included");
                }
                xWordWrapper.appendChild(letter);
                xWordWrapper.onclick = () => {
                    if(selectedX) {
                        if(selectedX === xWordWrapper) {
                            return;
                        }

                        selectedX.classList.remove("selected");
                    }

                    xWordWrapper.classList.add("selected");
                    selectedX = xWordWrapper;
                    setString1Path(rowData.x);
                    animateBacktracking();
                }
            }
        }
        const xEntry = document.createElement("td");
        xEntry.appendChild(xWordWrapper);
        row.appendChild(xEntry);

        const yWordWrapper = document.createElement("div");
        if(rowData.y) {
            for(let y = 0; y < string2.length; y++) {
                const letter = document.createElement("p");
                letter.textContent = string2[y];
                if(rowData.y[y] > 0) {
                    letter.classList.add("included");
                }
                yWordWrapper.appendChild(letter);
                yWordWrapper.onclick = () => {
                    if(selectedY) {
                        if(selectedY === yWordWrapper) {
                            return;
                        }
                        
                        selectedY.classList.remove("selected");
                    }

                    yWordWrapper.classList.add("selected");
                    selectedY = yWordWrapper;
                    setString2Path(rowData.y);
                    animateBacktracking();
                }
            }
        }
        const yEntry = document.createElement("td");
        yEntry.appendChild(yWordWrapper);
        row.appendChild(yEntry);

        tableBody.appendChild(row);
    }
}