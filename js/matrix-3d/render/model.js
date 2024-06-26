import * as WebGL from "./util/webgl-utils.js";
import Texture from "./texture.js";
import Mesh from "./mesh.js";
import Vertex from "./vertex.js";
import { OBJ } from "./objmtl.js";
import { modelMatrix, reflectionMatrix } from "../matrix-3d.js";

export default class Model {
    constructor(gl, fileName, shader) {
        this.gl = gl;
        this.meshes = [];
        this.selectedMesh = -1;
        this.kSelectedMesh = -1;
        this.modelLoaded = false;
        this.parseFile(fileName, this.meshes, shader);
    }

    draw(shader, camera) {
        for (let i = 0; i < this.meshes.length; i++) {
            this.meshes[i].draw(this.gl, shader, camera);
        }
    }

    select(index) {
        if (this.selectedMesh != -1) {
            this.deselectAll();
        }
        this.meshes[index].select();
        this.selectedMesh = index;
    }

    selectK(index) {
        if (this.kSelectedMesh != -1) {
            this.deselectK();
        }
        if (index != this.selectedMesh) {
            this.meshes[index].selectK();
            this.kSelectedMesh = index;
        }
    }

    deselect() {
        if (this.selectedMesh != -1) {
            this.meshes[this.selectedMesh].deselect();
            this.selectedMesh = -1;
        }
    }

    deselectK() {
        if (this.kSelectedMesh != -1 && this.kSelectedMesh != this.selectedMesh) {
            this.meshes[this.kSelectedMesh].deselect();
            this.kSelectedMesh = -1;
        }
    }

    deselectAll() {
        this.deselect();
        this.deselectK();
    }

    static constructMesh(objectGroup, material, shader) {
        // extract material properties
        let diffuseColor = material.getKd();
        let textureMap = material.getMapKd();
        let specularMap = material.getMapKs();
        let bumpMap = material.getBump();

        // extract geometry data
        let vertices = [];
        let normals = [];
        let uvs = [];
        let indices = [];

        let meshVertices = objectGroup.vertices;
        let meshNormals = objectGroup.normals;
        let meshUVs = objectGroup.uvs;

        for (let i = 0; i < objectGroup.faces.length; i++) {
            let face = objectGroup.faces[i];
            let faceVertices = face.vertexIndices;
            let faceNormals = face.normalIndices;
            let faceUVs = face.uvIndices;

            for (let j = 0; j < faceVertices.length; j++) {
                let vertex = meshVertices[faceVertices[j]];
                let normal = meshNormals[faceNormals[j]];
                let uv = meshUVs[faceUVs[j]];

                vertices.push(vertex[0]);
                vertices.push(vertex[1]);
                vertices.push(vertex[2]);

                normals.push(normal[0]);
                normals.push(normal[1]);
                normals.push(normal[2]);

                uvs.push(uv[0]);
                uvs.push(uv[1]);

                indices.push(indices.length);
            }
        }

        // create mesh
        let vertexList = [];
        let indexList = [];
        let textureList = [];

        // add vertices and indices to mesh
        let i;
        let minX, maxX, minY, maxY, minZ, maxZ;
        for (i = 0; i < vertices.length / 3; i++) {
            let x = vertices[i * 3 + 0];
            let y = vertices[i * 3 + 1];
            let z = vertices[i * 3 + 2];
            let nx = normals[i * 3 + 0];
            let ny = normals[i * 3 + 1];
            let nz = normals[i * 3 + 2];
            let r = diffuseColor[0];
            let g = diffuseColor[1];
            let b = diffuseColor[2];
            let u = uvs[i * 2 + 0];
            let v = uvs[i * 2 + 1];
            let vertex = new Vertex(WebGL.vec3(x, y, z), WebGL.vec3(nx, ny, nz), WebGL.vec3(r, g, b), WebGL.vec2(u, v));
            vertexList.push(vertex);

            // Ignore text, which is all black
            if (r !== 0 || g !== 0 || b !== 0) {
                minX = (minX === undefined) ? x : Math.min(minX, x);
                maxX = (maxX === undefined) ? x : Math.max(maxX, x);
                minY = (minY === undefined) ? y : Math.min(minY, y);
                maxY = (maxY === undefined) ? y : Math.max(maxY, y);
                minZ = (minZ === undefined) ? z : Math.min(minZ, z);
                maxZ = (maxZ === undefined) ? z : Math.max(maxZ, z);
            }
        }

        for (i = 0; i < indices.length; i++) {
            indexList.push(indices[i]);
        }

        // create textures
        if (textureMap != null) {
            let texture = new Texture(this.gl, textureMap, "diffuse", 0);
            textureList.push(texture);
        }
        if (specularMap != null) {
            let texture = new Texture(this.gl, specularMap, "specular", 1);
            textureList.push(texture);
        }
        if (bumpMap != null) {
            let texture = new Texture(this.gl, bumpMap, "normal", 2);
            textureList.push(texture);
        }

        return { mesh: new Mesh(vertexList, indexList, material, textureList, shader), 
            bounds: { minX, minY, minZ, maxX, maxY, maxZ } };
    }

