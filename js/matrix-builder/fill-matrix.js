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
            console.log("NOW CHECKING FOR " + currentCell.dataset.xString + " and " + currentCell.dataset.yString);
            let rowBinary = currentCell.dataset.xString;
            let columnBinary = currentCell.dataset.yString;
            
            var tempRowBinary = rowBinary;
            var tempColumnBinary = columnBinary;

            let lcPrefix = 0; // longest common prefix
            while (tempRowBinary.length > 0 && tempColumnBinary.length > 0 && tempRowBinary[0] === tempColumnBinary[0]) {
                lcPrefix++;
                tempRowBinary = tempRowBinary.slice(1);
                tempColumnBinary = tempColumnBinary.slice(1);
            }

            var tempRowBinary = rowBinary;
            var tempColumnBinary = columnBinary;

            let lcSuffix = 0; // longest common suffix
            while (tempRowBinary.length > 0 && tempColumnBinary.length > 0 && tempRowBinary[tempRowBinary.length - 1] === tempColumnBinary[tempColumnBinary.length - 1]) {
                lcSuffix++;
                tempRowBinary = tempRowBinary.slice(0, -1);
                tempColumnBinary = tempColumnBinary.slice(0, -1);
            }

            // In diagonal, prefix === suffix === circumfix, so if prefix is hogging slice but isn't being used, switch to -ix being used
            let alreadyCompletedCircumfix = false;
            if (lcPrefix + lcSuffix >= Math.min(rowBinary.length, columnBinary.length)) {
                if (applyPrefix && lcPrefix == lcSuffix) {
                    lcSuffix = 0;
                } else if (!applyPrefix && applySuffix && lcPrefix == lcSuffix) {
                    lcPrefix = 0;
                }
                if (applyCircumfix) {
                    let lcPrefixes;
                    if (lcPrefix == lcSuffix && lcPrefix == Math.min(rowBinary.length, columnBinary.length)) {
                        lcPrefixes = Array.from({ length: lcPrefix - 1 }, (_, i) => i + 1);
                    } else {
                        lcPrefixes = Array.from({ length: Math.min(lcPrefix, lcSuffix) }, (_, i) => i + 1);
                    }
                    
                    for (let i = 0; i < lcPrefixes.length; i++) {
                        let prefix = lcPrefixes[i];
                        let suffix = lcPrefixes[lcPrefixes.length - 1 - i];
                        const extraCircumfixCells = applyCircumfix && Math.min(rowBinary.length, columnBinary.length) > 1 && prefix && suffix && applyCircumfixProperty(currentCell, rows, columns, prefix, suffix);
                        if (extraCircumfixCells) {
                            queue = [...queue, ...extraCircumfixCells];
                        }
                    }

                    alreadyCompletedCircumfix = true;
                }
            }

            const prefixCells = applyPrefix && lcPrefix && applyPrefixProperty(currentCell, lcPrefix);
            if(prefixCells) {
                queue = [...queue, ...prefixCells];
            }

            const suffixCells = applySuffix && lcSuffix && applySuffixProperty(currentCell, rows, columns, lcSuffix);
            if(suffixCells) {
                queue = [...queue, ...suffixCells];
            }

            if (!alreadyCompletedCircumfix) {
                const circumfixCells = applyCircumfix && Math.min(rowBinary.length, columnBinary.length) > 1 && lcPrefix && lcSuffix && applyCircumfixProperty(currentCell, rows, columns, lcPrefix, lcSuffix);
                if (circumfixCells) {
                    queue = [...queue, ...circumfixCells];
                }
            }
        }
    }
}

function applyCommutativeProperty(cell, rows, columns) {
    if (rows === columns) {
        let commutativeCell = document.querySelector(`#table rect[data-x='${cell.dataset.y}'][data-y='${cell.dataset.x}']`);
        if (commutativeCell.dataset.length === "Unknown") {
            commutativeCell.dataset.length = cell.dataset.length;
            commutativeCell.dataset.derivation = `Commutes with ${cell.dataset.xString} and ${cell.dataset.yString}`;
            commutativeCell.ariaSelected = "true";
            commutativeCell.setAttributeNS(null, "fill", cell.getAttributeNS(null, "fill"));
            return commutativeCell;
        }
    }
}

function applyComplementProperty(cell, rows, columns) {
    const compRow = rows - 1 - cell.dataset.y;
    const compCol = columns - 1 - cell.dataset.x;
    const complementCell = document.querySelector(`#table rect[data-x='${compCol}'][data-y='${compRow}']`);

    if (complementCell.dataset.length == "Unknown") {
        complementCell.dataset.length = cell.dataset.length;
        complementCell.dataset.derivation = `Complement of ${cell.dataset.xString} and ${cell.dataset.yString}`;
        complementCell.ariaSelected = "true";
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
        reverseCell.ariaSelected = "true";
        reverseCell.setAttributeNS(null, "fill", cell.getAttributeNS(null, "fill"));
        return reverseCell;
    }
}

