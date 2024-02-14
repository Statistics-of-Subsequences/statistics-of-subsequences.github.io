var nBox, mBox, tableMatrix, infoPopup, gradientMap;
var matrix, infoMatrix, selectedCells;
var rows, columns;
const svgns = "http://www.w3.org/2000/svg";

function setup() {
    nBox = document.getElementById("n");
    mBox = document.getElementById("m");
    tableMatrix = document.getElementById("table");
    infoPopup = document.getElementById("infoPopup");

    infoMatrix = [];
    matrix = document.createElementNS(svgns, "svg");

    nBox.value = 1;
    mBox.value = 1;
    generateMatrixShell();

    var svgElements = document.getElementsByTagName("svg");
    for (var i = 0; i < svgElements.length; i++) {
        svgElements[i].addEventListener("click", selectCell);
        svgElements[i].addEventListener("mouseover", showPopup);
        svgElements[i].addEventListener("mouseout", hidePopup);
    }
}

function generateMatrixShell() {
    selectedCells = [];
    columns = Math.pow(2, nBox.value);
    rows = Math.pow(2, mBox.value);
    infoMatrix = new Array(rows);
    for (var i = 0; i < rows; i++) {
        infoMatrix[i] = new Array(columns);
    }

    var cellWidth = -7.5 * nBox.value + 57.5;
    var cellHeight = -7.5 * mBox.value + 57.5;
    cellSize = Math.min(cellWidth, cellHeight);

    tableMatrix.innerHTML = "";
    tableMatrix.appendChild(generateSVGTable(cellSize, cellSize));

    gradientMap = generateGradient([0xfde724, 0x79d151, 0x29788e, 0x404387, 0x440154], Math.min(nBox.value, mBox.value) + 1);

    // fill infoMatrix with Cell objects
    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < columns; j++) {
            infoMatrix[i][j] = new Cell(rows - 1 - i, j, matrix.childNodes[i].childNodes[j], "Unknown", "Not Derived Yet");
        }
    }
}

function generateSVGTable(cellWidth, cellHeight) {
    matrix.innerHTML = "";

    matrix.setAttributeNS(null, "width", columns * cellWidth + cellWidth);
    matrix.setAttributeNS(null, "height", rows * cellHeight + cellHeight);

    for (var i = 0; i < rows; i++) {
        var row = document.createElementNS(svgns, "g");
        for (var j = 0; j < columns; j++) {
            var rect = document.createElementNS(svgns, "rect");
            rect.setAttributeNS(null, "x", j * cellWidth + cellWidth / 2);
            rect.setAttributeNS(null, "y", i * cellHeight + cellHeight / 2);
            rect.setAttributeNS(null, "width", cellWidth);
            rect.setAttributeNS(null, "height", cellHeight);
            rect.setAttributeNS(null, "fill", "white");
            rect.setAttributeNS(null, "stroke", "black");
            rect.setAttributeNS(null, "stroke-width", "1");
            row.appendChild(rect);
        }
        matrix.appendChild(row);
    }

    return matrix;
}

