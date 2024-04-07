import * as WebGL from "./render/util/webgl-utils.js";
import Controller from "./render/util/controller.js";
import { viewport, camera, cameraStatus, initializeMLC, gl, shaderProgram, objectModel } from "./matrix-3d.js";

export function registerController(canvas) {
    const controller = new Controller();
    controller.keyPress = function (keys) {
        if (!objectModel.modelLoaded) {
            return;
        }
        
        if (keys.indexOf("KeyZ") != -1) {
            cameraStatus.isAnimating = true;
        }

        if (keys.indexOf("KeyR") != -1) {
            resetCamera();
        }

        if (!cameraStatus.isAnimating) {
            if (cameraStatus.isPerspective) {
                if (keys.indexOf("KeyW") != -1) {
                    console.log(camera.orientation.map(v => v * 360 / 2 / Math.PI));
                    camera.setPosition(WebGL.rotateOffset(camera.position, WebGL.vec3(1.0, 0.0, 0.0), objectModel.bounds.middle, WebGL.radians(camera.speed * 50)));
                    camera.setTarget(WebGL.vec3(0.0, 0.0, 0.0));
                }
                if (keys.indexOf("KeyA") != -1) {
                    camera.setPosition(WebGL.rotateOffset(camera.position, WebGL.vec3(0.0, 1.0, 0.0), objectModel.bounds.middle, WebGL.radians(camera.speed * 50)));
                    camera.setTarget(WebGL.vec3(0.0, 0.0, 0.0));
                }
                if (keys.indexOf("KeyS") != -1) {
                    camera.setPosition(WebGL.rotateOffset(camera.position, WebGL.vec3(1.0, 0.0, 0.0), objectModel.bounds.middle, WebGL.radians(-camera.speed * 50)));
                    camera.setTarget(WebGL.vec3(0.0, 0.0, 0.0));
                }
                if (keys.indexOf("KeyD") != -1) {
                    camera.setPosition(WebGL.rotateOffset(camera.position, WebGL.vec3(0.0, 1.0, 0.0), objectModel.bounds.middle, WebGL.radians(-camera.speed * 50)));
                    camera.setTarget(WebGL.vec3(0.0, 0.0, 0.0));
                }
            } else {
                if (keys.indexOf("KeyW") != -1) {
                    camera.setPosition(WebGL.add(camera.position, WebGL.scale(camera.speed, WebGL.vec3(0.0, 0.0, 1.0))));
                }
                if (keys.indexOf("KeyA") != -1) {
                    camera.setPosition(WebGL.add(camera.position, WebGL.scale(camera.speed, WebGL.vec3(1.0, 0.0, 0.0))));
                }
                if (keys.indexOf("KeyS") != -1) {
                    camera.setPosition(WebGL.add(camera.position, WebGL.scale(-camera.speed, WebGL.vec3(0.0, 0.0, 1.0))));
                }
                if (keys.indexOf("KeyD") != -1) {
                    camera.setPosition(WebGL.add(camera.position, WebGL.scale(-camera.speed, WebGL.vec3(1.0, 0.0, 0.0))));
                }
                if (keys.indexOf("Space") != -1) {
                    const n = parseInt(document.querySelector("#n").value);
                    const m = parseInt(document.querySelector("#m").value);
                    const width = canvas.width;
                    const height = canvas.height;
                    const aspectRatio = width / height;
                    viewport.orthoSize += 0.1 * Math.min(n, m);
                    viewport.orthoEye = WebGL.vec3(camera.position[0], viewport.orthoSize, camera.position[2]);
                    viewport.orthoMatrix = WebGL.ortho(2 * viewport.orthoSize * aspectRatio, 2 * viewport.orthoSize, 0.1, 100.0);
                    camera.projectionMatrix = viewport.orthoMatrix;
                    camera.setPosition(viewport.orthoEye);
                }
                if (keys.indexOf("ShiftLeft") != -1) {
                    const n = parseInt(document.querySelector("#n").value);
                    const m = parseInt(document.querySelector("#m").value);
                    const width = canvas.width;
                    const height = canvas.height;
                    const aspectRatio = width / height;
                    viewport.orthoSize -= 0.1 * Math.min(n, m);
                    viewport.orthoEye = WebGL.vec3(camera.position[0], viewport.orthoSize, camera.position[2]);
                    viewport.orthoMatrix = WebGL.ortho(2 * viewport.orthoSize * aspectRatio, 2 * viewport.orthoSize, 0.1, 100.0);
                    camera.projectionMatrix = viewport.orthoMatrix;
                    camera.setPosition(viewport.orthoEye);
                }
            }
        }
    };

    controller.mousemove = function(prevMousePos, currMousePos, event) {
        if (event.buttons == 1 && cameraStatus.isPerspective) {
            rotateCamera(currMousePos[0] - prevMousePos[0], currMousePos[1] - prevMousePos[1]);
        } else if (event.buttons == 2 && !cameraStatus.isPerspective) {
            panCamera(currMousePos[0] - prevMousePos[0], currMousePos[1] - prevMousePos[1]);
        }
    };

    controller.wheel = function(delta) {
        const width = canvas.width;
        const height = canvas.height;
        const aspectRatio = width / height;
        zoomCamera(delta, aspectRatio);
    };

    controller.pinch = controller.wheel;
    controller.twoFingerDrag = function (drag) {
        panCamera(drag[0], drag[1]);
    };

    controller.registerForCanvas(canvas);
}

