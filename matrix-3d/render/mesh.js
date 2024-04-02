
import { flatten, vec3 } from "./util/webgl-utils.js";
import VAO from "./vao.js";
import VBO from "./vbo.js";
import EBO from "./ebo.js";
import { Material } from "./objmtl.js";

export default class Mesh {
    constructor(vertices, indices, material, textures, shader) {
        this.vertices = vertices;
        this.indices = indices;
        this.material = material;
        this.backupMaterial = material;
        this.textures = textures;
        this.isSelected = 0;
        this.vao = new VAO();        
    }

    select() {
        this.material = this.backupMaterial;

        let selectedMaterial = new Material("selectedMaterial");
        selectedMaterial.ambient = vec3(0.5568, 0.2470, 0.1607);
        selectedMaterial.diffuse = vec3(0.5568, 0.2470, 0.1607);
        selectedMaterial.specular = vec3(0.5568, 0.2470, 0.1607);
        selectedMaterial.shininess = 10.0;

        this.backupMaterial = this.material;
        this.material = selectedMaterial;
        this.isSelected = 1;
    }

    selectK() {
        this.material = this.backupMaterial;

        let selectedMaterial = new Material("selectedMaterial");
        selectedMaterial.ambient = vec3(0.8196, 0.5333, 0.3215);
        selectedMaterial.diffuse = vec3(0.8196, 0.5333, 0.3215);
        selectedMaterial.specular = vec3(0.8196, 0.5333, 0.3215);
        selectedMaterial.shininess = 10.0;

        this.backupMaterial = this.material;
        this.material = selectedMaterial;
        this.isSelected = 2;
    }

    deselect() {
        this.material = this.backupMaterial;
        this.isSelected = 0;
    }

    draw(gl, shader, camera) {
        gl.useProgram(shader);

        // bind textures
        let numDiffuse = 0;
        let numSpecular = 0;
        let numNormal = 0;
        for (let i = 0; i < this.textures.length; i++) {
            let num = "";
            let type = this.textures[i].type;
            if (type == "diffuse") {
                num = numDiffuse++;
            } else if (type == "specular") {
                num = numSpecular++;
            } else if (type == "normal") {
                num = numNormal++;
            }
            this.textures[i].textureUnit(shader, type + num, i);
        }

        // define attribute layouts
        let vertexPosition = gl.getAttribLocation(shader, "vertexPosition");
        let vertexNormal = gl.getAttribLocation(shader, "vertexNormal");
        let vertexColor = gl.getAttribLocation(shader, "vertexColor");
        let vertexUV = gl.getAttribLocation(shader, "vertexUV");
        let vertexAmbient = gl.getAttribLocation(shader, "vertexAmbient");
        let vertexSpecular = gl.getAttribLocation(shader, "vertexSpecular");
        let vertexShininess = gl.getAttribLocation(shader, "vertexShininess");

        // duplicate material for each vertex
        this.material.vertexCount = this.vertices.length;

        // bind VAO
        let vbo = new VBO(gl, this.vertices);
        let materialVBO = new VBO(gl, this.material);
        let ebo = new EBO(gl, this.indices);

        // link VBO attributes to VAO
        this.vao.linkAttribute(gl, vbo, vertexPosition, 3, gl.FLOAT, 8 * 4, 0 * 4);
        this.vao.linkAttribute(gl, vbo, vertexNormal, 3, gl.FLOAT, 8 * 4, 3 * 4);
        this.vao.linkAttribute(gl, vbo, vertexUV, 2, gl.FLOAT, 8 * 4, 6 * 4);
        this.vao.linkAttribute(gl, materialVBO, vertexAmbient, 3, gl.FLOAT, 10 * 4, 0 * 4);
        this.vao.linkAttribute(gl, materialVBO, vertexColor, 3, gl.FLOAT, 10 * 4, 3 * 4);
        this.vao.linkAttribute(gl, materialVBO, vertexSpecular, 3, gl.FLOAT, 10 * 4, 6 * 4);
        this.vao.linkAttribute(gl, materialVBO, vertexShininess, 1, gl.FLOAT, 10 * 4, 9 * 4);

        // bind EBO
        ebo.bind();

        // unbind all to prevent accidental modification
        vbo.unbind();
        materialVBO.unbind();

        // bind camera
        gl.uniform3fv(gl.getUniformLocation(shader, "cameraPosition"), flatten(camera.position));
        camera.update(shader, "cameraMatrix");

        // draw elements
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    }
}