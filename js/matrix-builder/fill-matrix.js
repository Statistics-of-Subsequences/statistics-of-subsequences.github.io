function fillMatrix() {
    let queue = [];
    for (let cell of selectedCells) {
        queue.push(cell);
    }
    
    while (queue.length > 0) {
        // get the row and column of the cell
        let currentCell = queue.shift();
        let row = currentCell.row;
        let column = currentCell.column;
        
        // commutative property
        if (rows == columns && allowedProperties["commute"]) {
            let commutativeCell = infoMatrix[rows - 1 - column][row];
            if (commutativeCell.length == "Unknown") {
                infoMatrix[rows - 1 - column][row].length = currentCell.length;
                infoMatrix[rows - 1 - column][row].derivation = "Commutes with " + intToBinStr(column, nBox.value) + " and " + intToBinStr(row, mBox.value);
                commutativeCell.cell.setAttribute("fill", currentCell.cell.getAttribute("fill"));
                selectedCells.push(commutativeCell);
                queue.push(commutativeCell);
            }
        }

        // complement property
        if (allowedProperties["complement"]) {
            let complementRow = rows - 1 - row;
            let complementColumn = columns - 1 - column;
            
            let complementCell = infoMatrix[rows - 1 - complementRow][complementColumn];
            if (complementCell.length == "Unknown") {
                infoMatrix[rows - 1 - complementRow][complementColumn].length = currentCell.length;
                infoMatrix[rows - 1 - complementRow][complementColumn].derivation = "Complement of " + intToBinStr(column, nBox.value) + " and " + intToBinStr(row, mBox.value);
                complementCell.cell.setAttribute("fill", currentCell.cell.getAttribute("fill"));
                selectedCells.push(complementCell);
                queue.push(complementCell);
            }
        }
        
        // reverse property
        if (allowedProperties["reverse"]) {
            let reverseRow = parseInt(row.toString(2).split("").reverse().join("").concat("0".repeat(mBox.value - row.toString(2).length)), 2);
            let reverseColumn = parseInt(column.toString(2).split("").reverse().join("").concat("0".repeat(nBox.value - column.toString(2).length)), 2);

            let reverseCell = infoMatrix[rows - 1 - reverseRow][reverseColumn];
            if (reverseCell.length == "Unknown") {
                infoMatrix[rows - 1 - reverseRow][reverseColumn].length = currentCell.length;
                infoMatrix[rows - 1 - reverseRow][reverseColumn].derivation = "Reverse of " + intToBinStr(column, nBox.value) + " and " + intToBinStr(row, mBox.value);
                reverseCell.cell.setAttribute("fill", currentCell.cell.getAttribute("fill"));
                selectedCells.push(reverseCell);
                queue.push(reverseCell);
            }
        }

        // slice and concatenation property
        if (allowedProperties["slicePrefix"] || allowedProperties["sliceSuffix"] || allowedProperties["sliceCircumfix"]) {
            let rowBinary = intToBinStr(row, mBox.value);
            let columnBinary = intToBinStr(column, nBox.value);

            let tempRowBinary = rowBinary;
            let tempColumnBinary = columnBinary;
            
            let lcPrefix = 0; // longest common prefix
            while (tempRowBinary.length > 0 && tempColumnBinary.length > 0 && tempRowBinary[0] == tempColumnBinary[0]) {
                lcPrefix++;
                tempRowBinary = tempRowBinary.slice(1);
                tempColumnBinary = tempColumnBinary.slice(1);
            }

            let lcSuffix = 0; // longest common suffix
            while (tempRowBinary.length > 0 && tempColumnBinary.length > 0 && tempRowBinary[tempRowBinary.length - 1] == tempColumnBinary[tempColumnBinary.length - 1]) {
                lcSuffix++;
                tempRowBinary = tempRowBinary.slice(0, -1);
                tempColumnBinary = tempColumnBinary.slice(0, -1);
            }

            let remainingRowPrefix = rowBinary;
            let remainingRowSuffix = rowBinary;
            let remainingRowCircumfix = rowBinary;
            let remainingColumnPrefix = columnBinary;
            let remainingColumnSuffix = columnBinary;
            let remainingColumnCircumfix = columnBinary;
            let STATE = 0;

            if (rows == columns && !allowedProperties["slicePrefix"] && allowedProperties["sliceSuffix"] && lcPrefix == Math.log2(rows)) {
                lcSuffix = lcPrefix;
                lcPrefix = 0;
            } else if (rows == columns && !allowedProperties["slicePrefix"] && !allowedProperties["sliceSuffix"] && allowedProperties["sliceCircumfix"] && lcPrefix == Math.log2(rows)) {
                lcPrefix = Math.ceil(lcPrefix / 2);
                lcSuffix = Math.log2(rows) - lcPrefix;
            }
            
            if (lcPrefix > 0) {
                remainingRowPrefix = rowBinary.slice(lcPrefix);
                remainingRowCircumfix = rowBinary.slice(lcPrefix);
                remainingColumnPrefix = columnBinary.slice(lcPrefix);
                remainingColumnCircumfix = columnBinary.slice(lcPrefix);
                STATE++;
            }

            if (lcSuffix > 0) {
                remainingRowSuffix = rowBinary.slice(0, -lcSuffix);
                remainingRowCircumfix = remainingRowCircumfix.slice(0, -lcSuffix);
                remainingColumnSuffix = columnBinary.slice(0, -lcSuffix);
                remainingColumnCircumfix = remainingColumnCircumfix.slice(0, -lcSuffix);
                STATE += 2;
            }

            if (allowedProperties["slicePrefix"] && (STATE == 1 || STATE == 3)) {
                for (let PREFIX = 0; PREFIX < Math.pow(2, lcPrefix); PREFIX++) {
                    let r = "0".repeat(lcPrefix - PREFIX.toString(2).length).concat(PREFIX.toString(2));
                    let newRow = parseInt(r.toString(2).concat(remainingRowPrefix.toString(2)), 2);
                    let newColumn = parseInt(r.toString(2).concat(remainingColumnPrefix.toString(2)), 2);

                    let concatCell = infoMatrix[rows - 1 - newRow][newColumn];
                    if (concatCell.length == "Unknown") {
                        infoMatrix[rows - 1 - newRow][newColumn].length = currentCell.length;
                        infoMatrix[rows - 1 - newRow][newColumn].derivation = "Slices [" + (lcPrefix) + "&#12297;from " + intToBinStr(column, nBox.value) + " and " + intToBinStr(row, mBox.value) + "<br/>Prefixes with " + intToBinStr(PREFIX, lcPrefix);
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
            if (allowedProperties["sliceSuffix"] && (STATE == 2 || STATE == 3)) {
                for (let SUFFIX = 0; SUFFIX < Math.pow(2, lcSuffix); SUFFIX++) {
                    let c = "0".repeat(lcSuffix - SUFFIX.toString(2).length).concat(SUFFIX.toString(2));
                    let newRow = parseInt(remainingRowSuffix.toString(2).concat(c.toString(2)), 2);
                    let newColumn = parseInt(remainingColumnSuffix.toString(2).concat(c.toString(2)), 2);

                    let concatCell = infoMatrix[rows - 1 - newRow][newColumn];
                    if (concatCell.length == "Unknown") {
                        infoMatrix[rows - 1 - newRow][newColumn].length = currentCell.length;
                        if (rows == columns) {
                            infoMatrix[rows - 1 - newRow][newColumn].derivation = "Slices [0, " + (nBox.value - lcSuffix) + ") from " + intToBinStr(column, nBox.value) + " and " + intToBinStr(row, mBox.value) + "<br/>Suffixes with " + intToBinStr(SUFFIX, lcSuffix);
                        } else {
                            infoMatrix[rows - 1 - newRow][newColumn].derivation = "Slices [0, " + (nBox.value - lcSuffix) + ") from " + intToBinStr(column, nBox.value) + " and [0, " + (mBox.value - lcSuffix)  + ") from " + intToBinStr(row, mBox.value) + "<br/>Suffixes with " + intToBinStr(SUFFIX, lcSuffix);
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
            if (allowedProperties["sliceCircumfix"] && STATE == 3) {
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
        }
    }
}