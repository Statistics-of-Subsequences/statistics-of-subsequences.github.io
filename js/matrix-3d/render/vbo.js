import { flatten } from "./util/webgl-utils.js";
import { Material } from "./objmtl.js";
import Vertex from "./vertex.js";

export default class VBO {
    constructor(gl, data) {
        this.gl = gl;
        this.id = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.id);

        // check if data is a list of vertices
        if (data[0] instanceof Vertex) {
            gl.bufferData(gl.ARRAY_BUFFER, flatten(Vertex.vertexArray(data)), gl.STATIC_DRAW);
        } else if (data instanceof Material) {
            gl.bufferData(gl.ARRAY_BUFFER, flatten(Material.materialArray(data)), gl.STATIC_DRAW);
        } else {
            gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vectorArray(data)), gl.STATIC_DRAW);
        }        
    }

    bind() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.id);
    }

    unbind() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    }

    delete() {
        this.gl.deleteBuffer(this.id);
    }

    vectorArray(vectors) {
        var vectorArray = [];
        for (var i = 0; i < vectors.length; i++) {
            vectorArray.push(vectors[i][0]);
            vectorArray.push(vectors[i][1]);
            vectorArray.push(vectors[i][2]);
        }
        return vectorArray;
    }
}