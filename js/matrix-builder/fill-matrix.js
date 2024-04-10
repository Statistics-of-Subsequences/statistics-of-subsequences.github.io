export default function fillMatrix(rows, columns) {
    let queue = [];
    for (let cell of document.querySelector("#table").querySelectorAll("rect[aria-selected=true]")) {
        queue.push(cell);
    }

    const applyCommutative = document.querySelector("#commute").checked;
    const applyComplement = document.querySelector("#complement").checked;
    const applyReverse = document.querySelector("#reverse").checked;
    const applyPrefix = document.querySelector("#slice-prefix").checked;
    const applySuffix = document.querySelector("#slice-suffix").checked;
    const applyCircumfix = document.querySelector("#slice-circumfix").checked;
    
    while (queue.length > 0) {
        // get the row and column of the cell
        let currentCell = queue.shift();
        let row = parseInt(currentCell.dataset.x) + 1;
        let column = parseInt(currentCell.dataset.y) + 1;
        
        const commutativeCell = applyCommutative && applyCommutativeProperty(currentCell, rows, columns);
        commutativeCell && queue.push(commutativeCell);

        const complementCell = applyComplement && applyComplementProperty(currentCell, rows, columns);
        complementCell && queue.push(complementCell);

        const reverseCell = applyReverse && applyReverseProperty(currentCell);
        reverseCell && queue.push(reverseCell);

        // slice and concatenation property
        if (applyPrefix || applySuffix || applyCircumfix) {
            let rowBinary = currentCell.dataset.xString;
            let columnBinary = currentCell.dataset.yString;
            
            let lcPrefix = 0; // longest common prefix
            while (rowBinary.length > 0 && columnBinary.length > 0 && rowBinary[0] === columnBinary[0]) {
                lcPrefix++;
                rowBinary = rowBinary.substring(1);
                columnBinary = columnBinary.substring(1);
            }

            let lcSuffix = 0; // longest common suffix
            while (rowBinary.length > 0 && columnBinary.length > 0 && rowBinary[rowBinary.length - 1] === columnBinary[columnBinary.length - 1]) {
                lcSuffix++;
                rowBinary = rowBinary.substring(0, rowBinary.length - 1);
                columnBinary = columnBinary.substring(0, columnBinary.length - 1);
            }

            // In diagonal, prefix === suffix === circumfix, so if prefix is hogging substring but isn't being used, switch to -ix being used
            if (row === column && !applyPrefix && applySuffix) {
                lcSuffix = lcPrefix;
                lcPrefix = 0;
            } else if (row === column && !applyPrefix && applyCircumfix) {
                lcSuffix = Math.floor(lcPrefix / 2);
                lcPrefix = Math.ceil(lcPrefix / 2);
            }

            const prefixCells = applyPrefix && lcPrefix && applyPrefixProperty(currentCell, lcPrefix);
            if(prefixCells) {
                queue = [...queue, ...prefixCells];
            }

            const suffixCells = applySuffix && lcSuffix && applySuffixProperty(currentCell, rows, columns, lcSuffix);
            if(suffixCells) {
                queue = [...queue, ...prefixCells];
            }

            applyCircumfix && lcPrefix && lcSuffix && applyCircumfixProperty(currentCell, lcPrefix, lcSuffix, lcCircumfix);
        }
    }
}

function applyCommutativeProperty(cell, rows, columns) {
    if (rows === columns) {
        let commutativeCell = document.querySelector(`#table rect[data-x='${cell.dataset.y}'][data-y='${cell.dataset.x}']`);
        if (commutativeCell.dataset.length === "Unknown") {
            commutativeCell.dataset.length = cell.dataset.length;
            commutativeCell.dataset.derivation = `Commutes with ${cell.dataset.xString} and ${cell.dataset.yString}`;
            commutativeCell.setAttributeNS(null, "fill", cell.getAttributeNS(null, "fill"));
            return commutativeCell;
        }
    }
}

function applyComplementProperty(cell, rows, columns) {
    const compRow = rows - 1 - cell.dataset.x;
    const compCol = columns - 1 - cell.dataset.y;
    const complementCell = document.querySelector(`#table rect[data-x='${compRow}'][data-y='${compCol}']`);

    if (complementCell.dataset.length == "Unknown") {
        complementCell.dataset.length = cell.dataset.length;
        complementCell.dataset.derivation = `Complement of ${cell.dataset.xString} and ${cell.dataset.yString}`;
        complementCell.setAttributeNS(null, "fill", cell.getAttributeNS(null, "fill"));
        return complementCell;
    }
}

function applyReverseProperty(cell) {
    const revRow = cell.dataset.xString.split("").reverse().join("");
    const revCol = cell.dataset.yString.split("").reverse().join("");
    const reverseCell = document.querySelector(`#table rect[data-x-string='${revRow}'][data-y-string='${revCol}']`);

    if (reverseCell.dataset.length == "Unknown") {
        reverseCell.dataset.length = cell.dataset.length;
        reverseCell.dataset.derivation = `Reverse of ${cell.dataset.xString} and ${cell.dataset.yString}`;
        reverseCell.setAttributeNS(null, "fill", cell.getAttributeNS(null, "fill"));
        return reverseCell;
    }
}

