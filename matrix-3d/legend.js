export function generateGradient(stops, steps) {
    let colors = [];

    for (var i = 0; i < steps; i++) {
        colors[i] = getPercent(stops, i / (steps - 1));
    }

    return colors;
}

function interpolate(start, end, percent) {
    const red = (start >> 16) * (1 - percent) + (end >> 16) * percent;
    const green = ((start >> 8) & 0xff) * (1 - percent) + ((end >> 8) & 0xff) * percent;
    const blue = (start & 0xff) * (1 - percent) + (end & 0xff) * percent;

    return Math.floor((red << 16) + (green << 8) + blue);
}

function getPercent(stops, percent) {
    const step = 1.0 / (stops.length - 1);
    for (let i = 0; i < stops.length - 1; i++) {
        // if percent in between stops i and i + 1
        if (percent >= step * i && percent <= step * (i + 1)) {
            return interpolate(stops[i], stops[i + 1], (percent - step * i) / step);
        }
    }
    return -1;
}

export function setLegend(onMobile) {
    var legend = document.getElementById("legendSVG");
    while (legend.firstChild) {
        legend.removeChild(legend.firstChild);
    }

    var legendTitle = document.getElementById("legendTitle");
    if (onMobile) {
        legendTitle.style.marginTop = "1.5%";
        legendTitle.style.marginBottom = "1.5%";
    } else {
        legendTitle.style.marginTop = "4.75%";
        legendTitle.style.marginBottom = "4.75%";
    }
    
    var legendTitlePercent = 100 * legendTitle.clientHeight / document.getElementById("legend").clientHeight;
    var topAndBottomMarginsPercent = parseFloat(legendTitle.style.marginTop) + 2 * parseFloat(legendTitle.style.marginBottom);
    var heightPercent = 100 - legendTitlePercent - topAndBottomMarginsPercent - 1.75;

    legend.setAttribute("width", "90%");
    legend.setAttribute("height", heightPercent + "%");

    var gradientMap = generateGradient([0xfde724, 0x79d151, 0x29788e, 0x404387, 0x440154], Math.min(n, m) + 1);

    var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    var linearGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    linearGradient.setAttribute("id", "legendGradient");
    linearGradient.setAttribute("x1", "0%");
    linearGradient.setAttribute("y1", "0%");
    linearGradient.setAttribute("x2", "100%");
    linearGradient.setAttribute("y2", "0%");
    defs.appendChild(linearGradient);

    for (var i = 0; i < gradientMap.length; i++) {
        var stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop.setAttribute("offset", 100 * i / gradientMap.length + "%");
        stop.setAttribute("style", "stop-color: #" + gradientMap[i].toString(16) + "; stop-opacity: 1");
        linearGradient.appendChild(stop);

        if (i < gradientMap.length - 1) {
            var stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
            stop.setAttribute("offset", 100 * (i + 1) / gradientMap.length + "%");
            stop.setAttribute("style", "stop-color: #" + gradientMap[i].toString(16) + "; stop-opacity: 1");
            linearGradient.appendChild(stop);
        }
    }
    legend.appendChild(defs);

    var gradientTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
    gradientTitle.setAttribute("x", "0%");
    gradientTitle.setAttribute("y", "5%");
    gradientTitle.setAttribute("font-size", "100%")
    var gradientTitleNode = document.createTextNode("Longest Common Subsequence Length");
    gradientTitle.appendChild(gradientTitleNode);
    legend.appendChild(gradientTitle);
    
    var gradientBox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    gradientBox.setAttribute("x", "0%");
    gradientBox.setAttribute("y", "7.5%");
    gradientBox.setAttribute("width", "100%");
    gradientBox.setAttribute("height", "7.5%");
    gradientBox.setAttribute("fill", "url(#legendGradient)");
    legend.appendChild(gradientBox);

    for (var i = 0; i < gradientMap.length; i++) {
        var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", (100 * (i + 0.5) / gradientMap.length - 0.75) + "%");
        text.setAttribute("y", "25%");

        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", 100 * (i + 0.5) / gradientMap.length + "%");
        line.setAttribute("y1", "15%");
        line.setAttribute("x2", 100 * (i + 0.5) / gradientMap.length + "%");
        line.setAttribute("y2", "17.5%");
        line.setAttribute("stroke", "black");
        line.setAttribute("stroke-width", 1);

        var textNode = document.createTextNode(i);
        text.appendChild(textNode);
        legend.appendChild(text);
        legend.appendChild(line);
    }

    var aspectRatio = legend.clientWidth / legend.clientHeight;

    var lcsText1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    lcsText1.setAttribute("x", "31%");
    lcsText1.setAttribute("y", "37.5%");
    lcsText1.setAttribute("font-size", "100%");
    lcsText1.setAttribute("text-anchor", "middle");
    var lcsTextNode1 = document.createTextNode("Selected Pair of");
    lcsText1.appendChild(lcsTextNode1);
    var lcsText2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    lcsText2.setAttribute("x", "31%");
    lcsText2.setAttribute("y", "42.5%");
    lcsText2.setAttribute("font-size", "100%");
    lcsText2.setAttribute("text-anchor", "middle");
    var lcsTextNode2 = document.createTextNode("Binary Strings");
    lcsText2.appendChild(lcsTextNode2);
    legend.appendChild(lcsText1);
    legend.appendChild(lcsText2);

    var lcsBox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    lcsBox.setAttribute("x", "18.5%");
    lcsBox.setAttribute("y", "45%");
    lcsBox.setAttribute("width", "25%");
    lcsBox.setAttribute("height", 25 * aspectRatio + "%");
    lcsBox.setAttribute("fill", "#8e3f29");
    legend.appendChild(lcsBox);

    var editText1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    editText1.setAttribute("x", "69%");
    editText1.setAttribute("y", "37.5%");
    editText1.setAttribute("font-size", "100%");
    editText1.setAttribute("text-anchor", "middle");
    var editTextNode1 = document.createTextNode("Edited Pair of");
    editText1.appendChild(editTextNode1);
    var editText2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    editText2.setAttribute("x", "69%");
    editText2.setAttribute("y", "42.5%");
    editText2.setAttribute("font-size", "100%");
    editText2.setAttribute("text-anchor", "middle");
    var editTextNode2 = document.createTextNode("Binary Strings");
    editText2.appendChild(editTextNode2);
    legend.appendChild(editText1);
    legend.appendChild(editText2);

    var editBox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    editBox.setAttribute("x", "56.5%");
    editBox.setAttribute("y", "45%");
    editBox.setAttribute("width", "25%");
    editBox.setAttribute("height", 25 * aspectRatio + "%");
    editBox.setAttribute("fill", "#d18952");
    legend.appendChild(editBox);

    var disclaimerText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    disclaimerText.setAttribute("x", "50%");
    
    if (onMobile) {
        disclaimerText.setAttribute("y", "97.5%");
    } else {
        disclaimerText.setAttribute("y", "92.5%");
    }

    disclaimerText.setAttribute("font-size", "60%");
    disclaimerText.setAttribute("text-anchor", "middle");
    var disclaimerTextNode = document.createTextNode("If the edited pair of binary strings is the same as the selected pair,  the edited pair will not be displayed.");
    disclaimerText.appendChild(disclaimerTextNode);
    legend.appendChild(disclaimerText);
}