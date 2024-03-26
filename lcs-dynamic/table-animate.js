function animateBacktracking(lcs) {
    var backtracking = findBacktracking(lcsTable, lcs);
    clearBlueObjects();
    var backChild = table.childNodes[1];

    // disable inputs
    var buttons = document.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].disabled = true;
    }
    xBox.disabled = true;
    yBox.disabled = true;
    
    // animate the line
    var i = 0;
    var interval = setInterval(function () {
        var x1 = 50 + (backtracking[i][0] + 1) * 50;
        var y1 = 50 + (backtracking[i][1] + 1) * 50;
        var x2 = 50 + (backtracking[i + 1][0] + 1) * 50;
        var y2 = 50 + (backtracking[i + 1][1] + 1) * 50;

        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttributeNS(null, "x1", x1);
        line.setAttributeNS(null, "y1", y1);
        line.setAttributeNS(null, "x2", x1);
        line.setAttributeNS(null, "y2", y1);
        line.setAttributeNS(null, "stroke", "blue");
        line.setAttributeNS(null, "stroke-width", "25");
        line.setAttributeNS(null, "stroke-linecap", "round");
        table.insertBefore(line, backChild);

        var anim = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        anim.setAttributeNS(null, "attributeName", "x2");
        anim.setAttributeNS(null, "from", x1);
        anim.setAttributeNS(null, "to", x2);
        anim.setAttributeNS(null, "dur", "1s");
        anim.setAttributeNS(null, "fill", "freeze");
        line.appendChild(anim);

        var anim = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        anim.setAttributeNS(null, "attributeName", "y2");
        anim.setAttributeNS(null, "from", y1);
        anim.setAttributeNS(null, "to", y2);
        anim.setAttributeNS(null, "dur", "0.1s");
        anim.setAttributeNS(null, "fill", "freeze");
        line.appendChild(anim);

        // if line was diagonal, draw a rect at the row and column
        if (x1 != x2 && y1 != y2) {
            var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttributeNS(null, "x", x1 - 25);
            rect.setAttributeNS(null, "y", 25);
            rect.setAttributeNS(null, "width", "50");
            rect.setAttributeNS(null, "height", "50");
            rect.setAttributeNS(null, "opacity", "0.5");
            rect.setAttributeNS(null, "fill", "blue");
            rect.setAttributeNS(null, "stroke", "blue");
            rect.setAttributeNS(null, "stroke-width", "2");
            table.insertBefore(rect, backChild);

            var rect2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect2.setAttributeNS(null, "x", 25);
            rect2.setAttributeNS(null, "y", y1 - 25);
            rect2.setAttributeNS(null, "width", "50");
            rect2.setAttributeNS(null, "height", "50");
            rect2.setAttributeNS(null, "opacity", "0.5");
            rect2.setAttributeNS(null, "fill", "blue");
            rect2.setAttributeNS(null, "stroke", "blue");
            rect2.setAttributeNS(null, "stroke-width", "2");
            table.insertBefore(rect2, backChild);
        }

        i++;
        if (i == backtracking.length - 1) {
            clearInterval(interval);
        }
    }, 500);

    // enable inputs
    setTimeout(function() {
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].disabled = false;
        }
        xBox.disabled = false;
        yBox.disabled = false;
    }, 500 * (backtracking.length - 1) + 1000);
}

// clear all blue objects
function clearBlueObjects() {
    var blueObjects = document.querySelectorAll("[stroke='blue']");
    for (var i = 0; i < blueObjects.length; i++) {
        blueObjects[i].remove();
    }
}