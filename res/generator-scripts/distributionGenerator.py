def genStringSet(length, sigma):
    # Generate all strings of length n over an alphabet of size sigma
    if length == 0:
        return ['']
    else:
        if sigma < 1 or sigma > 16:
            return []
        else:
            # all hexadecimal characters
            symbols = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']
            return [s + x for s in symbols[:sigma] for x in genStringSet(length - 1, sigma)]

def lcsTable(x, y):
    # calculate length of x and y
    n, m = len(x), len(y)

    # initialize table
    T = [[0] * (m + 1) for _ in range(n + 1)]

    # fill the memoization table
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if x[i - 1] == y[j - 1]:
                T[i][j] = T[i - 1][j - 1] + 1
            else:
                T[i][j] = max(T[i - 1][j], T[i][j - 1])

    return T

def allLCS(x, y, T):
    n = len(x)
    m = len(y)

    # if either string is empty, return empty string
    if n == 0 or m == 0:
        return ['']
    
    # if the last characters of x and y are the same, all LCSs must end with that character
    if x[n - 1] == y[m - 1]:
        lcs = allLCS(x[:-1], y[:-1], T)
        return [s + x[n - 1] for s in lcs]
    
    # if the left cell is greater than the top cell, move left
    if T[n - 1][m] > T[n][m - 1]:
        return allLCS(x[:-1], y, T)
    
    # if the top cell is greater than the left cell, move up
    if T[n][m - 1] > T[n - 1][m]:
        return allLCS(x, y[:-1], T)

    # if the left and top cells are equal, move in both directions
    top = allLCS(x[:-1], y, T)
    left = allLCS(x, y[:-1], T)

    # merge the two lists
    return top + left

def lcsSet(x, y):
    # generate the memoization table
    T = lcsTable(x, y)

    # find all LCSs
    lcs = allLCS(x, y, T)

    # return the unique LCSs
    return list(set(lcs))

# ===============================================================================

def generate(n, m, sigma):
    # generate all binary strings of length n and m
    nStrings = genStringSet(n, sigma)
    mStrings = genStringSet(m, sigma)

    # find all LCSs of each pair of strings
    occurrences = {}
    for nString in nStrings:
        for mString in mStrings:
            lcs = lcsSet(nString, mString)
            for l in lcs:
                if l in occurrences:
                    occurrences[l] += 1
                else:
                    occurrences[l] = 1
    
    # sort occurrences by key length
    occurrences = {k: v for k, v in sorted(occurrences.items(), key=lambda item: len(item[0]))}

    # create JSON file with each key-value pair as an array
    with open('res/files/' + str(n) + 'x' + str(m) + '-sigma' + str(sigma) + '.json', 'w') as f:
        f.write("{\n\t\"stringOccurrences\": [\n")
        for key in occurrences:
            f.write("\t\t[\"" + key + "\", " + str(occurrences[key]) + "],\n")
        f.seek(f.tell() - 3, 0) # remove last comma
        f.write("\n\t]\n}")
        f.close()

# ===============================================================================

if __name__ == "__main__":
    for i in range(1, 11):
        for j in range(i, 11):
            generate(i, j, 2)