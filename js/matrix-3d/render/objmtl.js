import * as WebGL from "./util/webgl-utils.js";

export class ObjectGroup {
    constructor(name) {
        this.name = name;
        this.vertices = [];
        this.normals = [];
        this.uvs = [];
        this.faces = [];
        this.material = null;
    }

    addVertex(vertex) {
        this.vertices.push(vertex);
    }

    addNormal(normal) {
        this.normals.push(normal);
    }

    addUV(uv) {
        this.uvs.push(uv);
    }

    addFace(face) {
        this.faces.push(face);
    }

    triangulate() {
        let newFaces = [];
        for (let i = 0; i < this.faces.length; i++) {
            let face = this.faces[i];
            let vertexIndices = face.vertexIndices;
            let normalIndices = face.normalIndices;
            let uvIndices = face.uvIndices;

            if (vertexIndices.length === 3) {
                newFaces.push(face);
            } else {
                for (let j = 1; j < vertexIndices.length - 1; j++) {
                    let newVertexIndices = [vertexIndices[0], vertexIndices[j], vertexIndices[j + 1]];
                    let newNormalIndices = [normalIndices[0], normalIndices[j], normalIndices[j + 1]];
                    let newUVIndices = [uvIndices[0], uvIndices[j], uvIndices[j + 1]];
                    newFaces.push(new Face(newVertexIndices, newNormalIndices, newUVIndices));
                }
            }
        }
        this.faces = newFaces;
    }
}

export class Material {
    constructor(name) {
        this.name = name;
        this.vertexCount = 1;
        this.ambient = WebGL.vec3();
        this.diffuse = WebGL.vec3();
        this.specular = WebGL.vec3();
        this.shininess = 0.0;
        this.diffuseMap = null;
        this.specularMap = null;
        this.bumpMap = null;
    }

    getKd() {
        return this.diffuse;
    }

    getMapKd() {
        return this.diffuseMap;
    }

    getMapKs() {
        return this.specularMap;
    }

    getBump() {
        return this.bumpMap;
    }

    static materialArray(material) {
        let materialArray = [];
        for (let i = 0; i < material.vertexCount; i++) {
            materialArray.push(material.ambient[0]);
            materialArray.push(material.ambient[1]);
            materialArray.push(material.ambient[2]);
            materialArray.push(material.diffuse[0]);
            materialArray.push(material.diffuse[1]);
            materialArray.push(material.diffuse[2]);
            materialArray.push(material.specular[0]);
            materialArray.push(material.specular[1]);
            materialArray.push(material.specular[2]);
            materialArray.push(material.shininess);
        }
        return materialArray;
    }
}

export class Face {
    constructor(vertexIndices, normalIndices, uvIndices) {
        this.vertexIndices = vertexIndices;
        this.normalIndices = normalIndices;
        this.uvIndices = uvIndices;
    }
}

export class OBJ {
    constructor() {
        this.vertices = [];
        this.normals = [];
        this.uvs = [];
        this.materials = [];
        this.objects = [];

        this.objFile = null;
    }

    getMaterial(materialName) {
        for (let i = 0; i < this.materials.length; i++) {
            let material = this.materials[i];
            if (material.name === materialName) {
                return material;
            }
        }
    }

    getObjectGroups() {
        return this.objects;
    }

    parseMTLFile(mtlFile) {
        // Sanitize the MTL file
        let mtlLines = mtlFile.split('\n');
        mtlLines = mtlLines.filter(line => {
            return (line.search(/\S/) !== -1);
        });
        mtlLines = mtlLines.map(line => {
            return line.trim();
        });

        let currentMaterial = null;
        for (let currLine = 0; currLine < mtlLines.length; currLine++) {
            let line = mtlLines[currLine];

            if (line.startsWith("newmtl")) { // Hit a new material
                this.materials.push(currentMaterial);
                currentMaterial = new Material(line.split(" ")[1]);
            }
            else if (line.startsWith("Ka")) { // Material ambient definition
                let values = line.match(/[+-]?([0-9]+[.])?[0-9]+/g);
                currentMaterial.ambient = WebGL.vec3(parseFloat(values[0]), parseFloat(values[1]), parseFloat(values[2]));
            }
            else if (line.startsWith("Kd")) { // Material diffuse definition
                let values = line.match(/[+-]?([0-9]+[.])?[0-9]+/g);
                currentMaterial.diffuse = WebGL.vec3(parseFloat(values[0]), parseFloat(values[1]), parseFloat(values[2]));
            }
            else if (line.startsWith("Ks")) { // Material specular definition
                let values = line.match(/[+-]?([0-9]+[.])?[0-9]+/g);
                currentMaterial.specular = WebGL.vec3(parseFloat(values[0]), parseFloat(values[1]), parseFloat(values[2]));
            }
            else if (line.startsWith("Ns")) { // Material shininess definition
                let values = line.match(/[+-]?([0-9]+[.])?[0-9]+/g);
                currentMaterial.shininess = parseFloat(values[0]);
            }
            else if (line.startsWith("map_Kd")) { // Material diffuse texture definition
                currentMaterial.diffuseMap = line.split(" ")[1];
            } else if (line.startsWith("map_Ks")) { // Material specular texture definition
                currentMaterial.specularMap = line.split(" ")[1];
            } else if (line.startsWith("map_bump")) { // Material bump texture definition
                currentMaterial.bumpMap = line.split(" ")[1];
            }
        }
        this.materials.push(currentMaterial);

        // Remove the null material
        this.materials.shift();
    }

