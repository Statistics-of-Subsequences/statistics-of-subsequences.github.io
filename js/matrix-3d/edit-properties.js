import { objectModel } from "./matrix-3d.js";
import { generateLCSMemo } from "../LCS.js";

let lcsGenerated = false;
export function isInProgress() { 
    return !lcsGenerated;
}

export function changeMatrix() {
    const lcsButton = document.querySelector("#lcs-button");
    const operationRadio = document.getElementsByName("operation");
    const operationButton = document.querySelector("#operation-button");

    lcsGenerated = false;

    const n = parseInt(document.querySelector("#n").value);
    const m = parseInt(document.querySelector("#m").value);

    // check if n and m are valid
    if (n > 5 || m > 5) {
        console.log("Maximum allowed matrix size is 5x5");
        return;
    }

    // set the legend
    document.querySelector("#gradient-colors").className = "gradient-" + (Math.min(n, m) + 1);
    document.querySelector("#gradient-ticks").innerHTML = '';
    document.querySelector("#gradient-labels").innerHTML = '';

    for(let k = 0; k < Math.min(n, m) + 1; k++) {
        document.querySelector("#gradient-ticks").appendChild(document.createElement("span"));
        document.querySelector("#gradient-ticks").appendChild(document.createElement("span"));
        const index = document.createElement("p");
        index.textContent = k;
        document.querySelector("#gradient-labels").appendChild(index);
    }

    // clear previous LCS information
    document.getElementById("lcs-length").innerHTML = 0;
    document.getElementById("lcs-set").innerHTML = "";
    lcsButton.disabled = true;
    lcsGenerated = false;

    // clear previous operation information
    document.getElementById("new-x").value = "";
    document.getElementById("new-y").value = "";
    document.getElementById("new-length").innerHTML = 0;
    document.getElementById("new-set").innerHTML = "";
    operationRadio[0].checked = true;
    operationRadio[1].disabled = true;
    operationRadio[2].disabled = true;
    document.querySelector("#operation-button").disabled = true;

    // clear substitution box
    const substitutionKBox = document.getElementById("substitution-k-box");
    while (substitutionKBox.firstChild) {
        substitutionKBox.removeChild(substitutionKBox.firstChild);
    }

    // update options for substitution box
    for (let i = 0; i < m; i++) {
        substitutionKBox.options.add(new Option(i, i));
    }
    substitutionKBox.selectedIndex = -1;

    const header = document.querySelector("#permutation-header");
    header.innerHTML = "";
    const permRow = document.querySelector("#permutation-body");
    permRow.innerHTML = "";

    // update options for permutation box
    for (let i = 0; i < m; i++) {
        const headerCell = document.createElement("td");
        const cell = document.createElement("td");

        const headerInput = document.createElement("input");
        headerInput.type = "text";
        headerInput.classList.add("perm-label");
        headerInput.readOnly = true;
        headerInput.value = i;

        const cellInput = document.createElement("select");
        for (let j = 0; j < m; j++) {
            cellInput.add(new Option(j, j));
        }
        cellInput.selectedIndex = -1;

        cellInput.onchange = function () {
            const range = [...permRow.children].map(c => c.firstChild.value).filter((v, i, a) => a.indexOf(v) === i && v !== "");
            operationButton.disabled = range.length !== m;
        };

        headerCell.appendChild(headerInput);
        header.appendChild(headerCell);
        cell.appendChild(cellInput);
        permRow.appendChild(cell);
    }
    
    // reset shader program
    return { updatedPerspective: true, updatedTime: -1.0, updatedAlpha: 0.01 * Math.min(n, m) };
}

