//Note: only stores values for partial LCS where both strings are non-empty, as otherwise value is clearly 0
export function generateLCSMemo(string1, string2) {
    //Initialize table
    let T = [];
    for (let i = 0; i < string1.length; i++) {
        T.push([]);
        for(let j = 0; j < string2.length; j++) {
            T[i].push({len: 0, lcs: [""]});
        }
    }

    //Calculate partial LCS lengths and LCS
    for (let i = 0; i < string1.length; i++) {
        for (let j = 0; j < string2.length; j++) {
            if(string1[i] === string2[j]) {
                const diagLen = (i === 0 || j === 0) ? 0 : T[i - 1][j - 1].len;
                const diagStrings = (i === 0 || j === 0) ? [""] : T[i - 1][j - 1].lcs;
                T[i][j] = {len: diagLen + 1, lcs: diagStrings.map(v => v + string1[i])};
            } else {
                const upLen = (i === 0) ? 0 : T[i - 1][j].len;
                const leftLen = (j === 0) ? 0 : T[i][j - 1].len;
                const upStrings = (i === 0) ? [""] : T[i - 1][j].lcs;
                const leftStrings = (j === 0) ? [""] : T[i][j - 1].lcs;

                if(upLen > leftLen) {
                    T[i][j] = {len: upLen, lcs: upStrings};
                } else if(leftLen > upLen) {
                    T[i][j] = {len: leftLen, lcs: leftStrings};
                } else {
                    T[i][j] = {len: upLen, lcs: upStrings.concat(leftStrings).filter((v, i, a) => a.indexOf(v) === i)};
                }
            }
        }
    }

    return T;
}

export function findOccurences(str, lcs) {
    if(str === "") { //Failed subsequence
        return [[lcs === ""]];
    }

    if(str[0] === lcs[0]) {
        return [...findOccurences(str.substring(1), lcs.substring(1)).map(a => {a.unshift(1); return a;}),
                ...findOccurences(str.substring(1), lcs).map(a => {a.unshift(0); return a;})];
    }

    return findOccurences(str.substring(1), lcs).map(a => {a.unshift(0); return a;});
}