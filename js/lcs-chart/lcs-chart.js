document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("#generate").onclick = generateDistribution;
    const chart = document.querySelector("#chart");
    chart.onresize = () => {
        chart.canvas.getContext("2d").width = chart.clientWidth;
        chart.canvas.getContext("2d").height = chart.clientHeight;
    };
    setupDefaultCanvas();
});

function setupDefaultCanvas() {
    const chartArea = document.querySelector("#chart");
    const isNightMode = document.body.classList.contains("night-mode");

    // put text that says "Enter values for n and m to generate a distribution"
    let ctx = chartArea.getContext('2d');
    ctx.canvas.width = chartArea.clientWidth;
    ctx.canvas.height = chartArea.clientHeight;
    ctx.font = "24px Arial";
    ctx.fillStyle = isNightMode ? "#f2f4fc" : "#171a26";
    ctx.textAlign = "center";
    ctx.fillText("Enter values for n and m to generate a distribution", chartArea.width / 2, chartArea.height / 2);
}

let chart;

async function generateDistribution() {
    const chartArea = document.querySelector("#chart");
    // clear the canvas
    if (chart) {
        chart.destroy();
    }

    let n = parseInt(document.querySelector("#n").value);
    let m = parseInt(document.querySelector("#m").value);

    let strings = [];
    let occurrences = [];

    let fileName;
    if (n > m) {
        fileName = m + "x" + n + ".json";
    } else {
        fileName = n + "x" + m + ".json";
    }

    let gradientMap = generateGradient([0xfde724, 0x79d151, 0x29788e, 0x404387, 0x440154], Math.min(n,m) + 1);
    let barColors = [];
    for (let i = 0; i <= Math.min(n,m); i++) {
        let color = "#" + gradientMap[i].toString(16);
        for (let j = 0; j < Math.pow(2, i); j++) {
            barColors.push(color);
        }
    }

    const data = await fetch("../../res/files/" + fileName).then(r => r.json());
    let stringOccurrences = data.stringOccurrences;

    for (let key in stringOccurrences) {
        strings.push("\"" + stringOccurrences[key][0] + "\"");
        occurrences.push(stringOccurrences[key][1]);
    }

    const scaleOptions = {
        x: {
            beginAtZero: true,
            type: "linear",
            ticks: {
                stepSize: 1
            },
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
            threshold: 0
        },
        zoom: {
            wheel: {
                enabled: true,
            },
            mode: 'xy',
        }
    };

    const isNightMode = document.body.classList.contains("night-mode");
    Chart.defaults.color = isNightMode ? "#f2f4fc" : "#171a26";
    Chart.defaults.font.size = 24;
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
    let colors = [];

    for (let i = 0; i < steps; i++) {
        colors[i] = getPercent(stops, i / (steps - 1));
    }

    return colors;
}

function interpolate(start, end, percent) {
    let red = (start >> 16) * (1 - percent) + (end >> 16) * percent;
    let green = ((start >> 8) & 0xff) * (1 - percent) + ((end >> 8) & 0xff) * percent;
    let blue = (start & 0xff) * (1 - percent) + (end & 0xff) * percent;
    let color = (red << 16) + (green << 8) + blue;
    return Math.floor(color);
}

function getPercent(stops, percent) {
    let step = 1.0 / (stops.length - 1);
    for (let i = 0; i < stops.length - 1; i++) {
        // if percent in between stops i and i + 1
        if (percent >= step * i && percent <= step * (i + 1)) {
            return interpolate(stops[i], stops[i + 1], (percent - step * i) / step);
        }
    }
    return -1;
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'r') {
        chart.resetZoom();
    }
});