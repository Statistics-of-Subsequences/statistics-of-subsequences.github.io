const animationInterval = 500;

let string1 = [];
let string2 = [];
let activeInterval = null;

export function setString1Path(strIndices) {
    string1 = strIndices;
}
export function setString2Path(strIndices) {
    string2 = strIndices;
}

export function getIntervalStatus() {
    return activeInterval;
}

function generateSteps(str1, str2, indices1, indices2) {
    let output = [];
    
    let x = str1.length;
    let y = str2.length;
    while(x > 0 || y > 0) {
        let nextOutput = { x: x, y: y, included: false };
        if(indices1.length > 0 && indices2.length > 0 && x === indices1[indices1.length - 1] && y === indices2[indices2.length - 1]) {
            x -= 1;
            y -= 1;
            nextOutput.included = true;
            indices1.pop();
            indices2.pop();
        } else if(indices1.length > 0 && x !== indices1[indices1.length - 1]) {
            x -= 1;
        } else if(indices2.length > 0 && y !== indices2[indices2.length - 1]) {
            y -= 1;
        } else {
            x -= 1;
            y -= 1;
        }

        if(x < 0) {
            x = 0;
        }
        if(y < 0) {
            y = 0;
        }

        
        output.push(nextOutput);
    }

    output.push({ x: 0, y: 0 });
    return output;
}

export function animateBacktracking() {
    clearBlueObjects();
    if(string1.length === 0 || string2.length === 0) {
        return;
    }

    const str1Indices = string1.map((v, i) => v > 0 ? i + 1 : -1).filter(i => i != -1);
    const str2Indices = string2.map((v, i) => v > 0 ? i + 1 : -1).filter(i => i != -1);
    const steps = generateSteps(string1, string2, str1Indices, str2Indices);

    const lineGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    lineGroup.id = "path-bin";
    lineGroup.style.opacity = 0.5;
    document.querySelector("#table").appendChild(lineGroup);
    
    // animate the line
    let i = 0;
    var activeInterval = setInterval(() => {
        var y1 = 25 + (steps[i].x + 1) * 50;
        var x1 = 25 + (steps[i].y + 1) * 50;
        var y2 = 25 + (steps[i + 1].x + 1) * 50;
        var x2 = 25 + (steps[i + 1].y + 1) * 50;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttributeNS(null, "x1", x1);
        line.setAttributeNS(null, "y1", y1);
        line.setAttributeNS(null, "x2", x1);
        line.setAttributeNS(null, "y2", y1);
        line.setAttributeNS(null, "stroke", "#0000CC");
        line.setAttributeNS(null, "stroke-width", 25);
        line.setAttributeNS(null, "stroke-linecap", "round");
        lineGroup.appendChild(line);

        const animX = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        animX.setAttributeNS(null, "attributeName", "x2");
        animX.setAttributeNS(null, "from", x1);
        animX.setAttributeNS(null, "to", x2);
        animX.setAttributeNS(null, "dur", "0.2s");
        animX.setAttributeNS(null, "fill", "freeze");
        line.appendChild(animX);

        const animY = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        animY.setAttributeNS(null, "attributeName", "y2");
        animY.setAttributeNS(null, "from", y1);
        animY.setAttributeNS(null, "to", y2);
        animY.setAttributeNS(null, "dur", "0.2s");
        animY.setAttributeNS(null, "fill", "freeze");
        line.appendChild(animY);

        // if line was diagonal, draw a rectX at the row and column
        if (steps[i].included) {
            var rectX = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rectX.setAttributeNS(null, "x", x1 - 25);
            rectX.setAttributeNS(null, "y", 0);
            rectX.setAttributeNS(null, "width", 50);
            rectX.setAttributeNS(null, "height", 50);
            rectX.setAttributeNS(null, "opacity", 0.5);
            rectX.setAttributeNS(null, "fill", "#0000CC");
            rectX.setAttributeNS(null, "stroke", "blue");
            lineGroup.appendChild(rectX);

            var rectY = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rectY.setAttributeNS(null, "x", 0);
            rectY.setAttributeNS(null, "y", y1 - 25);
            rectY.setAttributeNS(null, "width", 50);
            rectY.setAttributeNS(null, "height", 50);
            rectY.setAttributeNS(null, "opacity", 0.5);
            rectY.setAttributeNS(null, "fill", "#0000CC");
            rectY.setAttributeNS(null, "stroke", "blue");
            lineGroup.appendChild(rectY);
        }

        if (i === steps.length - 2) {
            clearInterval(activeInterval);
            activeInterval = null;
            return;
        }

        i += 1;
    }, animationInterval);
}

// clear all blue objects
function clearBlueObjects() {
    const path = document.querySelector("#path-bin");
    if(path) {
        path.remove();
    }
}