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
    let permMap = new Map();

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
    operationRadio[2].disabled = true;
    document.querySelector("#operation-button").disabled = true;

    // clear substitution box
    const substitutionKBox = document.getElementById("substitution-k-box");
    while (substitutionKBox.firstChild) {
        substitutionKBox.removeChild(substitutionKBox.firstChild);
    }

    // update options for substitution box
    for (let i = 0; i < m; i++) {
        substitutionKBox.options[substitutionKBox.options.length] = new Option(i, i);
    }
    substitutionKBox.selectedIndex = -1;

    // clear permutation box
    const permutationBox = document.getElementById("permutation-box");
    while (permutationBox.rows.length > 0) {
        permutationBox.deleteRow(0);
    }

    // update options for permutation box
    let header = permutationBox.insertRow();
    let permRow = permutationBox.insertRow();
    permRow.id = "perm-row";
    for (let i = 0; i < m; i++) {
        let headerCell = header.insertCell();
        let cell = permRow.insertCell();

        let headerInput = document.createElement("input");
        headerInput.type = "text";
        headerInput.id = "index-" + i;
        headerInput.size = 2;
        headerInput.disabled = true;
        headerInput.value = i;

        let cellInput = document.createElement("select");
        cellInput.id = "perm-" + i;

        for (let j = 0; j < m; j++) {
            cellInput.options[cellInput.options.length] = new Option(j, j);
        }
        cellInput.selectedIndex = -1;

        cellInput.onchange = function () {
            // remove the old value from the map
            let oldValue = permMap.get(this.id);
            if (oldValue != undefined) {
                permMap.delete(oldValue);
            }

            // if the new value is already in the map, remove the old key-valuepair
            let values = Array.from(permMap.values());
            let index = values.indexOf(this.value);
            if (index != -1) {
                let key = Array.from(permMap.keys())[index];
                permMap.delete(key);
                document.getElementById(key).selectedIndex = -1;
            }

            // add the new value to the map
            permMap.set(this.id, this.value);

            if (permMap.size == m) {
                operationButton.disabled = false;
            } else {
                operationButton.disabled = true;
            }
        };

        headerCell.appendChild(headerInput);
        cell.appendChild(cellInput);
    }
    
    // reset shader program
    return { updatedPerspective: true, updatedTime: -1.0, updatedAlpha: 0.03 * Math.min(n, m) };
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
    const n = parseInt(document.querySelector("#n").value);
    const m = parseInt(document.querySelector("#m").value);
    if(xBox.value.length !== n) {
        alert("String x must have the same length as the value in input n");
        return;
    } else if(yBox.value.length !== m) {
        alert("String y must have the same length as the value in input m");
        return;
    }

    const lcsMemo = generateLCSMemo(xBox.value, yBox.value);

    // convert from binary string to int
    let x = parseInt(xBox.value, 2);
    let y = parseInt(yBox.value, 2);


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

    let permRow = document.getElementById("perm-row");
    for (let i = 0; i < m; i++) {
        let cell = permRow.cells[i];
        let cellInput = cell.children[0];
        cellInput.value = "";
    }

    while (sliceConcatModeBox.firstChild) {
        sliceConcatModeBox.removeChild(sliceConcatModeBox.firstChild);
    }
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
            sliceConcatModeBox.appendChild(new Option("Prefix", "prefix"));
        }
        if (lcSuffix > 0) {
            // add suffix as an option to sliceConcatModeBox
            sliceConcatModeBox.appendChild(new Option("Suffix", "suffix"));
        }
        if (lcPrefix > 0 && lcSuffix > 0) {
            // add circumfix as an option to sliceConcatModeBox
            sliceConcatModeBox.appendChild(new Option("Circumfix", "circumfix"));
        }

        sliceConcatModeBox.selectedIndex = -1;

        let event = new Event("change");
        sliceConcatModeBox.dispatchEvent(event);

        operationRadio[2].disabled = false;
    } else {
        operationRadio[0].checked = true;
        setOperation();
    }
}

