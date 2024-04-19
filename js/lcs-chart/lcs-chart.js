import generateGradient from "../gradient.js";
const LINE_HEIGHT = 20;

let lock;
document.addEventListener("DOMContentLoaded", () => {
    lock = window.innerWidth > 600;
    document.cookie = "page=3;";
    document.querySelector("#generate").onclick = generateDistribution;

    const chart = document.querySelector("#chart");
    window.onresize = async () => {
        chart.width = chart.getBoundingClientRect().width;
        if (window.innerWidth > 600 && !lock) {
            chart.height = chart.width * 9 / 16;
            lock = window.innerWidth > 600;
            await refresh();
        } else if(window.innerWidth <= 600 && lock) {
            chart.height = window.innerHeight * 0.7;
            lock = window.innerWidth > 600;
            await refresh();
        }
    };

    const complement = document.querySelector("#remove-complement");
    const symm = document.querySelector("#symmetric-sort");
    symm.onchange = _e => {
        complement.disabled = symm.checked;
        if (symm.checked) {
            complement.checked = false;
        }
    };
    document.querySelector("#default-sort").onchange = _e => complement.disabled = false;
    document.querySelector("#lexicographical-sort").onchange = _e => complement.disabled = false;

    const n = document.querySelector("#n");
    const m = document.querySelector("#m");
    n.value = 1;
    m.value = 1;

    n.onchange = _e => {
        if (parseInt(n.value) > 5 && parseInt(m.value) > 5) {
            document.querySelector("#remove-max").checked = true;
            document.querySelector("#remove-max-1").checked = true;
        }
        if (parseInt(n.value) > 8 && parseInt(m.value) > 8 && !symm.checked) {
            complement.checked = true;
        }
    };
    m.onchange = _e => {
        if (parseInt(n.value) > 5 && parseInt(m.value) > 5) {
            document.querySelector("#remove-max").checked = true;
            document.querySelector("#remove-max-1").checked = true;
        }
        if (parseInt(n.value) > 8 && parseInt(m.value) > 8 && !symm.checked) {
            complement.checked = true;
        }
    };

    setTimeout(() => {
        setupDefaultCanvas();
        setThemeRefresh();
    }, 0);
});

async function refresh() {
    if (chart) {
        generateDistribution();
    } else {
        setupDefaultCanvas();
    }
};

function setThemeRefresh() {
    const sunButton = document.querySelector("#sun-wrapper");
    const moonButton = document.querySelector("#moon-wrapper");

    sunButton.addEventListener("click", refresh);
    moonButton.addEventListener("click", refresh);
}

function setupDefaultCanvas() {
    const chartArea = document.querySelector("#chart");
    const isNightMode = document.body.classList.contains("night-mode");

    // put text that says "Enter values for n and m to generate a distribution"
    let ctx = chartArea.getContext('2d');
    chartArea.width = chartArea.getBoundingClientRect().width;
    if (window.innerWidth > 600) {
        chartArea.height = chartArea.width * 9 / 16;
    } else {
        chartArea.height = window.innerHeight * 0.7;
    }
    ctx.font = "24px Arial";
    ctx.fillStyle = isNightMode ? "#f2f4fc" : "#171a26";
    ctx.textAlign = "center";
    if (window.innerWidth > 600) {
        ctx.fillText("Enter values for n and m to generate a distribution", chartArea.width / 2, chartArea.height / 2);
    } else {
        ctx.fillText("Enter values for n and m", chartArea.width / 2, chartArea.height / 2 - LINE_HEIGHT);
        ctx.fillText("to generate a distribution", chartArea.width / 2, chartArea.height / 2 + LINE_HEIGHT);
        //to generate a distribution
    }
}

let chart;

