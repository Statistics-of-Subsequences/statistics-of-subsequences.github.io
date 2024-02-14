from collections import namedtuple

vec2 = namedtuple('vec2', ['x', 'y'])
vec3 = namedtuple('vec3', ['x', 'y', 'z'])
RGBColor = namedtuple('RGBColor', ['red', 'green', 'blue'])
FaceComponents = namedtuple('FaceComponents', ['faces', 'firstComponent', 'secondComponent', 'nextVertexIndex'])

class Face:
    def __init__(self, *args):
        if len(args) == 1:
            self.vertexIndices = args[0]
            self.uvIndices = None
            self.normalIndex = -1
        elif len(args) == 2:
            self.vertexIndices = args[0]
            self.uvIndices = None
            self.normalIndex = args[1]
        elif len(args) == 3:
            self.vertexIndices = args[0]
            self.uvIndices = args[1]
            self.normalIndex = args[2]

    def isPlane(self):
        uniquePointsCount = 0
        for i in range(len(self.vertexIndices)):
            unique = True
            for j in range(len(self.vertexIndices)):
                if i != j and self.vertexIndices[i] == self.vertexIndices[j]:
                    unique = False
            if unique:
                uniquePointsCount += 1
        return uniquePointsCount >= 3

    def equals(self, other):
        if len(self.vertexIndices) != len(other.vertexIndices):
            return False
        for i in range(len(self.vertexIndices)):
            contains = False
            for j in range(len(self.vertexIndices)):
                if self.vertexIndices[i] == other.vertexIndices[j]:
                    contains = True
            if not contains:
                return False
        return True

    def faceString(self):
        faceString = "f"
        for i in range(len(self.vertexIndices)):
            faceString += " " + str(self.vertexIndices[i] + 1)
            if self.uvIndices is not None:
                faceString += "/" + str(self.uvIndices[i] + 1)
                if self.normalIndex != -1:
                    faceString += "/" + str(self.normalIndex)
            elif self.normalIndex != -1:
                faceString += "//" + str(self.normalIndex)
        return faceString

class ObjectGroup:
    def __init__(self, *args):
        if len(args) == 2:
            self.id = args[0]
            self.faces = []
            self.material = args[1]
        elif len(args) == 3:
            self.id = args[0]
            self.faces = args[1]
            self.material = args[2]

    def addFaces(self, faces):
        self.faces.extend(faces)

    def objectString(self):
        if len(self.faces) > 0:
            objectString = "g " + self.id + "\n"
            objectString += "usemtl " + self.material + "\n"

            for face in self.faces:
                objectString += face.faceString() + "\n"
            return objectString
        return ""

class CubeObjectGroup(ObjectGroup):
    def __init__(self, id, front, back, right, left, top, bottom, material):
        super().__init__(id, material)
        self.front = front
        self.back = back
        self.right = right
        self.left = left
        self.top = top
        self.bottom = bottom

    def objectString(self):
        objectString = "g " + self.id + "\n"
        objectString += "usemtl " + self.material + "\n"

        if self.front.isPlane():
            objectString += self.front.faceString() + "\n"
        if self.back.isPlane():
            objectString += self.back.faceString() + "\n"
        if self.right.isPlane():
            objectString += self.right.faceString() + "\n"
        if self.left.isPlane():
            objectString += self.left.faceString() + "\n"
        objectString += self.top.faceString() + "\n"
        if not self.bottom.equals(self.top):
            objectString += self.bottom.faceString() + "\n"
        return objectString

# ===============================================================================

def addVector(a, b):
    return vec3(a.x + b.x, a.y + b.y, a.z + b.z)

def scaleVector(vector, scalar):
    return vec3(vector.x * scalar, vector.y * scalar, vector.z * scalar)

def genStringSet(length):
    # Generate all binary strings of length n
    if length == 0:
        return ['']
    else:
        return ['0' + s for s in genStringSet(length - 1)] + ['1' + s for s in genStringSet(length - 1)]

def lcsLength(x, y):
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

    return T[n][m]

def constructMatrix(n, m):
    nStrings = genStringSet(n)
    mStrings = genStringSet(m)
    nSize = 2 ** n
    mSize = 2 ** m

    matrix = [[0] * (mSize + 2) for _ in range(nSize + 2)]
    for i in range(nSize):
        for j in range(mSize):
            matrix[i + 1][j + 1] = lcsLength(nStrings[i], mStrings[j])

    return matrix