function fillMatrix() {
    var queue = [];
    for (var cell of selectedCells) {
        queue.push(cell);
    }
    
    while (queue.length > 0) {
        // get the row and column of the cell
        var currentCell = queue.shift();
        var row = currentCell.row;
        var column = currentCell.column;
        
        // commutative property
        if (rows == columns) {
            var commutativeCell = infoMatrix[rows - 1 - column][row];
            if (commutativeCell.length == "Unknown") {
                infoMatrix[rows - 1 - column][row].length = currentCell.length;
                infoMatrix[rows - 1 - column][row].derivation = "commutative from cell [" + column + "][" + row + "]";
                commutativeCell.cell.setAttribute("fill", currentCell.cell.getAttribute("fill"));
                selectedCells.push(commutativeCell);
                queue.push(commutativeCell);
            }
        }

        // complement property
        var complementRow = rows - 1 - row;
        var complementColumn = columns - 1 - column;
        
        var complementCell = infoMatrix[rows - 1 - complementRow][complementColumn];
        if (complementCell.length == "Unknown") {
            infoMatrix[rows - 1 - complementRow][complementColumn].length = currentCell.length;
            infoMatrix[rows - 1 - complementRow][complementColumn].derivation = "complement of cell [" + column + "][" + row + "]";
            complementCell.cell.setAttribute("fill", currentCell.cell.getAttribute("fill"));
            selectedCells.push(complementCell);
            queue.push(complementCell);
        }
        
        // reverse property
        var reverseRow = parseInt(row.toString(2).split("").reverse().join("").concat("0".repeat(mBox.value - row.toString(2).length)), 2);
        var reverseColumn = parseInt(column.toString(2).split("").reverse().join("").concat("0".repeat(nBox.value - column.toString(2).length)), 2);

        var reverseCell = infoMatrix[rows - 1 - reverseRow][reverseColumn];
        if (reverseCell.length == "Unknown") {
            infoMatrix[rows - 1 - reverseRow][reverseColumn].length = currentCell.length;
            infoMatrix[rows - 1 - reverseRow][reverseColumn].derivation = "reverse of cell [" + column + "][" + row + "]";
            reverseCell.cell.setAttribute("fill", currentCell.cell.getAttribute("fill"));
            selectedCells.push(reverseCell);
            queue.push(reverseCell);
        }

        // concatenation property
        var rowBinary = "0".repeat(mBox.value - row.toString(2).length).concat(row.toString(2));
        var columnBinary = "0".repeat(nBox.value - column.toString(2).length).concat(column.toString(2));

        var tempRowBinary = rowBinary;
        var tempColumnBinary = columnBinary;
        
        var lcPrefix = 0; // longest common prefix
        while (tempRowBinary.length > 0 && tempColumnBinary.length > 0 && tempRowBinary[0] == tempColumnBinary[0]) {
            lcPrefix++;
            tempRowBinary = tempRowBinary.slice(1);
            tempColumnBinary = tempColumnBinary.slice(1);
        }

        var lcSuffix = 0; // longest common suffix
        while (tempRowBinary.length > 0 && tempColumnBinary.length > 0 && tempRowBinary[tempRowBinary.length - 1] == tempColumnBinary[tempColumnBinary.length - 1]) {
            lcSuffix++;
            tempRowBinary = tempRowBinary.slice(0, -1);
            tempColumnBinary = tempColumnBinary.slice(0, -1);
        }

        var remainingRow = rowBinary;
        var remainingColumn = columnBinary;
        var STATE = 0;

        if (lcPrefix > 0) {
            remainingRow = rowBinary.slice(lcPrefix);
            remainingColumn = columnBinary.slice(lcPrefix);
            STATE++;
        }

        if (lcSuffix > 0) {
            remainingRow = remainingRow.slice(0, -lcSuffix);
            remainingColumn = remainingColumn.slice(0, -lcSuffix);
            STATE += 2;
        }

        switch (STATE) {
            case 1:
                for (var PREFIX = 0; PREFIX < Math.pow(2, lcPrefix); PREFIX++) {
                    var r = "0".repeat(lcPrefix - PREFIX.toString(2).length).concat(PREFIX.toString(2));
                    var newRow = parseInt(r.toString(2).concat(remainingRow.toString(2)), 2);
                    var newColumn = parseInt(r.toString(2).concat(remainingColumn.toString(2)), 2);

                    var concatCell = infoMatrix[rows - 1 - newRow][newColumn];
                    if (concatCell.length == "Unknown") {
                        infoMatrix[rows - 1 - newRow][newColumn].length = currentCell.length;
                        infoMatrix[rows - 1 - newRow][newColumn].derivation = "concatenation from cell [" + column + "][" + row + "]";
                        concatCell.cell.setAttribute("fill", currentCell.cell.getAttribute("fill"));
                        selectedCells.push(concatCell);
                        queue.push(concatCell);
                    }
                }
                break;
            case 2:
                for (var SUFFIX = 0; SUFFIX < Math.pow(2, lcSuffix); SUFFIX++) {
                    var c = "0".repeat(lcSuffix - SUFFIX.toString(2).length).concat(SUFFIX.toString(2));
                    var newRow = parseInt(remainingRow.toString(2).concat(c.toString(2)), 2);
                    var newColumn = parseInt(remainingColumn.toString(2).concat(c.toString(2)), 2);

                    var concatCell = infoMatrix[rows - 1 - newRow][newColumn];
                    if (concatCell.length == "Unknown") {
                        infoMatrix[rows - 1 - newRow][newColumn].length = currentCell.length;
                        infoMatrix[rows - 1 - newRow][newColumn].derivation = "concatenation from cell [" + column + "][" + row + "]";
                        concatCell.cell.setAttribute("fill", currentCell.cell.getAttribute("fill"));
                        selectedCells.push(concatCell);
                        queue.push(concatCell);
                    }
                }
                break;  
            case 3:
                for (var PREFIX = 0; PREFIX < Math.pow(2, lcPrefix); PREFIX++) {
                    for (var SUFFIX = 0; SUFFIX < Math.pow(2, lcSuffix); SUFFIX++) {
                        var r = "0".repeat(lcPrefix - PREFIX.toString(2).length).concat(PREFIX.toString(2));
                        var c = "0".repeat(lcSuffix - SUFFIX.toString(2).length).concat(SUFFIX.toString(2));

                        var newRow = parseInt(r.toString(2).concat(remainingRow).concat(c.toString(2)), 2);
                        var newColumn = parseInt(r.toString(2).concat(remainingColumn).concat(c.toString(2)), 2);

                        var concatCell = infoMatrix[rows - 1 - newRow][newColumn];
                        if (concatCell.length == "Unknown") {
                            infoMatrix[rows - 1 - newRow][newColumn].length = currentCell.length;
                            infoMatrix[rows - 1 - newRow][newColumn].derivation = "concatenation from cell [" + column + "][" + row + "]";
                            concatCell.cell.setAttribute("fill", currentCell.cell.getAttribute("fill"));
                            selectedCells.push(concatCell);
                            queue.push(concatCell);
                        }
                    }
                }
                break;
        }
    }
}

