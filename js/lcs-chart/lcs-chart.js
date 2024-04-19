import generateGradient from "../gradient.js";

document.addEventListener("DOMContentLoaded", () => {
    document.cookie = "page=3;";
    document.querySelector("#generate").onclick = generateDistribution;

    const chart = document.querySelector("#chart");
    chart.onresize = () => {
        chart.canvas.getContext("2d").width = chart.clientWidth;
        chart.canvas.getContext("2d").height = chart.clientHeight;
    };

    const complement = document.querySelector("#remove-complement");
    const symm = document.querySelector("#symmetric-sort");
    symm.onchange = _e => {
        complement.disabled = symm.checked;
        if(symm.checked) {
            complement.checked = false;
        }
    };
    document.querySelector("#default-sort").onchange = _e =>complement.disabled = false;
    document.querySelector("#lexicographical-sort").onchange = _e =>complement.disabled = false;

    const n = document.querySelector("#n");
    const m = document.querySelector("#m");
    n.value = 1;
    m.value = 1;

    n.onchange = _e => {
        if(parseInt(n.value) > 5 && parseInt(m.value) > 5) {
            document.querySelector("#remove-max").checked = true;
            document.querySelector("#remove-max-1").checked = true;
        }
        if(parseInt(n.value) > 8 && parseInt(m.value) > 8 && !symm.checked) {
            complement.checked = true;
        }
    };
    m.onchange = _e => {
        if(parseInt(n.value) > 5 && parseInt(m.value) > 5) {
            document.querySelector("#remove-max").checked = true;
            document.querySelector("#remove-max-1").checked = true;
        }
        if(parseInt(n.value) > 8 && parseInt(m.value) > 8 && !symm.checked) {
            complement.checked = true;
        }
    };

    setupDefaultCanvas();
    setTimeout(setThemeRefresh, 0);
});

function setThemeRefresh() {
    const dayNightEnabled = document.querySelector("#day-theme");
    dayNightEnabled.addEventListener("click", async () => {
        if(chart) {
            generateDistribution();
        } else {
            setupDefaultCanvas();
        }
    });
}

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

    let fileName;
    if (n > m) {
        fileName = m + "x" + n + ".json";
    } else {
        fileName = n + "x" + m + ".json";
    }

    let gradientMap = generateGradient([0xfde724, 0x79d151, 0x29788e, 0x404387, 0x440154], Math.min(n,m) + 1);
    let barColors = [];

    const data = await fetch("../../res/files/" + fileName).then(r => r.json());
    let stringOccurrences = data.stringOccurrences;

    if(document.querySelector("#remove-max-min").checked) {
        stringOccurrences = stringOccurrences.filter(v => v[0].length !== Math.min(n, m) && v[0].length !== 0);
    }
    if(document.querySelector("#remove-max-1").checked) {
        stringOccurrences = stringOccurrences.filter(v => v[0].length !== Math.min(n, m) - 1);
    }
    if(document.querySelector("#remove-complement").checked) {
        stringOccurrences = stringOccurrences.filter(v => !v[0] || v[0].charAt(v[0].length - 1) !== "1");
    }

    switch(document.querySelector("input[name='sort-type']:checked").value) {
        case "symmetric":
            stringOccurrences = stringOccurrences.sort((a, b) => {
                a = a[0];
                b = b[0];
                if(!a || !b) {
                    // Empty string is always before other strings
                    return a.localeCompare(b);
                }

                let aEnd = a[a.length - 1];
                let bEnd = b[b.length - 1];
                if(aEnd !== bEnd) {
                    // String ending in 1 is always after string ending in 0
                    return aEnd.localeCompare(bEnd);
                }

                if(aEnd === "1") {
                    // Order between two strings of length 1 is inverse of order between two strings of length 0
                    [a, b] = [b, a];
                    [aEnd, bEnd] = [bEnd, aEnd];
                }
                
                const aEndCount = a.replaceAll(aEnd, "").length;
                const bEndCount = b.replaceAll(bEnd, "").length;

                if(aEndCount !== bEndCount) {
                    // String with less occurrences of character is always before string with more occurrences
                    return aEndCount - bEndCount;
                }

                if(a.length !== b.length) {
                    // Shorter strings are always before longer strings
                    return a.length - b.length;
                }

                // All else being equal, strings are then sorted lexicographically
                return a.localeCompare(b);
            });
            if(document.querySelector("#remove-complement").checked) {
                stringOccurrences.push(data.stringOccurrences[0]);
            }
            break;
        case "lexicographic":
            stringOccurrences = stringOccurrences.sort((a, b) => a[0].localeCompare(b[0]));
            break;
        default:
            console.log("Unexpected sort type recieved.");
        case "default":
            break;
    }

    let strings = [];
    let occurrences = [];

    for (let key in stringOccurrences) {
        strings.push("\"" + stringOccurrences[key][0] + "\"");
        occurrences.push(stringOccurrences[key][1]);
        barColors.push("#" + gradientMap[stringOccurrences[key][0].length].toString(16));
    }

    const scaleOptions = {
        y: {
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
        x: {
            title: {
                display: true,
                text: 'Longest Common Subsequence'
            },
            ticks: {
                maxRotation: 90,
                minRotation: 90
            }
        }
    };

    const zoomOptions = {
        limits: {
            y: { min: 0, max: Math.max(...occurrences) }
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
            indexAxis: 'x',
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

document.addEventListener('keydown', function(event) {
    if (event.key === 'r') {
        chart.resetZoom();
    }
});