export function rotateCamera(deltaX, deltaY) {
    if (!cameraStatus.isAnimating && cameraStatus.isPerspective && objectModel.modelLoaded) {
        console.log(camera.orientation.map(v => 2 * Math.PI / v));
        let rotX = camera.sensitivity * deltaX / 100;
        let rotY = camera.sensitivity * deltaY / 100;

        camera.setPosition(WebGL.rotateOffset(camera.position, WebGL.vec3(0.0, 1.0, 0.0), objectModel.bounds.middle, WebGL.radians(-rotX)));
        camera.setPosition(WebGL.rotateOffset(camera.position, WebGL.normalize(WebGL.cross(camera.orientation, camera.worldUp)), objectModel.bounds.middle, WebGL.radians(rotY)));
        camera.setTarget(WebGL.vec3(0.0, 0.0, 0.0));
    }
}

export function panCamera(deltaX, deltaY) {
    if (!cameraStatus.isAnimating) {
        let panX = -camera.sensitivity * deltaX / 1000;
        let panY = -camera.sensitivity * deltaY / 1000;

        if (cameraStatus.isPerspective) {
            let newPosition = WebGL.add(camera.position, WebGL.add(WebGL.scale(panX, WebGL.normalize(WebGL.cross(camera.orientation, camera.worldUp))), WebGL.scale(panY, camera.worldUp)));
            camera.setPosition(newPosition);
        } else {
            let newPosition = WebGL.add(camera.position, WebGL.add(WebGL.scale(panX, WebGL.vec3(1.0, 0.0, 0.0)), WebGL.scale(panY, WebGL.vec3(0.0, 0.0, 1.0))));
            camera.setPosition(newPosition);
        }
    }
}

export function zoomCamera(delta, aspectRatio) {
    if (!cameraStatus.isAnimating) {
        let zoom = camera.sensitivity * delta / 10000;

        if (cameraStatus.isPerspective) {
            let newPosition = WebGL.add(camera.position, WebGL.scale(zoom, camera.orientation));
            camera.setPosition(newPosition);
        } else {
            const n = parseInt(document.querySelector("#n").value);
            const m = parseInt(document.querySelector("#m").value);
            viewport.orthoSize += zoom * Math.min(n, m);
            viewport.orthoEye = WebGL.vec3(camera.position[0], viewport.orthoSize, camera.position[2]);
            viewport.orthoMatrix = WebGL.ortho(-viewport.orthoSize * aspectRatio, viewport.orthoSize * aspectRatio, -viewport.orthoSize, viewport.orthoSize, 0.1, 100.0);
            camera.projectionMatrix = viewport.orthoMatrix;
            camera.setPosition(viewport.orthoEye);
        }
    }
}

export function resetCamera() {
    if (!cameraStatus.isAnimating) {
        const wrapper = document.querySelector("#window-wrapper").getBoundingClientRect();
        const width = wrapper.width;
        const height = wrapper.height;
        initializeMLC(width, height, width / height);
        cameraStatus.isPerspective = true;
        camera.isPerspective = true;
        cameraStatus.time = -1.0;
    }
}