function selectCell(evt) {
    // get the row and column of the cell
    var row = Math.floor(evt.target.getAttribute("y") / cellSize);
    var column = Math.floor(evt.target.getAttribute("x") / cellSize);

    // if cell is not white, then set it to white
    if (evt.target.getAttribute("fill") != "white") {
        evt.target.setAttribute("fill", "white");
        infoMatrix[row][column].length = "Unknown";
        infoMatrix[row][column].derivation = "Not Derived Yet";

        // remove cell from queue if it is in the queue
        var index = selectedCells.indexOf(infoMatrix[row][column]);
        if (index > -1) {
            selectedCells.splice(index, 1);
        }
    } else {
        infoMatrix[row][column].length = lcs("0".repeat(nBox.value - column.toString(2).length).concat(column.toString(2)), "0".repeat(mBox.value - (rows - 1 - row).toString(2).length).concat((rows - 1 - row).toString(2)));
        infoMatrix[row][column].derivation = "User Selected";
        selectedCells.push(infoMatrix[row][column]);

        // set cell color based on length
        var color = "#" + gradientMap[infoMatrix[row][column].length].toString(16);
        evt.target.setAttribute("fill", color);
    }
}

function showPopup(ele) {
    // get value of cell
    var row = Math.floor(ele.target.getAttribute("y") / cellSize);
    var column = Math.floor(ele.target.getAttribute("x") / cellSize);
    var cell = infoMatrix[row][column];

    // set the value of the popup
    infoPopup.innerHTML = cellValue(cell);

    var iconPos = ele.target.getBoundingClientRect();
    infoPopup.style.left = (iconPos.right + 20) + "px";
    infoPopup.style.top = (window.scrollY + iconPos.top - 60) + "px";
    infoPopup.style.display = "block";
}

function hidePopup() {
    infoPopup.style.display = "none";
}

class Cell {
    constructor(row, column, cell, length, derivation) {
        this.row = row;
        this.column = column;
        this.cell = cell;
        this.length = length;
        this.derivation = derivation;
    }
}

function cellValue(cell) {
    // add h3 with column and row
    var column = "0".repeat(nBox.value - cell.column.toString(2).length).concat(cell.column.toString(2));
    var row = "0".repeat(mBox.value - cell.row.toString(2).length).concat(cell.row.toString(2));
    var value = "<h3>LCS of " + column + " and " + row + "</h3>";

    // add p with length and derivation
    value += "<p>Length: " + cell.length + "</p>";
    value += "<p>" + cell.derivation + "</p>";

    return value;
}

// lcs length
function lcs(x, y) {
    let n = x.length;
    let m = y.length;

    // Initialize table
    let T = new Array(n + 1);
    for (let i = 0; i < n + 1; i++) {
        T[i] = new Array(m + 1);
    }
    for (let i = 0; i < n + 1; i++) {
        T[i][0] = 0;
    }
    for (let i = 0; i < m + 1; i++) {
        T[0][i] = 0;
    }

    for (let i = 1; i < n + 1; i++) {
        for (let j = 1; j < m + 1; j++) {
            if (x[i - 1] == y[j - 1]) {
                T[i][j] = T[i - 1][j - 1] + 1;
            } else {
                T[i][j] = Math.max(T[i - 1][j], T[i][j - 1]);
            }
        }
    }
    
    // return bottom right cell
    return T[n][m];
}

function generateGradient(stops, steps) {
    var colors = [];

    for (var i = 0; i < steps; i++) {
        colors[i] = getPercent(stops, i / (steps - 1));
    }

    return colors;
}

function interpolate(start, end, percent) {
    var red = (start >> 16) * (1 - percent) + (end >> 16) * percent;
    var green = ((start >> 8) & 0xff) * (1 - percent) + ((end >> 8) & 0xff) * percent;
    var blue = (start & 0xff) * (1 - percent) + (end & 0xff) * percent;
    var color = (red << 16) + (green << 8) + blue;
    return Math.floor(color);
}

function getPercent(stops, percent) {
    var step = 1.0 / (stops.length - 1);
    for (var i = 0; i < stops.length - 1; i++) {
        // if percent in between stops i and i + 1
        if (percent >= step * i && percent <= step * (i + 1)) {
            return interpolate(stops[i], stops[i + 1], (percent - step * i) / step);
        }
    }
    return -1;
}