export function setOperation() {
    const operationRadio = document.getElementsByName("operation");
    const operationButton = document.querySelector("#operation-button");
    const permutationBox = document.querySelector("#permutation-box");
    const substitutionKBox = document.querySelector("#substitution-k-box");

    const permutationSection = document.querySelector("#permutation");
    const substitutionSection = document.querySelector("#substitution");
    const sliceConcatSection = document.querySelector("#slice-concat");

    substitutionKBox.value = "";
    permutationBox.value = "";
    operationButton.disabled = true;
    if (operationRadio[0].checked) {
        substitutionSection.style.display = "block";
        permutationSection.style.display = "none";
        sliceConcatSection.style.display = "none";
    } else if (operationRadio[1].checked) {
        substitutionSection.style.display = "none";
        permutationSection.style.display = "block";
        sliceConcatSection.style.display = "none";
    } else if (operationRadio[2].checked) {
        substitutionSection.style.display = "none";
        permutationSection.style.display = "none";
        sliceConcatSection.style.display = "block";
    } else if (operationRadio[3].checked) {
        substitutionSection.style.display = "none";
        permutationSection.style.display = "none";
        sliceConcatSection.style.display = "none";
        operationButton.disabled = false;
    } else if (operationRadio[4].checked) {
        substitutionSection.style.display = "none";
        permutationSection.style.display = "none";
        sliceConcatSection.style.display = "none";
        operationButton.disabled = false;
    }

    document.getElementById("new-x").value = "";
    document.getElementById("new-y").value = "";
    document.getElementById("new-length").innerHTML = 0;
    document.getElementById("new-set").innerHTML = "";
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
    if (operation == "substitute") {
        newX = x;
        newY = y ^ (1 << (yBox.value.length - 1 - parseInt(document.querySelector("#substitution-k-box").value)));
    } else if (operation == "permutation") {
        // convert permutation row to array
        let perm = [];
        for (let i = 0; i < m; i++) {
            let cell = document.getElementById("perm-" + i);
            perm.push(cell.value);
        }

        newX = x;
        newY = permuteChars(yBox.value, perm);
    } else if (operation == "slice-n-concat") {
        let xString = xBox.value;
        let yString = yBox.value;
        let mode = document.querySelector("#slice-concat-mode").value;
        let { lcPrefix, lcSuffix } = findFix(xString, yString, n, m);

        if (mode == "prefix") {
            let slicedX = xString.slice(lcPrefix);
            let slicedY = yString.slice(lcPrefix);
            let prefix = document.getElementById("prefix-box").value;

            newX = parseInt(prefix + slicedX, 2);
            newY = parseInt(prefix + slicedY, 2);
        } else if (mode == "suffix") {
            let slicedX = xString.slice(0, xString.length - lcSuffix);
            let slicedY = yString.slice(0, yString.length - lcSuffix);
            let suffix = document.getElementById("suffix-box").value;

            newX = parseInt(slicedX + suffix, 2);
            newY = parseInt(slicedY + suffix, 2);
        } else if (mode == "circumfix") {
            let prefix = document.getElementById("prefix-box").value;
            let suffix = document.getElementById("suffix-box").value;

            newX = parseInt(prefix + xString.slice(lcPrefix, xString.length - lcSuffix) + suffix, 2);
            newY = parseInt(prefix + yString.slice(lcPrefix, yString.length - lcSuffix) + suffix, 2);
        }
    } else if (operation == "complement") {
        newX = x ^ (Math.pow(2, n) - 1);
        newY = y ^ (Math.pow(2, m) - 1);
    } else if (operation == "reverse") {
        newX = parseInt(xBox.value.split("").reverse().join(""), 2);
        newY = parseInt(yBox.value.split("").reverse().join(""), 2);
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