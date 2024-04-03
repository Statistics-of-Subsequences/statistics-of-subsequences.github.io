import * as WebGL from "./render/util/webgl-utils.js";
import * as WebGLUtils from "./render/util/setup.js";
import { createShaderProgram } from "./render/shader.js";
import Model from "./render/model.js";
import { Light, PointLight } from "./render/light.js";
import GenericCamera from "./render/camera.js";

import { registerController } from "./controls.js";
import { changeMatrix, changeLCS, findFix, isInProgress, performOperation } from "./edit-properties.js";

export let viewport, cameraStatus, camera;

// =================
// ==== PROGRAM ====
// =================
function render(gl, shaderProgram, objectModel, modelMatrix, lights) {
    // clear the screen
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // if the model is loaded
    if (objectModel.modelLoaded) {
        // update camera matrix
        if (!cameraStatus.isAnimating) {
            if (cameraStatus.isPerspective) {
                viewport.perspectiveEye = camera.position;
                viewport.perspectiveOrientation = camera.orientation;
            } else {
                viewport.orthoEye = camera.position;
                viewport.orthoOrientation = camera.orientation;
            }
        } else {
            toggleCameraType();
        }

        // update camera
        camera.update(shaderProgram, "cameraMatrix");

        // update lighting
        Light.updateAll(gl, shaderProgram, lights);

        // update model matrix
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "modelMatrix"), false, WebGL.flatten(modelMatrix));

        // draw mesh
        objectModel.draw(shaderProgram, camera);
    }

    // request new frame
    window.requestAnimFrame(() => render(gl, shaderProgram, objectModel, modelMatrix, lights));
}

function toggleCameraType() {
    let mixAmount = Math.sin(cameraStatus.time * Math.PI / 2.0) * 0.5 + 0.5;
    let projectionMatrix = WebGL.mat4();

    projectionMatrix[0] = WebGL.mix(viewport.perspectiveMatrix[0], viewport.orthoMatrix[0], mixAmount);
    projectionMatrix[1] = WebGL.mix(viewport.perspectiveMatrix[1], viewport.orthoMatrix[1], mixAmount);
    projectionMatrix[2] = WebGL.mix(viewport.perspectiveMatrix[2], viewport.orthoMatrix[2], mixAmount);
    projectionMatrix[3] = WebGL.mix(viewport.perspectiveMatrix[3], viewport.orthoMatrix[3], mixAmount);

    camera.projectionMatrix = projectionMatrix;

    let eye = WebGL.mix(viewport.perspectiveEye, viewport.orthoEye, mixAmount);
    let orientation = WebGL.mix(viewport.perspectiveOrientation, viewport.orthoOrientation, mixAmount);
    let up = WebGL.mix(viewport.perspectiveUp, viewport.orthoUp, mixAmount);

    camera.setPosition(eye);
    camera.setOrientation(orientation);
    camera.setWorldUp(up);

    // update time
    if (cameraStatus.isPerspective) {
        cameraStatus.time += cameraStatus.alpha;
    } else {
        cameraStatus.time -= cameraStatus.alpha;
    }

    // round time to 4 decimal places
    cameraStatus.time = Math.round(cameraStatus.time * 10000.0) / 10000.0;

    // update isPerspective
    if (cameraStatus.time >= 1.0) {
        cameraStatus.isPerspective = false;
        camera.isPerspective = false;
        cameraStatus.isAnimating = false;
    } else if (cameraStatus.time <= -1.0) {
        cameraStatus.isPerspective = true;
        camera.isPerspective = true;
        cameraStatus.isAnimating = false;
    }
}

