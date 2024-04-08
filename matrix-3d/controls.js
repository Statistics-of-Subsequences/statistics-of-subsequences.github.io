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
                let target = WebGL.cross(camera.orientation, camera.worldUp);

                if (keys.indexOf("KeyW") != -1 && camera.orientation[1] < 0.9999) {
                    camera.setPosition(WebGL.rotateOffset(camera.position, target, WebGL.vec3(objectModel.bounds.center[0], 0.0, objectModel.bounds.center[2]), WebGL.radians(camera.speed * 50)));
                    camera.setTarget(WebGL.vec3(objectModel.bounds.center[0], 0.0, objectModel.bounds.center[2]));
                }
                if (keys.indexOf("KeyA") != -1) {
                    camera.setPosition(WebGL.rotateOffset(camera.position, camera.worldUp, WebGL.vec3(objectModel.bounds.center[0], 0.0, objectModel.bounds.center[2]), WebGL.radians(-camera.speed * 50)));
                    camera.setTarget(WebGL.vec3(objectModel.bounds.center[0], 0.0, objectModel.bounds.center[2]));
                }
                if (keys.indexOf("KeyS") != -1 && camera.orientation[1] > 0.0001) {
                    camera.setPosition(WebGL.rotateOffset(camera.position, target, WebGL.vec3(objectModel.bounds.center[0], 0.0, objectModel.bounds.center[2]), WebGL.radians(-camera.speed * 50)));
                    camera.setTarget(WebGL.vec3(objectModel.bounds.center[0], 0.0, objectModel.bounds.center[2]));
                }
                if (keys.indexOf("KeyD") != -1) {
                    camera.setPosition(WebGL.rotateOffset(camera.position, camera.worldUp, WebGL.vec3(objectModel.bounds.center[0], 0.0, objectModel.bounds.center[2]), WebGL.radians(camera.speed * 50)));
                    camera.setTarget(WebGL.vec3(objectModel.bounds.center[0], 0.0, objectModel.bounds.center[2]));
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
        let rotX = camera.sensitivity * deltaX / 100;
        let rotY = camera.sensitivity * deltaY / 100;

        // don't allow camera to rotate below the model
        let newRotYPosition = WebGL.rotateOffset(camera.position, WebGL.normalize(WebGL.cross(camera.orientation, camera.worldUp)), objectModel.bounds.center, WebGL.radians(rotY));
        if (newRotYPosition[1] > objectModel.bounds.min[1] && newRotYPosition[2] < objectModel.bounds.center[2]) {
            camera.setPosition(WebGL.rotateOffset(camera.position, WebGL.vec3(0.0, 1.0, 0.0), objectModel.bounds.center, WebGL.radians(-rotX)));
            camera.setPosition(WebGL.rotateOffset(camera.position, WebGL.normalize(WebGL.cross(camera.orientation, camera.worldUp)), objectModel.bounds.center, WebGL.radians(rotY)));
            camera.setTarget(WebGL.vec3(0.0, 0.0, 0.0));
        }
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
            let outsideModel = (newPosition[0] < objectModel.bounds.min[0] ||
                newPosition[0] > objectModel.bounds.max[0] ||
                newPosition[1] < objectModel.bounds.min[1] ||
                newPosition[1] > objectModel.bounds.max[1] ||
                newPosition[2] < objectModel.bounds.min[2] ||
                newPosition[2] > objectModel.bounds.max[2]);

            if (outsideModel) {
                camera.setPosition(newPosition);
            }
        } else {
            const n = parseInt(document.querySelector("#n").value);
            const m = parseInt(document.querySelector("#m").value);

            let newYPosition = viewport.orthoSize + zoom * Math.min(n, m);
            let outsideModel = (newYPosition > objectModel.bounds.max[1] + 1);

            if (outsideModel) {
                viewport.orthoSize += zoom * Math.min(n, m);
                viewport.orthoEye = WebGL.vec3(camera.position[0], viewport.orthoSize, camera.position[2]);
                viewport.orthoMatrix = WebGL.ortho(2 * viewport.orthoSize * aspectRatio, 2 * viewport.orthoSize, 0.1, 100.0);
                camera.projectionMatrix = viewport.orthoMatrix;
                camera.setPosition(viewport.orthoEye);
            }
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