def createGradient(stops, steps):
    colors = []
    for i in range(steps):
        color = getPercent(stops, i / (steps - 1))
        red = color >> 16
        green = (color >> 8) & 0xff
        blue = color & 0xff

        sRed = red / 255.0
        sGreen = green / 255.0
        sBlue = blue / 255.0

        colors.append(RGBColor(sRed, sGreen, sBlue))
    return colors

def interpolate(start, end, percent):
    red = int((start >> 16) * (1 - percent) + (end >> 16) * percent)
    green = int(((start >> 8) & 0xff) * (1 - percent) + ((end >> 8) & 0xff) * percent)
    blue = int((start & 0xff) * (1 - percent) + (end & 0xff) * percent)
    return (red << 16) + (green << 8) + blue

def getPercent(stops, percent):
    step = 1.0 / (len(stops) - 1)
    for i in range(len(stops) - 1):
        if percent >= step * i and percent <= step * (i + 1):
            return interpolate(stops[i], stops[i + 1], (percent - step * i) / step)
    return -1

# ===============================================================================

def modelZero(bit, position, scaleFactor, vertexList, nextVertexIndex):
    zeroVertices = [
        vec3(0.054, 0.000, 0.019),  # 0
        vec3(0.054, 0.000, 0.000),  # 1
        vec3(0.079, 0.000, 0.004),  # 2
        vec3(0.067, 0.000, 0.021),  # 3
        vec3(0.078, 0.000, 0.028),  # 4
        vec3(0.093, 0.000, 0.014),  # 5
        vec3(0.104, 0.000, 0.031),  # 6
        vec3(0.084, 0.000, 0.039),  # 7
        vec3(0.087, 0.000, 0.053),  # 8
        vec3(0.108, 0.000, 0.053),  # 9
        vec3(0.108, 0.000, 0.132),  # 10
        vec3(0.087, 0.000, 0.132),  # 11
        vec3(0.104, 0.000, 0.154),  # 12
        vec3(0.084, 0.000, 0.146),  # 13
        vec3(0.078, 0.000, 0.157),  # 14
        vec3(0.093, 0.000, 0.171),  # 15
        vec3(0.079, 0.000, 0.181),  # 16
        vec3(0.067, 0.000, 0.164),  # 17
        vec3(0.054, 0.000, 0.166),  # 18
        vec3(0.054, 0.000, 0.185),  # 19
        vec3(0.029, 0.000, 0.181),  # 20
        vec3(0.041, 0.000, 0.164),  # 21
        vec3(0.030, 0.000, 0.157),  # 22
        vec3(0.015, 0.000, 0.171),  # 23
        vec3(0.004, 0.000, 0.154),  # 24
        vec3(0.024, 0.000, 0.146),  # 25
        vec3(0.021, 0.000, 0.132),  # 26
        vec3(0.000, 0.000, 0.132),  # 27
        vec3(0.000, 0.000, 0.053),  # 28
        vec3(0.021, 0.000, 0.053),  # 29
        vec3(0.004, 0.000, 0.031),  # 30
        vec3(0.024, 0.000, 0.039),  # 31
        vec3(0.030, 0.000, 0.028),  # 32
        vec3(0.015, 0.000, 0.014),  # 33
        vec3(0.029, 0.000, 0.004),  # 34
        vec3(0.041, 0.000, 0.021),  # 35
    ]

    vertexIndices = [
        0, 1, 2, 3,
        3, 2, 5, 4,
        4, 5, 6, 7,
        7, 6, 9, 8,
        8, 9, 10, 11,
        11, 10, 12, 13,
        13, 12, 15, 14,
        14, 15, 16, 17,
        17, 16, 19, 18,
        18, 19, 20, 21,
        21, 20, 23, 22,
        22, 23, 24, 25,
        25, 24, 27, 26,
        28, 29, 26, 27,
        29, 28, 30, 31,
        31, 30, 33, 32,
        32, 33, 34, 35,
        35, 34, 1, 0
    ]

    zeroVertices = [addVector(scaleVector(vertex, scaleFactor), position)
                    for vertex in zeroVertices]
    vertexList.extend(zeroVertices)

    faces = []
    for i in range(0, len(vertexIndices), 4):
        faceVertexIndices = [vertexIndices[i] + nextVertexIndex, vertexIndices[i + 1] + nextVertexIndex,
                             vertexIndices[i + 2] + nextVertexIndex, vertexIndices[i + 3] + nextVertexIndex]
        face = Face(faceVertexIndices, [0, 0, 0, 0], 1)
        faces.append(face)

    position = addVector(position, scaleVector(vec3(0.108 + 0.0125, 0.0, 0.0), scaleFactor))
    return FaceComponents(faces, position, vertexList, nextVertexIndex + len(zeroVertices))