async function generateDistribution() {
    const chartArea = document.querySelector("#chart");
    // clear the canvas
    if (chart) {
        chart.destroy();
        chart = null;
    }
    
    chartArea.width = chartArea.getBoundingClientRect().width;
    if (window.innerWidth > 600) {
        chartArea.height = chartArea.width * 9 / 16;
    } else {
        chartArea.height = window.innerHeight * 0.7;
    }

    let n = parseInt(document.querySelector("#n").value);
    let m = parseInt(document.querySelector("#m").value);

    let fileName;
    if (n > m) {
        fileName = m + "x" + n + ".json";
    } else {
        fileName = n + "x" + m + ".json";
    }

    let gradientMap = generateGradient([0xfde724, 0x79d151, 0x29788e, 0x404387, 0x440154], Math.min(n, m) + 1);
    let barColors = [];

    const data = await fetch("../../res/files/" + fileName).then(r => r.json());
    let stringOccurrences = data.stringOccurrences;

    if(document.querySelector("#remove-max-min").checked) {
        stringOccurrences = stringOccurrences.filter(v => v[0].length !== Math.min(n, m) && v[0].length !== 0);
    }
    if (document.querySelector("#remove-max-1").checked) {
        stringOccurrences = stringOccurrences.filter(v => v[0].length !== Math.min(n, m) - 1);
    }
    if (document.querySelector("#remove-complement").checked) {
        stringOccurrences = stringOccurrences.filter(v => !v[0] || v[0].charAt(v[0].length - 1) !== "1");
    }

    switch (document.querySelector("input[name='sort-type']:checked").value) {
        case "symmetric":
            stringOccurrences = stringOccurrences.sort((a, b) => {
                a = a[0];
                b = b[0];
                if (!a || !b) {
                    // Empty string is always before other strings
                    return a.localeCompare(b);
                }

                let aEnd = a[a.length - 1];
                let bEnd = b[b.length - 1];
                if (aEnd !== bEnd) {
                    // String ending in 1 is always after string ending in 0
                    return aEnd.localeCompare(bEnd);
                }

                if (aEnd === "1") {
                    // Order between two strings of length 1 is inverse of order between two strings of length 0
                    [a, b] = [b, a];
                    [aEnd, bEnd] = [bEnd, aEnd];
                }

                const aEndCount = a.replaceAll(aEnd, "").length;
                const bEndCount = b.replaceAll(bEnd, "").length;

                if (aEndCount !== bEndCount) {
                    // String with less occurrences of character is always before string with more occurrences
                    return aEndCount - bEndCount;
                }

                if (a.length !== b.length) {
                    // Shorter strings are always before longer strings
                    return a.length - b.length;
                }

                // All else being equal, strings are then sorted lexicographically
                return a.localeCompare(b);
            });
            if (document.querySelector("#remove-complement").checked) {
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

    let scaleOptions = {
        y: {
            beginAtZero: true,
            type: "linear",
            ticks: { stepSize: 1 },
            title: {
                display: true,
                text: 'Number of Occurrences'
            }
        },
        x: {
            title: {
                display: true,
                text: 'LCS'
            },
            ticks: {
                maxRotation: 90,
                minRotation: 90
            }
        }
    };
    if (window.innerWidth <= 600) {
        scaleOptions = {
            x: {
                beginAtZero: true,
                type: "linear",
                ticks: { stepSize: 1 },
                title: {
                    display: true,
                    text: 'Number of Occurrences'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'LCS'
                }
            }
        };
    }

    let zoomOptions = {
        limits: {
            y: { min: 0, max: Math.max(...occurrences) }
        },
        pan: {
            enabled: true,
            mode: 'xy',
            threshold: 0
        },
        zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'xy',
        }
    };
    if (window.innerWidth <= 600) {
        zoomOptions.limits = { x: { min: 0, max: Math.max(...occurrences) } };
    }

    const isNightMode = document.body.classList.contains("night-mode");
    Chart.defaults.color = isNightMode ? "#f2f4fc" : "#171a26";
    Chart.defaults.font.size = 24;

    let titleText = `Distribution of Longest Common Subsequences of Strings of Length ${n} and ${m}`;
    let majorAxis = 'x';
    if (window.innerWidth <= 600) {
        titleText = ["Distribution of", "Longest Common Subsequences", `of Strings of Length ${n} and ${m}`];
        majorAxis = 'y';
    }

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
            indexAxis: majorAxis,
            scales: scaleOptions,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: titleText
                },
                zoom: zoomOptions
            }
        }
    });
}

document.addEventListener('keydown', function (event) {
    if (event.key === 'r' && chart) {
        chart.resetZoom();
    }
});