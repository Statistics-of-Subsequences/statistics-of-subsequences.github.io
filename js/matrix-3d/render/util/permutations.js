export function group(n) {
    // return a list of all permutations of the set {0, 1, ..., n-1} using an iterative approach
    let perms = [[0]];
    for (let i = 1; i < n; i++) {
        let newPerms = [];
        for (let j = 0; j < perms.length; j++) {
            for (let k = 0; k <= i; k++) {
                let perm = perms[j].slice();
                perm.splice(k, 0, i);
                newPerms.push(perm);
            }
        }
        perms = newPerms;
    }
    return perms;
}

export function parity(perm) {
    // return the parity of a permutation
    let n = perm.length;
    let parity = 1;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (perm[i] > perm[j]) {
                parity *= -1;
            }
        }
    }
    return parity;
}

function arrayCycleNotation(perm) {
    // convert into cycle notation where each cycle is an array of elements
    if (perm instanceof Array) {
        let result = [];
        let completedElements = [];

        let element = 0;
        let mappedElement = 0;
        let cycleIndex = 0;

        completedElements.push(element);
        result.push([element]);

        while (completedElements.length < perm.length) {
            mappedElement = perm[element];
            if (result[cycleIndex].includes(mappedElement)) {
                cycleIndex++;
                completedElements.sort();

                // get difference between completedElements and perm
                element = perm.filter(x => !completedElements.includes(x))[0];
                completedElements.push(element);
                result.push([element]);
            } else {
                result[cycleIndex].push(mappedElement);
                completedElements.push(mappedElement);
                element = mappedElement;
            }
            mappedElement = element;
        }
        return result;
    } else if (typeof perm == "string") {
        return [...perm.matchAll(/(?:\d+,)*\d/gm)].map(x => x[0].split(",").map(y => parseInt(y)));
    }
}

export function switchNotation(perm) {
    if (perm instanceof Array) {
        // convert cycle notation into string
        let result = "";
        let amalgamateNotation = arrayCycleNotation(perm);
        for (let i = 0; i < amalgamateNotation.length; i++) {
            result += "(";
            for (let j = 0; j < amalgamateNotation[i].length; j++) {
                result += amalgamateNotation[i][j];
                if (j < amalgamateNotation[i].length - 1) {
                    result += ",";
                }
            }
            result += ")";
        }
        return result;
    } else if (typeof perm == "string") {
        // convert into array notation where each element is in its mapped postion
        let cycles = arrayCycleNotation(perm);
        let totalElements = [...perm.matchAll(/\d+/gm)].map(x => parseInt(x[0])).sort((a, b) => b - a)[0] + 1;

        let result = [];
        while (result.length < totalElements) {
            let i = 0;
            while (i < cycles.length) {
                if (cycles[i].includes(result.length)) {
                    result.push(cycles[i][(cycles[i].indexOf(result.length) + 1) % cycles[i].length]);
                    break;
                }
                i++;
            }
        }
        return result;
    }
}

export function mult(p, q) {
    let tape = [...arrayCycleNotation(p)];
    tape.push(...arrayCycleNotation(q));

    let maxElement = Math.max(...tape.flat()) + 1;

    let result = [];
    while (result.length < maxElement) {
        let mappedElement = result.length;
        for (let i = tape.length - 1; i >= 0; i--) {
            let cycle = tape[i];
            if (cycle.includes(mappedElement)) {
                let index = cycle.indexOf(mappedElement);
                mappedElement = cycle[(index + 1) % cycle.length];
            }
        }
        result.push(mappedElement);
    }

    return result;
}