def modelOne(bit, position, scaleFactor, vertexList, nextVertexIndex):
    oneVertices = [
        vec3(0.030, 0.000, 0.002),  # 0
        vec3(0.052, 0.000, 0.002),  # 1
        vec3(0.052, 0.000, 0.183),  # 2
        vec3(0.030, 0.000, 0.183),  # 3
        vec3(0.000, 0.000, 0.166),  # 4
        vec3(0.000, 0.000, 0.145),  # 5
        vec3(0.030, 0.000, 0.159),  # 6
    ]

    vertexIndices = [
        0, 1, 2, 3,
        3, 4, 5, 6
    ]

    oneVertices = [addVector(scaleVector(vertex, scaleFactor), position)
                   for vertex in oneVertices]
    vertexList.extend(oneVertices)

    faces = []
    for i in range(0, len(vertexIndices), 4):
        faceVertexIndices = [vertexIndices[i] + nextVertexIndex, vertexIndices[i + 1] + nextVertexIndex,
                             vertexIndices[i + 2] + nextVertexIndex, vertexIndices[i + 3] + nextVertexIndex]
        face = Face(faceVertexIndices, [0, 0, 0, 0], 1)
        faces.append(face)

    position = addVector(position, scaleVector(vec3(0.052 + 0.025, 0.0, 0.0), scaleFactor))
    return FaceComponents(faces, position, vertexList, nextVertexIndex + len(oneVertices))

def constructFace(vertices, vertexList, vertexMap, normalIndex, nextVertexIndex):
    vertexIndices = [0, 0, 0, 0]
    uvIndices = [0, 0, 0, 0]

    for i in range(4):
        vertexString = str(vertices[i])
        if vertexString in vertexMap:
            vertexIndices[i] = vertexMap[vertexString]
        else:
            vertexList.append(vertices[i])
            vertexMap[vertexString] = nextVertexIndex
            vertexIndices[i] = nextVertexIndex
            nextVertexIndex += 1

    return FaceComponents(Face(vertexIndices, uvIndices, normalIndex), vertexList, vertexMap, nextVertexIndex)

