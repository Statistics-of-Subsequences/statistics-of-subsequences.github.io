export default function generateGradient(stops, steps) {
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