export default class EBO {
    constructor(gl, indices) {
        this.ebo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    }

    bind(gl) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
    }

    unbind(gl) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    bufferData(gl, data) {
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
    }
}