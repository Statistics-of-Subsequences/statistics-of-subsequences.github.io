def genStringSet(length):
    # Generate all binary strings of length n
    if length == 0:
        return ['']
    else:
        return ['0' + s for s in genStringSet(length - 1)] + ['1' + s for s in genStringSet(length - 1)]


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


def lcsSet(x, y):
    T = lcsTable(x, y)

    Q = [(len(x), len(y), "")]
    S = set()
    while Q:
        i, j, s = Q.pop(0)

        if i == 0 or j == 0:
            S.add(s)
        elif x[i - 1] == y[j - 1]:
            Q.append((i - 1, j - 1, x[i - 1] + s))
        else:
            if T[i - 1][j] >= T[i][j - 1]:
                Q.append((i - 1, j, s))
            if T[i][j - 1] >= T[i - 1][j]:
                Q.append((i, j - 1, s))
    return S

# ===============================================================================


def generate(n, m):
    # generate all binary strings of length n and m
    nStrings = genStringSet(n)
    mStrings = genStringSet(m)

    # find all LCSs of each pair of strings
    occurrences = {}
    if n == m:
        for i in range(len(nStrings)):
            for j in range(i, len(mStrings)):
                lcs = lcsSet(nStrings[i], mStrings[j])
                for l in lcs:
                    if l in occurrences:
                        occurrences[l] += 1
                    else:
                        occurrences[l] = 1
    else:
        for nString in nStrings:
            for mString in mStrings:
                lcs = lcsSet(nString, mString)
                for l in lcs:
                    if l in occurrences:
                        occurrences[l] += 1
                    else:
                        occurrences[l] = 1

    # sort occurrences by key length
    occurrences = {k: v for k, v in sorted(
        occurrences.items(), key=lambda item: len(item[0]))}

    # create JSON file with each key-value pair as an array
    with open('res/files/' + str(n) + 'x' + str(m) + '.json', 'w') as f:
        f.write("{\n\t\"stringOccurrences\": [\n")
        for key in occurrences:
            f.write("\t\t[\"" + key + "\", " + str(occurrences[key]) + "],\n")
        f.seek(f.tell() - 3, 0)  # remove last comma
        f.write("\n\t]\n}")
        f.close()


for i in range(1, 11):
    for j in range(i, 11):
        generate(i, j)