export function findFix(xString, yString, n, m) {
    let lcPrefix = 0; // longest common prefix
    let lcCircumfix = 0;
    let lcSuffix = 0; // longest common suffix

    if (xString.length > 0 && yString.length > 0) {
        while (xString.length > 0 && yString.length > 0 && xString[0] == yString[0]) {
            lcPrefix++;
            xString = xString.slice(1);
            yString = yString.slice(1);
        }

        while (xString.length > 0 && yString.length > 0 && xString[xString.length - 1] == yString[yString.length - 1]) {
            lcSuffix++;
            xString = xString.slice(0, -1);
            yString = yString.slice(0, -1);
        }
    }

    if (n == m && lcPrefix == n) {
        lcSuffix = lcPrefix;
        lcCircumfix = lcPrefix;
    }

    return {lcPrefix: lcPrefix, lcCircumfix: lcCircumfix, lcSuffix: lcSuffix };
}

export function changeLCS() {
    const xBox = document.querySelector("#x-box");
    const yBox = document.querySelector("#y-box");
    const lcsMemo = generateLCSMemo(xBox.value, yBox.value);

    // convert from binary string to int
    let x = parseInt(xBox.value, 2);
    let y = parseInt(yBox.value, 2);

    const n = parseInt(document.querySelector("#n").value);
    const m = parseInt(document.querySelector("#m").value);

    // select mesh
    let index = x * Math.pow(2, m) + y;
    objectModel.select(index);

    let lcsLength = lcsMemo[xBox.value.length - 1][yBox.value.length - 1].len;
    let setOfLCSs = lcsMemo[xBox.value.length - 1][yBox.value.length - 1].lcs;

    let lcsLengthLabel = document.getElementById("lcs-length");
    lcsLengthLabel.innerHTML = lcsLength;

    let lcsSetLabel = document.getElementById("lcs-set");
    lcsSetLabel.innerHTML = '';
    for(let lcs of setOfLCSs) {
        if(lcs === "") {
            continue;
        }
        
        const lcsString = document.createElement("p");
        lcsString.textContent = lcs;
        lcsSetLabel.appendChild(lcsString);
    }

    lcsGenerated = true;

    const sliceConcatModeBox = document.querySelector("#slice-concat-mode");
    const operationRadio = document.getElementsByName("operation");
    const operationButton = document.querySelector("#operation-button");
    const substitutionKBox = document.querySelector("#substitution-k-box");
    substitutionKBox.value = "";

    sliceConcatModeBox.options.length = 0;
    document.querySelector("#concat-prefix-wrapper").classList.add("hidden");
    document.querySelector("#concat-suffix-wrapper").classList.add("hidden");
    operationRadio[1].disabled = true;
    operationRadio[2].disabled = true;

    document.getElementById("new-x").value = "";
    document.getElementById("new-y").value = "";
    document.getElementById("new-length").innerHTML = 0;
    document.getElementById("new-set").innerHTML = "";
    operationButton.disabled = true;

    const{ lcPrefix, lcSuffix } = findFix(xBox.value, yBox.value, n, m);

    if (lcPrefix > 0 || lcSuffix > 0) {
        if (lcPrefix > 0) {
            // add prefix as an option to sliceConcatModeBox
            sliceConcatModeBox.add(new Option("Prefix", "prefix"));
        }
        if (lcSuffix > 0) {
            // add suffix as an option to sliceConcatModeBox
            sliceConcatModeBox.add(new Option("Suffix", "suffix"));
        }
        if (lcPrefix > 0 && lcSuffix > 0) {
            // add circumfix as an option to sliceConcatModeBox
            sliceConcatModeBox.add(new Option("Circumfix", "circumfix"));
        }

        sliceConcatModeBox.selectedIndex = -1;

        operationRadio[1].disabled = false;
        operationRadio[2].disabled = false;
    } else {
        operationRadio[0].checked = true;
    }
}

export function permuteChars(str, perm) {
    let newStr = "";
    for (let i = 0; i < str.length; i++) {
        newStr += str[perm[i]];
    }
    return parseInt(newStr, 2);
}

