var nBox, mBox, chartArea, chart;

function setup() {
    nBox = document.getElementById("n");
    mBox = document.getElementById("m");
    chartArea = document.getElementById('chart');

    nBox.value = "1";
    mBox.value = "1";

    // add listener to nBox and mBox
    // if mBox tries to be less than nBox, set mBox to nBox
    // if nBox tries to be greater than mBox, set nBox to mBox
    // if nBox or mBox is not a number, set it to 1
    nBox.addEventListener('input', function() {
        if (parseInt(nBox.value) > parseInt(mBox.value)) {
            mBox.value = nBox.value;
        } else if (parseInt(nBox.value) < 1) {
            nBox.value = "1";
        }
    });

    mBox.addEventListener('input', function() {
        if (parseInt(mBox.value) < parseInt(nBox.value)) {
            nBox.value = mBox.value;
        } else if (parseInt(mBox.value) < 1) {
            mBox.value = "1";
        }
    });

    setupDefaultCanvas();
}

function setupDefaultCanvas() {
    // make chartArea fill the screen minus the header
    chartArea.width = window.innerWidth / 2;
    chartArea.height = window.innerHeight / 2 - 150;
    chartArea.style.border = "1px solid black";

    // put text that says "Enter values for n and m to generate a distribution"
    var ctx = chartArea.getContext('2d');
    ctx.font = "24px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText("Enter values for n and m to generate a distribution", chartArea.width / 2, chartArea.height / 2);
}

async function generateDistribution() {
    // clear the canvas
    if (chart != null) {
        chart.destroy();
    }
    chartArea.style.border = "";

    var n = parseInt(nBox.value);
    var m = parseInt(mBox.value);

    var strings = [];
    var occurrences = [];

    if (n > m) {
        var fileName = m + "x" + n + ".json";
    } else {
        var fileName = n + "x" + m + ".json";
    }

    var gradientMap = generateGradient([0xfde724, 0x79d151, 0x29788e, 0x404387, 0x440154], Math.min(n,m) + 1);
    var barColors = [];
    for (var i = 0; i <= Math.min(n,m); i++) {
        var color = "#" + gradientMap[i].toString(16);
        for (var j = 0; j < Math.pow(2, i); j++) {
            barColors.push(color);
        }
    }

    // resize the canvas height proportional to the number of strings
    chartArea.parentNode.style.width = "50%";
    chartArea.height = window.innerHeight / 2 - 150 + 50 * Math.pow(2, Math.min(n, m));

    const jsonResponse = await fetch("https://statistics-of-subsequences.github.io/res/files/" + fileName);
    var json = await jsonResponse.text();
    var data = JSON.parse(json);
    var stringOccurrences = data.stringOccurrences;

    for (var key in stringOccurrences) {
        strings.push("\"" + stringOccurrences[key][0] + "\"");
        occurrences.push(stringOccurrences[key][1]);
    }

    const scaleOptions = {
        x: {
            beginAtZero: true,
            title: {
                display: true,
                text: 'Number of Occurrences'
            }
        },
        y: {
            title: {
                display: true,
                text: 'Longest Common Subsequence'
                    }
        }
    };

    const zoomOptions = {
        limits: {
            x: { min: 0, max: Math.max(...occurrences) }
        },
        pan: {
            enabled: true,
            mode: 'xy',
        },
        zoom: {
            wheel: {
                enabled: true,
            },
            mode: 'xy',
        }
    };

    chart = new Chart(chartArea, {
        type: 'bar',
        data: {
            labels: strings,
            datasets: [{
                label: 'Number of Occurrences',
                data: occurrences,
                backgroundColor: barColors,
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            scales: scaleOptions,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Distribution of Longest Common Subsequences of Strings of Length ' + n + ' and ' + m
                },
                zoom: zoomOptions
            }
        }
    });
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

document.addEventListener('keydown', function(event) {
    if (event.key == 'r') {
        chart.resetZoom();
    }
});