def genObj(n, m, objWriter):
    objWriter.write("mtllib model_" + str(n) + "x" + str(m) + ".mtl\n\n")
    lcsMatrix = constructMatrix(n, m)
    base = 0

    vertexMap = {}
    nextVertexIndex = 0

    vertices = []
    uvs = [vec2(0.0, 0.0)]
    normals = [
        vec3(1.0, 0.0, 0.0),
        vec3(-1.0, 0.0, 0.0),
        vec3(0.0, 1.0, 0.0),
        vec3(0.0, -1.0, 0.0),
        vec3(0.0, 0.0, 1.0),
        vec3(0.0, 0.0, -1.0)
    ]
    objects = []

    # create matrix objects
    for x in range(1, len(lcsMatrix) - 1):
        for z in range(1, len(lcsMatrix[x]) - 1):
            y = lcsMatrix[x][z]
            id = "Object(" + str(x) + "," + str(z) + ")[length_" + str(y) + "]"
            front, back, right, left, top, bottom = None, None, None, None, None, None
            material = "length_" + str(y)

            frontHeight = lcsMatrix[x][z - 1]
            backHeight = lcsMatrix[x][z + 1]
            rightHeight = lcsMatrix[x + 1][z]
            leftHeight = lcsMatrix[x - 1][z]

            if y <= frontHeight:
                frontHeight = y
            if y <= backHeight:
                backHeight = y
            if y <= rightHeight:
                rightHeight = y
            if y <= leftHeight:
                leftHeight = y

            # front face vertices
            frontVertices = [
                vec3(x - 1, base + y, z - 1),
                vec3(x - 1, base + frontHeight, z - 1),
                vec3(x, base + frontHeight, z - 1),
                vec3(x, base + y, z - 1)
            ]

            # back face vertices
            backVertices = [
                vec3(x, base + y, z),
                vec3(x, base + backHeight, z),
                vec3(x - 1, base + backHeight, z),
                vec3(x - 1, base + y, z)
            ]

            # right face vertices
            rightVertices = [
                vec3(x, base + y, z - 1),
                vec3(x, base + rightHeight, z - 1),
                vec3(x, base + rightHeight, z),
                vec3(x, base + y, z)
            ]

            # left face vertices
            leftVertices = [
                vec3(x - 1, base + y, z),
                vec3(x - 1, base + leftHeight, z),
                vec3(x - 1, base + leftHeight, z - 1),
                vec3(x - 1, base + y, z - 1)
            ]

            # top face vertices
            topVertices = [
                vec3(x - 1, base + y, z),
                vec3(x - 1, base + y, z - 1),
                vec3(x, base + y, z - 1),
                vec3(x, base + y, z)
            ]

            # bottom face vertices
            bottomVertices = [
                vec3(x, base, z),
                vec3(x, base, z - 1),
                vec3(x - 1, base, z - 1),
                vec3(x - 1, base, z)
            ]

            # front
            frontFace = constructFace(frontVertices, vertices, vertexMap, 5, nextVertexIndex)
            front = frontFace.faces
            vertices = frontFace.firstComponent
            vertexMap = frontFace.secondComponent
            nextVertexIndex = frontFace.nextVertexIndex

            # back
            backFace = constructFace(backVertices, vertices, vertexMap, 6, nextVertexIndex)
            back = backFace.faces
            vertices = backFace.firstComponent
            vertexMap = backFace.secondComponent
            nextVertexIndex = backFace.nextVertexIndex

            # right
            rightFace = constructFace(rightVertices, vertices, vertexMap, 1, nextVertexIndex)
            right = rightFace.faces
            vertices = rightFace.firstComponent
            vertexMap = rightFace.secondComponent
            nextVertexIndex = rightFace.nextVertexIndex

            # left
            leftFace = constructFace(leftVertices, vertices, vertexMap, 2, nextVertexIndex)
            left = leftFace.faces
            vertices = leftFace.firstComponent
            vertexMap = leftFace.secondComponent
            nextVertexIndex = leftFace.nextVertexIndex

            # top
            topFace = constructFace(topVertices, vertices, vertexMap, 3, nextVertexIndex)
            top = topFace.faces
            vertices = topFace.firstComponent
            vertexMap = topFace.secondComponent
            nextVertexIndex = topFace.nextVertexIndex

            # bottom
            bottomFace = constructFace(bottomVertices, vertices, vertexMap, 4, nextVertexIndex)
            bottom = bottomFace.faces
            vertices = bottomFace.firstComponent
            vertexMap = bottomFace.secondComponent
            nextVertexIndex = bottomFace.nextVertexIndex

            # create object mesh
            object = CubeObjectGroup(id, front, back, right, left, top, bottom, material)
            objects.append(object)

    # create labels
    nAllZeroesWidth = 0.108 * n + 0.0125 * (n - 1)
    mAllZeroesWidth = 0.108 * m + 0.0125 * (m - 1)
    limit = 0.60
    scaleFactor = min(1.25, limit / max(nAllZeroesWidth, mAllZeroesWidth))

    # center each label to each cell
    position = vec3(0.0, 0.0, 0.0)
    for x in range(2 ** n):
        label = bin(x)[2:].zfill(n)

        labelWidth = 0
        for bit in range(n):
            currentBit = int(label[bit])
            if currentBit == 0:
                labelWidth += 0.108 if bit + 1 == n else 0.108 + 0.0125
            else:
                labelWidth += 0.052 if bit + 1 == n else 0.052 + 0.025

        position = vec3((1.0 - labelWidth * scaleFactor) / 2.0 + x, 0.0, -0.5)

        object = ObjectGroup("Label(x," + label + ")[string_label]", [], "string_label")
        for bit in range(n):
            currentBit = int(label[bit])

            if currentBit == 0:
                result = modelZero(bit, position, scaleFactor, vertices, nextVertexIndex)
            else:
                result = modelOne(bit, position, scaleFactor, vertices, nextVertexIndex)

            faces = result.faces
            position = result.firstComponent
            vertices = result.secondComponent
            nextVertexIndex = result.nextVertexIndex

            object.addFaces(faces)

        objects.append(object)

    for y in range(2 ** m):
        label = bin(y)[2:].zfill(m)

        labelWidth = 0
        for bit in range(m):
            currentBit = int(label[bit])
            if currentBit == 0:
                labelWidth += 0.108 if bit + 1 == m else 0.108 + 0.0125
            else:
                labelWidth += 0.052 if bit + 1 == m else 0.052 + 0.025

        position = vec3(-0.25 - labelWidth * scaleFactor, 0.0, (1.0 - 0.185 * scaleFactor) / 2.0 + y)

        object = ObjectGroup("Label(y," + label + ")[string_label]", [], "string_label")
        for bit in range(m):
            currentBit = int(label[bit])

            if currentBit == 0:
                result = modelZero(bit, position, scaleFactor, vertices, nextVertexIndex)
            else:
                result = modelOne(bit, position, scaleFactor, vertices, nextVertexIndex)

            faces = result.faces
            position = result.firstComponent
            vertices = result.secondComponent
            nextVertexIndex = result.nextVertexIndex

            object.addFaces(faces)

        objects.append(object)
        position = vec3(2 ** n + 1, 0.0, y + 1)

    # write vertices
    for vertex in vertices:
        objWriter.write("v " + str(vertex.x) + " " + str(vertex.y) + " " + str(vertex.z) + "\n")
    objWriter.write("\n")

    # write uvs
    for uv in uvs:
        objWriter.write("vt " + str(uv.x) + " " + str(uv.y) + "\n")
    objWriter.write("\n")

    # write normals
    for normal in normals:
        objWriter.write("vn " + str(normal.x) + " " + str(normal.y) + " " + str(normal.z) + "\n")
    objWriter.write("\n")

    # write objects
    for object in objects:
        objWriter.write(object.objectString() + "\n")

