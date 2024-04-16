function createLine(x1, y1, x2, y2, thickness) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttributeNS(null, "x1", x1);
    line.setAttributeNS(null, "y1", y1);
    line.setAttributeNS(null, "x2", x2);
    line.setAttributeNS(null, "y2", y2);
    line.setAttributeNS(null, "stroke", "#000000");
    line.setAttributeNS(null, "stroke-width", thickness);

    return line;
}

function createText(content, x, y) {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttributeNS(null, "x", x);
    text.setAttributeNS(null, "y", y);
    text.setAttributeNS(null, "font-size", "20pt");
    text.setAttributeNS(null, "text-anchor", "middle");
    text.setAttributeNS(null, "dominant-baseline", "middle");
    text.textContent = content;

    return text;
}

export async function generateSVGTable(string1, string2, cellWidth, cellHeight) {
    return new Promise(res => {
        const table = document.querySelector("#table");

        // clear the table
        table.innerHTML = "";

        var rows = string1.length + 2;
        var columns = string2.length + 2;

        table.setAttributeNS(null, "width", columns * cellWidth);
        table.setAttributeNS(null, "height", rows * cellHeight);

        const outline = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        outline.setAttributeNS(null, "x", 0);
        outline.setAttributeNS(null, "y", 0);
        outline.setAttributeNS(null, "width", columns * cellWidth);
        outline.setAttributeNS(null, "height", rows * cellHeight);
        outline.setAttributeNS(null, "fill", "white");
        outline.setAttributeNS(null, "stroke", "black");
        outline.setAttributeNS(null, "stroke-width", "2");
        table.appendChild(outline);

        // Horizontal lines
        table.appendChild(createLine(0, cellHeight, columns * cellWidth, cellHeight, 2));
        for (var i = 2; i < rows; i++) {
            table.appendChild(createLine(0, i * cellHeight, columns * cellWidth, i * cellHeight, 1));
        }

        // Vertical lines
        table.appendChild(createLine(cellHeight, 0, cellWidth, rows * cellHeight, 2));
        for (var i = 2; i < columns; i++) {
            table.appendChild(createLine(i * cellHeight, 0, i * cellWidth, rows * cellHeight, 1));
        }

        // draw the characters of string1, starting at row 2 (0 is the row for string2 and 1 is the empty string)
        for (var i = 2; i < rows; i++) {
            table.appendChild(createText(string1[i - 2], cellWidth / 2, i * cellHeight + cellHeight / 2));
        }

        // draw the characters of string2, starting at column 2 (0 is the column for string1 and 1 is the empty string)
        for (var i = 2; i < columns; i++) {
            table.appendChild(createText(string2[i - 2], i * cellWidth + cellWidth / 2, cellHeight / 2));
        }

        // Row/Column 1 are for empty strings, and thus always have a partial LCS length of 0 in all cases
        table.appendChild(createText("0", cellWidth + cellWidth / 2, cellHeight + cellHeight / 2));
        for (var i = 2; i < rows; i++) {
            table.appendChild(createText("0", cellWidth + cellWidth / 2, i * cellHeight + cellHeight / 2));
        }
        for (var i = 2; i < columns; i++) {
            table.appendChild(createText("0", i * cellWidth + cellWidth / 2, cellHeight + cellHeight / 2));
        }
    });
}

export function fillTable(memo, cellWidth, cellHeight) {
    const table = document.querySelector("#table");

    // draw the lcs values in the table
    for (var i = 0; i < memo.length; i++) {
        for (var j = 0; j < memo[0].length; j++) {
            table.appendChild(createText(memo[i][j].len, 2.5 * cellWidth + j * cellWidth, 2.5 * cellHeight + i * cellHeight));
        }
    }
}