export function initializeMLC(gl, shader, width, height, aspectRatio) {
    // model initialization
    const n = document.querySelector("#n").value;
    const m = document.querySelector("#m").value;
    const objectModel = new Model(gl, "model_" + n + "x" + m + ".obj", shader);
    let lights = [];

    // Generate model matrix
    let reflectionPlane = WebGL.vec4(1.0, 0.0, 0.0, 0.0);
    const modelMatrix = WebGL.mult(WebGL.reflectionMatrix(reflectionPlane), WebGL.translationMatrix(-Math.pow(2, n - 1), 0, -Math.pow(2, m - 1)));

    // lighting initialization
    lights.push(new PointLight(gl, WebGL.vec3(0.0, Math.min(n, m) + 1.0, 0.0), WebGL.vec3(2.0, 1.5, 0.5), 0.5, WebGL.vec4(1.0, 0.98, 1.0, 1.0)));

    // camera initialization
    const orthoSize = Math.pow(2, Math.max(n, m) - 1.0) + 1.0;
    const perspectiveStart = WebGL.vec3(0.0, Math.min(n, m) + 1, -(0.5 * n + 2.0 + Math.pow(2, m - 1)));

    const perspectiveMatrix = WebGL.perspective(70.0, width / height, 0.1, 100.0);
    const perspectiveEye = WebGL.vec3(perspectiveStart[0], perspectiveStart[1], perspectiveStart[2]);
    const perspectiveOrientation = WebGL.vec3(0.0, 4.0, -8.0);
    const perspectiveUp = WebGL.vec3(0.0, 1.0, 0.0);
    const orthoMatrix = WebGL.ortho(2 * orthoSize * aspectRatio, 2 * orthoSize, 0.1, 100.0);
    const orthoEye = WebGL.vec3(0, orthoSize, 0);
    const orthoOrientation = WebGL.vec3(0.0, 1.0, 0.0);
    const orthoUp = WebGL.vec3(0.0, 0.0, 1.0);

    camera = new GenericCamera(gl, width, height, perspectiveEye, perspectiveOrientation, perspectiveMatrix); // custom camera
    camera.speed = 0.1 * Math.min(n, m);
    viewport = { orthoSize, perspectiveStart, perspectiveMatrix, perspectiveEye, perspectiveOrientation, perspectiveUp, orthoMatrix, orthoEye, orthoOrientation, orthoUp };
    return { objectModel: objectModel, modelMatrix: modelMatrix, lights: lights };
}