function applyPrefixProperty(cell, lcPrefix) {
    const xSlice = cell.dataset.xString.slice(lcPrefix);
    const ySlice = cell.dataset.yString.slice(lcPrefix);
    let toSearch = [];

    // Iterate through every possible prefix
    for (let PREFIX = 0; PREFIX < Math.pow(2, lcPrefix); PREFIX++) {
        let prefixString = PREFIX.toString(2).padStart(lcPrefix, "0");
        const concatCell = document.querySelector(`#table rect[data-x-string='${prefixString}${xSlice}'][data-y-string='${prefixString}${ySlice}']`);

        if (concatCell.dataset.length == "Unknown") {
            concatCell.dataset.length = cell.dataset.length;
            concatCell.dataset.derivation = `Slices [${lcPrefix}〉 from ${cell.dataset.xString} and ${cell.dataset.yString}<br>Prefixes with ${prefixString}`;
            concatCell.ariaSelected = "true"; 
            concatCell.setAttributeNS(null, "fill", cell.getAttributeNS(null, "fill"));
            toSearch.push(concatCell);
        }
    }

    return toSearch;
}

function applySuffixProperty(cell, rows, columns, lcSuffix) {
    const xSlice = cell.dataset.xString.slice(0, cell.dataset.xString.length - lcSuffix);
    const ySlice = cell.dataset.yString.slice(0, cell.dataset.yString.length - lcSuffix);
    let toSearch = [];

    for (let SUFFIX = 0; SUFFIX < Math.pow(2, lcSuffix); SUFFIX++) {
        let suffixString = SUFFIX.toString(2).padStart(lcSuffix, "0");
        const concatCell = document.querySelector(`#table rect[data-x-string='${xSlice}${suffixString}'][data-y-string='${ySlice}${suffixString}']`);
        
        if (concatCell.dataset.length === "Unknown") {
            concatCell.dataset.length = cell.dataset.length;
            if(rows === columns) {
                concatCell.dataset.derivation = `Slices [0, ${lcSuffix}〉 from ${cell.dataset.xString} and ${cell.dataset.yString}<br>Suffixes with ${suffixString}`;
            } else {
                concatCell.dataset.derivation = `Slices [0, ${Math.log2(columns) - lcSuffix}) from ${cell.dataset.xString} and [0, ${Math.log2(rows) - lcSuffix}) from ${cell.dataset.yString}<br>Suffixes with ${suffixString}`;
            }
            concatCell.ariaSelected = "true"; 
            concatCell.setAttributeNS(null, "fill", cell.getAttributeNS(null, "fill"));
            toSearch.push(concatCell);
        }
    }

    return toSearch;
}

function applyCircumfixProperty(cell, rows, columns, lcPrefix, lcSuffix) {
    const xSlice = cell.dataset.xString.slice(0, cell.dataset.xString.length - lcSuffix).slice(lcPrefix);
    const ySlice = cell.dataset.yString.slice(0, cell.dataset.yString.length - lcSuffix).slice(lcPrefix);
    let toSearch = [];

    for (let PREFIX = 0; PREFIX < Math.pow(2, lcPrefix); PREFIX++) {
        for (let SUFFIX = 0; SUFFIX < Math.pow(2, lcSuffix); SUFFIX++) {
            let prefixString = PREFIX.toString(2).padStart(lcPrefix, "0");
            let suffixString = SUFFIX.toString(2).padStart(lcSuffix, "0");
            const concatCell = document.querySelector(`#table rect[data-x-string='${prefixString}${xSlice}${suffixString}'][data-y-string='${prefixString}${ySlice}${suffixString}']`);

            if (concatCell.dataset.length == "Unknown") {
                concatCell.dataset.length = cell.dataset.length;
                if(rows === columns) {
                    concatCell.dataset.derivation = `Slices [${lcPrefix}, ${lcSuffix}〉 from ${cell.dataset.xString} and ${cell.dataset.yString}<br>Prefixes with ${prefixString}<br>Suffixes with ${suffixString}`;
                } else {
                    concatCell.dataset.derivation = `Slices [${lcPrefix}, ${Math.log2(columns) - lcSuffix}) from ${cell.dataset.xString} and [${lcPrefix}, ${Math.log2(rows) - lcSuffix}) ${cell.dataset.yString}<br>Prefixes with ${prefixString}<br>Suffixes with ${suffixString}`;
                }
                concatCell.ariaSelected = "true"; 
                concatCell.setAttributeNS(null, "fill", cell.getAttributeNS(null, "fill"));
                toSearch.push(concatCell);
            }
        }
    }

    return toSearch;
}