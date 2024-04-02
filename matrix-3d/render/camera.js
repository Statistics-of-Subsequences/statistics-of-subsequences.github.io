import * as WebGL from "./util/webgl-utils.js";

export default class GenericCamera {
    constructor(gl, width, height, position, orientation, projectionMatrix) {
        this.gl = gl;
        this.width = width;
        this.height = height;
        this.position = position;
        this.setOrientation(orientation);
        this.worldUp = new WebGL.vec3(0.0, 1.0, 0.0);
        this.projectionMatrix = projectionMatrix;
        this.speed = 0.1;
        this.sensitivity = 25.0;
    }

    setPosition(eye) {
        this.position = eye;
        this.target = WebGL.sub(this.position, this.orientation);
    }

    setTarget(target) {
        this.target = target;
        this.orientation = WebGL.normalize(sub(this.position, this.target));
    }

    setOrientation(orientation) {
        this.orientation = WebGL.normalize(orientation);
        this.target = WebGL.sub(this.position, this.orientation);
    }

    setWorldUp(worldUp) {
        this.worldUp = worldUp;
    }

    update(shader, uniform) {
        var viewMatrix = WebGL.lookAt(this.position, this.target, this.worldUp);

        var cameraMatrix = WebGL.mult(this.projectionMatrix, viewMatrix);
        this.gl.uniformMatrix4fv(this.gl.getUniformLocation(shader, uniform), false, WebGL.flatten(cameraMatrix));
    }
}