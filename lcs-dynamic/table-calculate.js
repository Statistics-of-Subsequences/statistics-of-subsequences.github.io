//Note: only stores values for partial LCS where both strings are non-empty, as otherwise value is clearly 0
export function generateLCSMemo(string1, string2) {
    //Initialize table
    let T = [];
    for (let i = 0; i < string1.length; i++) {
        T.push([]);
        for(let j = 0; j < string2.length; j++) {
            T[i].push(0);
        }
    }

    //Calculate partial LCS lengths
    for (let i = 0; i < string1.length; i++) {
        for (let j = 0; j < string2.length; j++) {
            if(string1[i] === string2[j]) {
                const diagVal = (i === 0 || j === 0) ? 0 : T[i - 1][j - 1];
                T[i][j] = diagVal + 1;
            } else {
                const upVal = (i === 0) ? 0 : T[i - 1][j];
                const leftVal = (j === 0) ? 0 : T[i][j - 1];
                T[i][j] = Math.max(upVal, leftVal);
            }
        }
    }

    return T;
}

// find all lcs of two strings, returning a map of possible LCS strings and all paths that can be taken to reach that string
export async function findAllLCS(string1, string2, memo) {
    let output = new Map();

    const toCheck = [{i: string1.length - 1, j: string2.length - 1, lcs: "", path: []}]
    let maxSize = 1;
    //Calculate partial LCS lengths
    while(toCheck.length > 0) {
        if(toCheck.length > maxSize) {
            maxSize = toCheck;
            console.log(maxSize);
        }
        const current = toCheck.shift();
        // If value doesn't change, then current cell is not part of LCS, and only need to check partials where value doesn't change
        // (which implies the current cell is not used)
        // If value does change, then current cell is part of LCS. Then both characters are consumed, so only check diagonal partial
        if(current.i >= 0 && current.j >= 0) {
            const upVal = (current.i === 0) ? 0 : memo[current.i - 1][current.j];
            const leftVal = (current.j === 0) ? 0 : memo[current.i][current.j - 1];
            const diagVal = (current.i === 0 || current.j === 0) ? 0 : memo[current.i - 1][current.j - 1];
            const same = (string1[current.i] === string2[current.j]) ? string1[current.i] : "";
            
            if(diagVal !== memo[current.i][current.j]) {
                if(upVal === memo[current.i][current.j]) {
                    toCheck.push({i: current.i - 1, j: current.j, lcs: current.lcs, path: current.path.concat({row: current.i, column: current.j, included: false})});
                } 
                if(leftVal === memo[current.i][current.j]) {
                    toCheck.push({i: current.i, j: current.j - 1, lcs: current.lcs, path: current.path.concat({row: current.i, column: current.j, included: false})});
                } else if(upVal !== memo[current.i][current.j]) {
                    toCheck.push({i: current.i - 1, j: current.j - 1, lcs: same + current.lcs, path: current.path.concat({row: current.i, column: current.j, included: same !== ""})});
                }
            } else {
                toCheck.push({i: current.i - 1, j: current.j - 1, lcs: same + current.lcs, path: current.path.concat({row: current.i, column: current.j, included: same !== ""})});
            }
        //At this point, partial cannot grow longer LCS, so just add to output (ignoring blank partials)
        } else if(current.lcs !== "") {
            if(!output.has(current.lcs)) {
                output.set(current.lcs, []);
            }

            output.get(current.lcs).push(current.path);
        }
    }

    return output;
}