window.addEventListener("DOMContentLoaded", () => {
    // Create the window
    const canvas = document.getElementById('window');
    registerController(canvas);

    const xBox = document.querySelector("#x-box");
    const yBox = document.querySelector("#y-box");
    xBox.onbeforeinput = e => {
        // clear if not a binary string
        if(!e.data.match("[01]+")) {
            e.preventDefault();
            return;
        }
    };
    yBox.onbeforeinput = xBox.onbeforeinput;

    const substitutionKBox = document.querySelector("#substitution-k-box");
    const operationButton = document.querySelector("#operation-button");
    substitutionKBox.onchange = () => {
        if (substitutionKBox.value.length > 0 && !isInProgress()) {
            operationButton.disabled = false;
        } else {
            operationButton.disabled = true;
        }
    };

    const sliceConcatModeBox = document.querySelector("#slice-concat-mode");
    sliceConcatModeBox.onchange = function () {
        const concatInputDiv = sliceConcatModeBox.querySelector("#concat-input");
        while (concatInputDiv.firstChild) {
            concatInputDiv.removeChild(concatInputDiv.firstChild);
        }
        operationButton.disabled = true;

        const n = parseInt(document.querySelector("#n").value);
        const m = parseInt(document.querySelector("#m").value);
        const xString = document.querySelector("#x-box").value;
        const yString = document.querySelector("#y-box").value;
        let { lcPrefix, lcSuffix, lcCircumfix } = findFix(xString, yString, n, m);

        let mode = sliceConcatModeBox.value;
        if (mode == "prefix") {
            let prefixLabel = document.createElement("label");
            prefixLabel.innerHTML = "Prefix: ";
            prefixLabel.for = "prefix-box";
            prefixLabel.style.display = "inline";

            let prefixBox = document.createElement("select");
            prefixBox.id = "prefix-box";
            prefixBox.style.display = "inline";
            for (let i = 0; i < Math.pow(2, lcPrefix); i++) {
                prefixBox.options[prefixBox.options.length] = new Option(i.toString(2).padStart(lcPrefix, "0"), i.toString(2).padStart(lcPrefix, "0"));
            }
            prefixBox.selectedIndex = -1;
            prefixBox.onchange = function () {
                if (prefixBox.selectedIndex != -1) {
                    operationButton.disabled = false;
                } else {
                    operationButton.disabled = true;
                }
            };

            concatInputDiv.appendChild(prefixLabel);
            concatInputDiv.appendChild(prefixBox);
            concatInputDiv.appendChild(document.createElement("br"));
            concatInputDiv.appendChild(document.createElement("br"));
        } else if (mode == "suffix") {
            let suffixLabel = document.createElement("label");
            suffixLabel.innerHTML = "Suffix: ";
            suffixLabel.for = "suffix-box";
            suffixLabel.style.display = "inline";

            let suffixBox = document.createElement("select");
            suffixBox.id = "suffix-box";
            suffixBox.style.display = "inline";
            for (let i = 0; i < Math.pow(2, lcSuffix); i++) {
                suffixBox.options[suffixBox.options.length] = new Option(i.toString(2).padStart(lcSuffix, "0"), i.toString(2).padStart(lcSuffix, "0"));
            }
            suffixBox.selectedIndex = -1;
            suffixBox.onchange = function () {
                if (suffixBox.selectedIndex != -1) {
                    operationButton.disabled = false;
                } else {
                    operationButton.disabled = true;
                }
            };

            concatInputDiv.appendChild(suffixLabel);
            concatInputDiv.appendChild(suffixBox);
            concatInputDiv.appendChild(document.createElement("br"));
            concatInputDiv.appendChild(document.createElement("br"));
        } else if (mode == "circumfix") {
            const tempLCPrefix = lcPrefix;
            const tempLCSuffix = lcSuffix;

            if (lcCircumfix != 0) {
                lcPrefix = Math.ceil(lcCircumfix / 2);
                lcSuffix = lcCircumfix - lcPrefix;
            }

            let prefixLabel = document.createElement("label");
            prefixLabel.innerHTML = "Prefix: ";
            prefixLabel.for = "prefix-box";
            prefixLabel.style.display = "inline";

            let prefixBox = document.createElement("select");
            prefixBox.id = "prefix-box";
            prefixBox.style.display = "inline";
            for (let i = 0; i < Math.pow(2, lcPrefix); i++) {
                prefixBox.options[prefixBox.options.length] = new Option(i.toString(2).padStart(lcPrefix, "0"), i.toString(2).padStart(lcPrefix, "0"));
            }
            prefixBox.selectedIndex = -1;
            
            let nbsp = document.createElement("p");
            nbsp.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
            nbsp.style.display = "inline";

            let suffixLabel = document.createElement("label");
            suffixLabel.innerHTML = "Suffix: ";
            suffixLabel.for = "suffix-box";
            suffixLabel.style.display = "inline";

            let suffixBox = document.createElement("select");
            suffixBox.id = "suffix-box";
            suffixBox.style.display = "inline";
            for (let i = 0; i < Math.pow(2, lcSuffix); i++) {
                suffixBox.options[suffixBox.options.length] = new Option(i.toString(2).padStart(lcSuffix, "0"), i.toString(2).padStart(lcSuffix, "0"));
            }
            suffixBox.selectedIndex = -1;

            prefixBox.onchange = function () {
                if (prefixBox.selectedIndex != -1 && suffixBox.selectedIndex != -1) {
                    operationButton.disabled = false;
                } else {
                    operationButton.disabled = true;
                }
            };

            suffixBox.onchange = function () {
                if (prefixBox.selectedIndex != -1 && suffixBox.selectedIndex != -1) {
                    operationButton.disabled = false;
                } else {
                    operationButton.disabled = true;
                }
            };

            // create two breaks
            let br1 = document.createElement("br");
            let br2 = document.createElement("br");

            concatInputDiv.appendChild(prefixLabel);
            concatInputDiv.appendChild(prefixBox);
            concatInputDiv.appendChild(nbsp);
            concatInputDiv.appendChild(suffixLabel);
            concatInputDiv.appendChild(suffixBox);
            concatInputDiv.appendChild(br1);
            concatInputDiv.appendChild(br2);

            lcPrefix = tempLCPrefix;
            lcSuffix = tempLCSuffix;
        }
    };

    // specify the viewport in the window
    const gl = WebGLUtils.setupWebGL(canvas);

    // Check that the return value is not null.
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // set viewport
    const wrapper = document.querySelector("#window-wrapper");
    const wrapperRect = wrapper.getBoundingClientRect();
    canvas.width = wrapperRect.width
                   - parseFloat(window.getComputedStyle(wrapper, null).getPropertyValue("padding-left"))
                   - parseFloat(window.getComputedStyle(wrapper, null).getPropertyValue("padding-right"));
    canvas.height = wrapperRect.height
                   - parseFloat(window.getComputedStyle(wrapper, null).getPropertyValue("padding-top"))
                   - parseFloat(window.getComputedStyle(wrapper, null).getPropertyValue("padding-bottom"));
    const width = canvas.width;
    const height = canvas.height;
    const aspectRatio = width / height;
    gl.viewport(0, 0, width, height);

    // enable the depth buffer and backface culling
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);

    // set background color
    gl.clearColor(0.9, 0.9, 0.9, 1.0);

    // ====================================================
    // ======= NOTE: No post-processing effects are =======
    // ==== used in this project, so the FBO currently ====
    // ======== serves no purpose. However, it is  ========
    // ====== included for the sake of completeness. ======
    // ====================================================

    // create framebuffer object
    //let fbo = new FBO(gl, width, height);

    // initialize and activate shader program
    const shaderProgram = createShaderProgram(gl);
    gl.useProgram(shaderProgram);

    // Initialize models, lighting, and camera
    let { updatedPerspective, updatedTime, updatedAlpha } = changeMatrix();
    let { objectModel, modelMatrix, lights } = initializeMLC(gl, shaderProgram, width, height, aspectRatio);

    // initialize uniforms
    const n = parseInt(document.querySelector("#n").value);
    const m = parseInt(document.querySelector("#m").value);

    if (n <= 0 || m <= 0) {
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "useTexture"), 1);
    } else {
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "useTexture"), 0);
    }

    // Set up DOM Bindings
    document.querySelector("#window").onresize = () => {
        const wrapper = document.querySelector("#window-wrapper").getBoundingClientRect();
        canvas.width = wrapper.width;
        canvas.height = wrapper.height;
        gl.viewport(0, 0, canvas.width, canvas.height);
        registerController(canvas);
        let { objectModel, modelMatrix, lights } = initializeMLC(gl, shaderProgram, canvas.width, canvas.height, canvas.width / canvas.height);
        render(gl, shaderProgram, objectModel, modelMatrix, lights);
    };

    const controlDisplay = document.querySelector("#control-overlay");
    document.querySelector("#computer-controls").onclick = () => controlDisplay.classList.remove("hidden");
    document.querySelector("#close-x").onclick = () => controlDisplay.classList.add("hidden");

    document.querySelector("#dimension-button").onclick = () => {
        const newMaxX = parseInt(document.querySelector("#n").value);
        const newMaxY = parseInt(document.querySelector("#m").value);
        xBox.maxLength = newMaxX;
        if(xBox.value.length > newMaxX) {
            xBox.value = xBox.value.slice(0, newMaxX);
        }
        yBox.maxLength = newMaxY;
        if(yBox.value.length > newMaxY) {
            yBox.value = yBox.value.slice(0, newMaxY);
        }
        changeMatrix();
    }
    document.querySelector("#lcs-button").onclick = () => changeLCS(objectModel);
    document.querySelector("#reset").onclick = () => resetCamera(gl, shaderProgram);
    document.querySelector("#perspective").onclick = () => cameraStatus.isAnimating = !cameraStatus.isAnimating;
    document.querySelector("#operation-button").onclick = () => performOperation(objectModel);

    // render the scene
    cameraStatus = { isAnimating: false, isPerspective: updatedPerspective, time: updatedTime, alpha: updatedAlpha };
    render(gl, shaderProgram, objectModel, modelMatrix, lights);
});