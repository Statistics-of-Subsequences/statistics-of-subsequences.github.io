export default class VAO {
    linkAttribute(gl, vbo, layout, numComponents, type, stride, offset) {
        vbo.bind();
        gl.vertexAttribPointer(layout, numComponents, type, false, stride, offset);
        gl.enableVertexAttribArray(layout);
        vbo.unbind();
    }

    // =============================================
    // ==== NOTE: The following is required in  ====
    // ===== OpenGL 3.3, but not in WebGL 2.0 ======
    // =============================================

    // constructor() {
    //     this.id = gl.createVertexArray();
    // }

    // bind() {
    //     gl.bindVertexArray(this.id);
    // }

    // unbind() {
    //     gl.bindVertexArray(null);
    // }

    // delete() {
    //     gl.deleteVertexArray(this.id);
    // }
}