    parseOBJFile(objLines, currLine) {
        let currentObjectIndex = -1;

        for (; currLine < objLines.length; currLine++) {
            let line = objLines[currLine];

            if (line.startsWith("v ")) { // Vertex position definition
                let coords = line.match(/[+-]?([0-9]+[.])?[0-9]+/g);
                this.vertices.push(WebGL.vec3(parseFloat(coords[0]), parseFloat(coords[1]), parseFloat(coords[2])));
            } else if (line.startsWith("vt")) { // Vertex UV definition
                let coords = line.match(/[+-]?([0-9]+[.])?[0-9]+/g);
                this.uvs.push(WebGL.vec2(parseFloat(coords[0]), 1.0 - parseFloat(coords[1])));
            } else if (line.startsWith("vn")) { // Vertex normal definition
                let coords = line.match(/[+-]?([0-9]+[.])?[0-9]+/g);
                this.normals.push(WebGL.vec3(parseFloat(coords[0]), parseFloat(coords[1]), parseFloat(coords[2])));
            } else if (line.charAt(0) === 'g') { // Object group definition
                let objectName = line.split(" ")[1];
                this.objects.push(new ObjectGroup(objectName));
                currentObjectIndex++;
            } else if (line.startsWith("usemtl")) { // Material definition
                let materialName = line.split(" ")[1];
                this.objects[currentObjectIndex].material = this.getMaterial(materialName);
            } else if (line.charAt(0) === 'f') {
                let currentObject = this.objects[currentObjectIndex];
                let faceVertexIndices = [];
                let faceUVIndices = [];
                let faceNormalIndices = [];

                // Extract the v/vt/vn statements into an array
                let indices = line.match(/[0-9\/]+/g);

                // Account for how vt/vn can be omitted
                let types = indices[0].match(/[\/]/g).length;

                if (types === 0) { // Only v provided
                    throw new Error("Vertex normals and UV coordinates are required.");
                }
                else if (types === 1) { // v and vt provided
                    throw new Error("Vertex normals are required.");
                }
                else if (types === 2) { // v, maybe vt, and vn provided
                    let slashIndex = indices[0].indexOf('/');
                    if (indices[0].charAt(slashIndex + 1) === '/') { // vt omitted
                        throw new Error("Vertex UV coordinates are required.");
                    } else { // vt provided
                        indices.forEach(value => {
                            let firstSlashIndex = value.indexOf('/');
                            let secondSlashIndex = value.indexOf('/', firstSlashIndex + 1);

                            // split the values
                            let vertexValue = value.substring(0, firstSlashIndex);
                            let uvValue = value.substring(firstSlashIndex + 1, secondSlashIndex);
                            let normalValue = value.substring(secondSlashIndex + 1);

                            // get the vertex
                            let vertexIndex = parseInt(vertexValue) - 1;
                            let vertex = this.vertices[vertexIndex];

                            // if vertex is already in the list of vertices in the current material group, use that vertex
                            // otherwise, add the vertex to the list of vertices in the current material group
                            vertexIndex = currentObject.vertices.indexOf(vertex);
                            if (vertexIndex === -1) {
                                currentObject.addVertex(vertex);
                                vertexIndex = currentObject.vertices.length - 1;
                            }

                            // add the vertex index to the face's vertex indices
                            faceVertexIndices.push(vertexIndex);

                            // get the uv
                            let uvIndex = parseInt(uvValue) - 1;
                            let uv = this.uvs[uvIndex];

                            // if uv is already in the list of uvs in the current material group, use that uv
                            // otherwise, add the uv to the list of uvs in the current material group
                            uvIndex = currentObject.uvs.indexOf(uv);
                            if (uvIndex === -1) {
                                currentObject.addUV(uv);
                                uvIndex = currentObject.uvs.length - 1;
                            }

                            // add the uv index to the face's uv indices
                            faceUVIndices.push(uvIndex);

                            // get the normal
                            let normalIndex = parseInt(normalValue) - 1;
                            let normal = this.normals[normalIndex];

                            // if normal is already in the list of normals in the current material group, use that normal
                            // otherwise, add the normal to the list of normals in the current material group
                            normalIndex = currentObject.normals.indexOf(normal);
                            if (normalIndex === -1) {
                                currentObject.addNormal(normal);
                                normalIndex = currentObject.normals.length - 1;
                            }

                            // add the normal index to the face's normal indices
                            faceNormalIndices.push(normalIndex);
                        });
                    }
                }

                // add the face to the current material group
                currentObject.addFace(new Face(faceVertexIndices, faceNormalIndices, faceUVIndices));
            }
        }
    }
}