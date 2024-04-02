export default class FBO {
    constructor(gl, width, height) {
        this.gl = gl;
        this.width = width;
        this.height = height;

        // create and bind the framebuffer
        this.fboID = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboID);

        // create and bind the texture
        this.textureID = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.textureID);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, this.width, this.height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.textureID, 0);

        // create and bind the renderbuffer
        this.renderbufferID = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbufferID);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbufferID);

        // check if the framebuffer is complete
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error('Framebuffer is not complete');
        }

        // unbind the framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    getTextureID() {
        return this.textureID;
    }

    bind() {
        this.glbindFramebuffer(this.glFRAMEBUFFER, this.fboID);
        this.glviewport(0, 0, this.width, this.height);
    }

    unbind() {
        this.glbindFramebuffer(this.glFRAMEBUFFER, null);
        this.glviewport(0, 0, this.glcanvas.width, this.glcanvas.height);
    }

    delete() {
        this.gldeleteFramebuffer(this.fboID);
        this.gldeleteTexture(this.textureID);
        this.gldeleteRenderbuffer(this.renderbufferID);
    }
}