function applyPrefixProperty(cell, lcPrefix) {
    const xSlice = cell.dataset.xString.substring(lcPrefix);
    const ySlice = cell.dataset.yString.substring(lcPrefix);
    let toSearch = [];

    // Iterate through every possible prefix
    for (let PREFIX = 0; PREFIX < Math.pow(2, lcPrefix); PREFIX++) {
        let prefixString = PREFIX.toString(2).padStart(lcPrefix, "0");
        const concatCell = document.querySelector(`#table rect[data-x-string='${prefixString}${xSlice}'][data-y-string='${prefixString}${ySlice}']`);

        if (concatCell.dataset.length == "Unknown") {
            concatCell.dataset.length = cell.dataset.length;
            concatCell.dataset.derivation = `Slices [${lcPrefix}〉 from ${cell.dataset.xString} and ${cell.dataset.yString}<br>Prefixes with ${prefixString}`;
            concatCell.setAttributeNS(null, "fill", cell.getAttributeNS(null, "fill"));
            toSearch.push(concatCell);
        }
    }

    return toSearch;
}

function applySuffixProperty(cell, rows, columns, lcSuffix) {
    const xSlice = cell.dataset.xString.substring(0, cell.dataset.xString.length - 1 - lcSuffix);
    const ySlice = cell.dataset.yString.substring(0, cell.dataset.xString.length - 1 - lcSuffix);
    let toSearch = [];

    for (let SUFFIX = 0; SUFFIX < Math.pow(2, lcSuffix); SUFFIX++) {
        let suffixString = SUFFIX.toString(2).padStart(lcSuffix, "0");

        console.log(`${xSlice}${suffixString}`);
        console.log(`${ySlice}${suffixString}`);
        const concatCell = document.querySelector(`#table rect[data-x-string='${xSlice}${suffixString}'][data-y-string='${ySlice}${suffixString}']`);
        if (concatCell.dataset.length === "Unknown") {
            concatCell.dataset.length = cell.dataset.length;
            if(rows === columns) {
                concatCell.dataset.derivation = `Slices [0, ${lcSuffix}〉 from ${cell.dataset.xString} and ${cell.dataset.yString}<br>Suffixes with ${suffixString}`;
            } else {
                concatCell.dataset.derivation = `Slices [0, ${rows - lcSuffix}) from ${cell.dataset.xString} and [0, ${columns - lcSuffix}) ${cell.dataset.yString}<br>Suffixes with ${suffixString}`;
            }
            concatCell.setAttributeNS(null, "fill", cell.getAttributeNS(null, "fill"));
            toSearch.push(concatCell);
        }
    }
}

function applyCircumfixProperty(cell) {
    for (let PREFIX = 0; PREFIX < Math.pow(2, lcPrefix); PREFIX++) {
        for (let SUFFIX = 0; SUFFIX < Math.pow(2, lcSuffix); SUFFIX++) {
            let r = "0".repeat(lcPrefix - PREFIX.toString(2).length).concat(PREFIX.toString(2));
            let c = "0".repeat(lcSuffix - SUFFIX.toString(2).length).concat(SUFFIX.toString(2));

            let newRow = parseInt(r.toString(2).concat(remainingRowCircumfix).concat(c.toString(2)), 2);
            let newColumn = parseInt(r.toString(2).concat(remainingColumnCircumfix).concat(c.toString(2)), 2);

            let concatCell = infoMatrix[rows - 1 - newRow][newColumn];
            if (concatCell.length == "Unknown") {
                infoMatrix[rows - 1 - newRow][newColumn].length = currentCell.length;
                if (rows == columns) {
                    infoMatrix[rows - 1 - newRow][newColumn].derivation = "Slices [" + lcPrefix + ", " + (nBox.value - lcSuffix) + ") from " + intToBinStr(column, nBox.value) + " and " + intToBinStr(row, mBox.value) + "<br/>Prefixes with " + intToBinStr(PREFIX, lcPrefix) + "</br>Suffixes with " + intToBinStr(SUFFIX, lcSuffix);
                } else {
                    infoMatrix[rows - 1 - newRow][newColumn].derivation = "Slices [" + lcPrefix + ", " + (nBox.value - lcSuffix) + ") from " + intToBinStr(column, nBox.value) + " and [" + lcPrefix + ", " + (mBox.value - lcSuffix) + ") from " + intToBinStr(row, mBox.value) + "<br/>Prefixes with " + intToBinStr(PREFIX, lcPrefix) + "</br>Suffixes with " + intToBinStr(SUFFIX, lcSuffix);
                }
                concatCell.cell.setAttribute("fill", currentCell.cell.getAttribute("fill"));
                selectedCells.push(concatCell);
                queue.push(concatCell);

                // commutative property
                if (rows == columns && allowedProperties["commute"]) {
                    let commutativeCell = infoMatrix[rows - 1 - newColumn][newRow];
                    if (commutativeCell.length == "Unknown") {
                        infoMatrix[rows - 1 - newColumn][newRow].length = currentCell.length;
                        infoMatrix[rows - 1 - newColumn][newRow].derivation = "Commutes with " + intToBinStr(newColumn, nBox.value) + " and " + intToBinStr(newRow, mBox.value);
                        commutativeCell.cell.setAttribute("fill", currentCell.cell.getAttribute("fill"));
                        selectedCells.push(commutativeCell);
                        queue.push(commutativeCell);
                    }
                }
            }
        }
    }
}