    async parseFile(fileName, meshList, shader) {
        // get renderable objects
        let obj = new OBJ();

        // get obj file contents
        const objResponse = await fetch("../../res/models/" + fileName);
        obj.objFile = await objResponse.text();

        // Split and sanitize OBJ file input
        let objLines = obj.objFile.split('\n');
        objLines = objLines.filter(line => {
            return (line.search(/\S/) !== -1);
        });
        objLines = objLines.map(line => {
            return line.trim();
        });

        // Get lines in OBJ file until material library definition
        let currLine = 0;
        let line = objLines[currLine];
        while (!line.startsWith("mtllib")) { // Material library definition
            line = objLines[++currLine];
        }

        let materialLibraryName = line.split(" ")[1];

        // get MTL file contents
        const mtlResponse = await fetch("../../res/models/" + materialLibraryName);
        let mtlFile = await mtlResponse.text();

        // parse MTL file
        obj.parseMTLFile(mtlFile);

        // parse OBJ file
        obj.parseOBJFile(objLines, currLine + 1);

        // get object groups
        let objectGroups = obj.getObjectGroups();

        let minX, maxX, minY, maxY, minZ, maxZ;
        // construct meshes
        for (let i = 0; i < objectGroups.length; i++) {
            let objectGroup = objectGroups[i];
            objectGroup.triangulate();
            let material = objectGroups[i].material;
            let { mesh, bounds } = Model.constructMesh(objectGroup, material, shader);
            meshList.push(mesh);
            
            // Godawful way of preventing null and undefined values from deleting results
            if(bounds.minX != undefined && bounds.minY != undefined && bounds.minZ != undefined && bounds.maxX != undefined && bounds.maxY != undefined && bounds.maxZ != undefined) {
                minX = (minX === undefined) ? bounds.minX : Math.min(minX, bounds.minX);
                maxX = (maxX === undefined) ? bounds.maxX : Math.max(maxX, bounds.maxX);
                minY = (minY === undefined) ? bounds.minY : Math.min(minY, bounds.minY);
                maxY = (maxY === undefined) ? bounds.maxY : Math.max(maxY, bounds.maxY);
                minZ = (minZ === undefined) ? bounds.minZ : Math.min(minZ, bounds.minZ);
                maxZ = (maxZ === undefined) ? bounds.maxZ : Math.max(maxZ, bounds.maxZ);
            }
        }

        this.bounds = {
            min: WebGL.vec3(minX, minY, minZ),
            max: WebGL.vec3(maxX, maxY, maxZ),
            center: WebGL.mix(WebGL.vec3(minX, minY, minZ), WebGL.vec3(maxX, maxY, maxZ), 0.5)
        };

        // convert bounds from local space to world space
        let inverseReflectionMatrix = WebGL.inverse(reflectionMatrix);

        this.bounds.min = WebGL.mult(WebGL.mult(inverseReflectionMatrix, modelMatrix), WebGL.vec4(this.bounds.min[0], this.bounds.min[1], this.bounds.min[2], 1.0)).slice(0, 3);
        this.bounds.max = WebGL.mult(WebGL.mult(inverseReflectionMatrix, modelMatrix), WebGL.vec4(this.bounds.max[0], this.bounds.max[1], this.bounds.max[2], 1.0)).slice(0, 3);
        this.bounds.center = WebGL.mix(this.bounds.min, this.bounds.max, 0.5);

        this.modelLoaded = true;
    }
}