def genMtl(n, m, mtlWriter):
    numColors = min(n, m) + 1
    colors = createGradient([0xfde724, 0x79d151, 0x29788e, 0x404387, 0x440154], numColors)
    for i in range(numColors):
        color = colors[i]

        mtlWriter.write("newmtl length_" + str(i) + "\n")
        mtlWriter.write("Ka " + str(color.red) + " " + str(color.green) + " " + str(color.blue) + "\n")
        mtlWriter.write("Kd " + str(color.red) + " " + str(color.green) + " " + str(color.blue) + "\n")
        mtlWriter.write("Ks " + str(color.red) + " " + str(color.green) + " " + str(color.blue) + "\n")
        mtlWriter.write("Ke 0.0 0.0 0.0\n")
        mtlWriter.write("Ns 10.0\n")
        mtlWriter.write("Ni 1.45\n")
        mtlWriter.write("d 1.0\n")
        mtlWriter.write("illum 2\n")

        mtlWriter.write("\n")

    mtlWriter.write("newmtl string_label\n")
    mtlWriter.write("Ka 0.0 0.0 0.0\n")
    mtlWriter.write("Kd 0.0 0.0 0.0\n")
    mtlWriter.write("Ks 0.0 0.0 0.0\n")
    mtlWriter.write("Ke 0.0 0.0 0.0\n")
    mtlWriter.write("Ns 10.0\n")
    mtlWriter.write("Ni 1.45\n")
    mtlWriter.write("d 1.0\n")
    mtlWriter.write("illum 2")

# ===============================================================================

def generate(n, m):
    with open(f"res/models/model_{n}x{m}.obj", "w") as objWriter:
        genObj(n, m, objWriter)

    with open(f"res/models/model_{n}x{m}.mtl", "w") as mtlWriter:
        genMtl(n, m, mtlWriter)

# ===============================================================================

if __name__ == "__main__":
    for n in range(1, 6):
        for m in range(1, 6):
            generate(n, m)