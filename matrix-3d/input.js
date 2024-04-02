import { setLegend } from "./legend.js";

export function changeMatrix(onMobile) {
    const lcsButton = document.querySelector("#lcs-button");
    const operationRadio = document.getElementsByName("operation");

    let lcsGenerated = false;
    let permMap = new Map();

    const n = parseInt(document.querySelector("#n").value);
    const m = parseInt(document.querySelector("#m").value);

    // check if n and m are valid
    if (n > 5 || m > 5) {
        var answer = confirm("Larger models may take longer than usual to render.\nWould you like to continue?");
        if (!answer) {
            return;
        }
    }

    // set the legend
    setLegend(onMobile);

    // clear previous LCS information
    document.querySelector("#x-box").value = "";
    document.querySelector("#y-box").value = "";
    document.getElementById("lcs-length").innerHTML = "Length of Longest Common Subsequence: 0";
    document.getElementById("lcs-set").innerHTML = "Set of Longest Common Subsequences: {}";
    lcsButton.disabled = true;
    lcsGenerated = false;

    // clear previous operation information
    document.getElementById("new-x").value = "";
    document.getElementById("new-y").value = "";
    document.getElementById("new-length").innerHTML = "Length of Longest Common Subsequence: 0";
    document.getElementById("new-set").innerHTML = "Set of Longest Common Subsequences: {}";
    operationRadio[0].checked = true;
    operationRadio[2].disabled = true;
    document.querySelector("#operation-button").disabled = true;

    // clear substitution box
    const substitutionKBox = document.getElementById("substitution-k-box");
    while (substitutionKBox.firstChild) {
        substitutionKBox.removeChild(substitutionKBox.firstChild);
    }

    // update options for substitution box
    for (var i = 0; i < m; i++) {
        substitutionKBox.options[substitutionKBox.options.length] = new Option(i, i);
    }
    substitutionKBox.selectedIndex = -1;

    // clear permutation box
    const permutationBox = document.getElementById("permutation-box");
    while (permutationBox.rows.length > 0) {
        permutationBox.deleteRow(0);
    }

    // update options for permutation box
    var header = permutationBox.insertRow();
    var permRow = permutationBox.insertRow();
    permRow.id = "perm-row";
    for (var i = 0; i < m; i++) {
        var headerCell = header.insertCell();
        var cell = permRow.insertCell();

        var headerInput = document.createElement("input");
        headerInput.type = "text";
        headerInput.id = "index-" + i;
        headerInput.size = 2;
        headerInput.disabled = true;
        headerInput.value = i;

        var cellInput = document.createElement("select");
        cellInput.id = "perm-" + i;

        for (var j = 0; j < m; j++) {
            cellInput.options[cellInput.options.length] = new Option(j, j);
        }
        cellInput.selectedIndex = -1;

        cellInput.onchange = function () {
            // remove the old value from the map
            var oldValue = permMap.get(this.id);
            if (oldValue != undefined) {
                permMap.delete(oldValue);
            }

            // if the new value is already in the map, remove the old key-valuepair
            var values = Array.from(permMap.values());
            var index = values.indexOf(this.value);
            if (index != -1) {
                var key = Array.from(permMap.keys())[index];
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
        }

        headerCell.appendChild(headerInput);
        cell.appendChild(cellInput);
    }
    
    // reset shader program
    let isPerspective = true;
    let time = -1.0;
    let alpha = 0.01 * Math.min(n, m);
}

export function changeLCS() {
    const lcsMemo = generateLCSMemo(xBox.value, yBox.value);

    // convert from binary string to int
    var x = parseInt(xBox.value, 2);
    var y = parseInt(yBox.value, 2);

    // select mesh
    var index = x * Math.pow(2, m) + y;
    objectModel.select(index);

    var lcsLength = objectModel.meshes[index].vertices[0].position[1];
    var setOfLCSs = lcsMemo[xBox.value.length - 1][yBox.value.length - 1].lcs;

    var lcsLengthLabel = document.getElementById("lcs-length");
    lcsLengthLabel.innerHTML = "Length of Longest Common Subsequence: " + lcsLength;

    var lcsSetLabel = document.getElementById("lcs-set");
    lcsSetLabel.innerHTML = "Set of Longest Common Subsequences: {" + setOfLCSs + "}";

    lcsGenerated = true;
    substitutionKBox.value = "";

    var permRow = document.getElementById("perm-row");
    for (var i = 0; i < m; i++) {
        var cell = permRow.cells[i];
        var cellInput = cell.children[0];
        cellInput.value = "";
    }

    while (sliceConcatModeBox.firstChild) {
        sliceConcatModeBox.removeChild(sliceConcatModeBox.firstChild);
    }
    operationRadio[2].disabled = true;

    document.getElementById("new-x").value = "";
    document.getElementById("new-y").value = "";
    document.getElementById("new-length").innerHTML = "Length of Longest Common Subsequence: 0";
    document.getElementById("new-set").innerHTML = "Set of Longest Common Subsequences: {}";
    operationButton.disabled = true;

    // find lcPrefix and lcSuffix
    var xString = xBox.value;
    var yString = yBox.value;

    lcPrefix = 0; // longest common prefix
    lcSuffix = 0; // longest common suffix

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
    } else {
        lcCircumfix = 0;
    }

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

        var event = new Event("change");
        sliceConcatModeBox.dispatchEvent(event);

        operationRadio[2].disabled = false;
    } else {
        operationRadio[0].checked = true;
        setOperation();
    }
}

export function setOperation() {
    substitutionKBox.value = "";
    permutationBox.value = "";
    operationButton.disabled = true;
    if (operationRadio[0].checked) {
        operation = "substitute";
        substitutionSection.style.display = "block";
        permutationSection.style.display = "none";
        sliceConcatSection.style.display = "none";
    } else if (operationRadio[1].checked) {
        operation = "permutation";
        substitutionSection.style.display = "none";
        permutationSection.style.display = "block";
        sliceConcatSection.style.display = "none";
    } else if (operationRadio[2].checked) {
        operation = "slice-n-concat";
        substitutionSection.style.display = "none";
        permutationSection.style.display = "none";
        sliceConcatSection.style.display = "block";
    } else if (operationRadio[3].checked) {
        operation = "complement";
        substitutionSection.style.display = "none";
        permutationSection.style.display = "none";
        sliceConcatSection.style.display = "none";
        operationButton.disabled = false;
    } else if (operationRadio[4].checked) {
        operation = "reverse";
        substitutionSection.style.display = "none";
        permutationSection.style.display = "none";
        sliceConcatSection.style.display = "none";
        operationButton.disabled = false;
    }

    document.getElementById("new-x").value = "";
    document.getElementById("new-y").value = "";
    document.getElementById("new-length").innerHTML = "Length of Longest Common Subsequence: 0";
    document.getElementById("new-set").innerHTML = "Set of Longest Common Subsequences: {}";
}

export function permuteChars(str, perm) {
    var newStr = "";
    for (var i = 0; i < str.length; i++) {
        newStr += str[perm[i]];
    }
    return parseInt(newStr, 2);
}