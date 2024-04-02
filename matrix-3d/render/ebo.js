export default class EBO {
    constructor(gl, indices) {
        this.gl = gl;
        this.ebo = gl.createBuffer();
        gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    }

    bind() {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ebo);
    }

    unbind() {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    }

    bufferData(data) {
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
    }
}