export function performOperation() {
    const xBox = document.querySelector("#x-box");
    const yBox = document.querySelector("#y-box");

    // convert from binary string to int
    let x = parseInt(xBox.value, 2);
    let y = parseInt(yBox.value, 2);

    if(Number.isNaN(x) || Number.isNaN(y)) {
        return;
    }

    const n = parseInt(document.querySelector("#n").value);
    const m = parseInt(document.querySelector("#m").value);
    const operation = document.querySelector("input[name=operation]:checked").value;

    let newX, newY;
    switch(operation) {
        case "substitute":
            newX = x;
            newY = y ^ (1 << (yBox.value.length - 1 - parseInt(document.querySelector("#substitution-k-box").value)));
            break;
        case "permute":
            // convert permutation row to array
            const permRow = document.querySelector("#permutation-body");
            const range = [...permRow.children].map(c => c.firstChild.value);

            newX = x;
            newY = permuteChars(yBox.value, range);
            break;
        case "slice-n-concat":
            let xString = xBox.value;
            let yString = yBox.value;
            let mode = document.querySelector("#slice-concat-mode").value;
            let { lcPrefix, lcSuffix } = findFix(xString, yString, n, m);
            let slicedX, slicedY;
            switch (mode) {
                case "prefix":
                    slicedX = xString.slice(lcPrefix);
                    slicedY = yString.slice(lcPrefix);
                    const prefix = document.getElementById("concat-prefix").value;

                    newX = parseInt(prefix + slicedX, 2);
                    newY = parseInt(prefix + slicedY, 2);
                    break;
                case "suffix":
                    slicedX = xString.slice(0, xString.length - lcSuffix);
                    slicedY = yString.slice(0, yString.length - lcSuffix);
                    const suffix = document.getElementById("concat-suffix").value;

                    newX = parseInt(slicedX + suffix, 2);
                    newY = parseInt(slicedY + suffix, 2);
                    break;
                case "circumfix":
                    const cPrefix = document.getElementById("concat-prefix").value;
                    const cSuffix = document.getElementById("concat-suffix").value;

                    newX = parseInt(cPrefix + xString.slice(lcPrefix, xString.length - lcSuffix) + cSuffix, 2);
                    newY = parseInt(cPrefix + yString.slice(lcPrefix, yString.length - lcSuffix) + cSuffix, 2);
                    break;
                default:
                    throw "Unexpected slice-concat mode...";
            }
            break;
        case "complement":
            newX = x ^ (Math.pow(2, n) - 1);
            newY = y ^ (Math.pow(2, m) - 1);
            break;
        case "reverse":
            newX = parseInt(xBox.value.split("").reverse().join(""), 2);
            newY = parseInt(yBox.value.split("").reverse().join(""), 2);
            break;
        default:
            throw "Unexpected operation requested...";
    }

    let newXBox = newX.toString(2);
    let newYBox = newY.toString(2);

    // pad with zeros
    while (newXBox.length < n) {
        newXBox = "0" + newXBox;
    }
    while (newYBox.length < m) {
        newYBox = "0" + newYBox;
    }

    const lcsMemo = generateLCSMemo(newXBox, newYBox);

    document.getElementById("new-x").value = newXBox;
    document.getElementById("new-y").value = newYBox;

    // select mesh
    let index = newX * Math.pow(2, m) + newY;
    objectModel.selectK(index);

    let lcsLength = objectModel.meshes[index].vertices[0].position[1];
    let setOfLCSs = Array.from(lcsMemo[newXBox.length - 1][newYBox.length - 1].lcs);

    let newLengthLabel = document.getElementById("new-length");
    newLengthLabel.innerHTML = lcsLength;

    let newSetLabel = document.getElementById("new-set");
    newSetLabel.innerHTML = '';
    for(let lcs of setOfLCSs) {
        if(lcs === "") {
            continue;
        }

        const lcsString = document.createElement("p");
        lcsString.textContent = lcs;
        newSetLabel.appendChild(lcsString);
    }
}