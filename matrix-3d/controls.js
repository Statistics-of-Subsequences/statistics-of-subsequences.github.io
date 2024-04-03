import * as WebGL from "./render/util/webgl-utils.js";
import Controller from "./render/util/controller.js";
import { viewport, camera, cameraStatus, initializeMLC } from "./matrix-3d.js";

export function registerController(canvas) {
    const controller = new Controller();
    controller.keyPress = function (keys) {
        if (keys.indexOf("KeyZ") != -1) {
            cameraStatus.isAnimating = true;
        }

        if (keys.indexOf("KeyR") != -1) {
            resetCamera();
        }

        if (!cameraStatus.isAnimating) {
            if (cameraStatus.isPerspective) {
                if (keys.indexOf("KeyW") != -1) {
                    camera.setPosition(WebGL.add(camera.position, WebGL.scale(-camera.speed, camera.orientation)));
                }
                if (keys.indexOf("KeyA") != -1) {
                    camera.setPosition(WebGL.add(camera.position, WebGL.scale(camera.speed, WebGL.normalize(WebGL.cross(camera.orientation, camera.worldUp)))));
                }
                if (keys.indexOf("KeyS") != -1) {
                    camera.setPosition(WebGL.add(camera.position, WebGL.scale(camera.speed, camera.orientation)));
                }
                if (keys.indexOf("KeyD") != -1) {
                    camera.setPosition(WebGL.add(camera.position, WebGL.scale(-camera.speed, WebGL.normalize(WebGL.cross(camera.orientation, camera.worldUp)))));
                }
                if (keys.indexOf("Space") != -1) {
                    camera.setPosition(WebGL.add(camera.position, WebGL.scale(camera.speed, camera.worldUp)));
                }
                if (keys.indexOf("ShiftLeft") != -1) {
                    camera.setPosition(WebGL.add(camera.position, WebGL.scale(-camera.speed, camera.worldUp)));
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
        if (event.buttons == 1) {
            rotateCamera(currMousePos[0] - prevMousePos[0], currMousePos[1] - prevMousePos[1]);
        } else if (event.buttons == 2) {
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
    if (!cameraStatus.isAnimating && cameraStatus.isPerspective) {
        let rotX = camera.sensitivity * deltaX / 100;
        let rotY = camera.sensitivity * deltaY / 100;

        camera.setOrientation(WebGL.rotate(camera.orientation, WebGL.vec3(0.0, 1.0, 0.0), WebGL.radians(-rotX)));
        camera.setOrientation(WebGL.rotate(camera.orientation, WebGL.normalize(WebGL.cross(camera.orientation, camera.worldUp)), WebGL.radians(rotY)));
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

function resetCamera(gl, shaderProgram) {
    if (!cameraStatus.cameraStatus.isAnimating) {
        initializeMLC(gl, shaderProgram);
        cameraStatus.cameraStatus.isPerspective = true;
        camera.isPerspective = true;
        cameraStatus.time = -1.0;
    }
}

// TODO: make just set class to show/hide
export function showControls() {
    // create popup
    const popup = document.createElement("div");
    popup.id = "popup";
    popup.style.position = "fixed";
    popup.style.top = "0";
    popup.style.left = "0";
    popup.style.width = "100%";
    popup.style.height = "100%";
    popup.style.backgroundColor = "rgba(0,0,0,0.75)";
    popup.style.display = "flex";
    popup.style.justifyContent = "center";
    popup.style.alignItems = "center";
    popup.style.zIndex = "1";

    // create content
    const content = document.createElement("div");
    content.style.position = "relative";
    content.style.width = "25%";
    content.style.height = "25%";
    content.style.backgroundColor = "white";
    content.style.padding = "20px";
    content.style.borderRadius = "10px";
    content.style.overflow = "auto";
    content.style.zIndex = "2";

    // create title
    const title = document.createElement("h2");
    title.innerHTML = "Controls";
    title.style.textAlign = "center";

    // create list
    const list = document.createElement("ul");
    list.style.listStyleType = "none";
    list.style.padding = "0";
    list.style.margin = "0";

    let items;
    if (false) {
        items = ["Two Finger Drag - Pan Camera", "Drag - Rotate Camera", "Pinch - Zoom Camera"]; //  "Tap - Toggle Elevation/Orthographic Mode", "Double Tap - Reset Camera"
    } else {
        items = ["W - Move Forward", "A - Move Left", "S - Move Backward", "D - Move Right", "Space - Move Up", "Shift - Move Down", "Z - Toggle Elevation/Orthographic Mode", "R - Reset Camera"];
    }
    for (let i = 0; i < items.length; i++) {
        let item = document.createElement("li");
        item.innerHTML = items[i];
        list.appendChild(item);
    }

    // create close button
    const closeButton = document.createElement("button");
    closeButton.innerHTML = "Close";
    closeButton.style.position = "absolute";
    closeButton.style.top = "0";
    closeButton.style.left = "0";
    closeButton.style.padding = "5px";
    closeButton.style.borderRadius = "2.5px";
    closeButton.style.cursor = "pointer";
    closeButton.onclick = function () {
        document.body.removeChild(popup);
    };

    // append elements
    content.appendChild(title);
    content.appendChild(list);

    // center list to content
    list.style.textAlign = "center";

    content.appendChild(closeButton);
    popup.appendChild(content);
    document.body.appendChild(popup);
}