import * as WebGL from "./render/util/webgl-utils.js";
import * as WebGLUtils from "./render/util/setup.js";
import { createShaderProgram } from "./render/shader.js";
import Model from "./render/model.js";
import { Light, PointLight } from "./render/light.js";
import GenericCamera from "./render/camera.js";

import { registerController, resetCamera } from "./controls.js";
import { changeMatrix, changeLCS, findFix, isInProgress, performOperation } from "./edit-properties.js";

const BG_COLOR = { R: 220, G: 220, B: 220 } // Color out of 255

export let gl, shaderProgram, objectModel, modelMatrix, reflectionMatrix, lights, viewport, cameraStatus, camera;

// =================
// ==== PROGRAM ====
// =================
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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

        camera.update(shaderProgram, "cameraMatrix");
        Light.updateAll(gl, shaderProgram, lights);
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "modelMatrix"), false, WebGL.flatten(modelMatrix));
        objectModel.draw(shaderProgram, camera);
    }

    window.requestAnimFrame(render);
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

    if (cameraStatus.isPerspective) {
        cameraStatus.time += cameraStatus.alpha;
    } else {
        cameraStatus.time -= cameraStatus.alpha;
    }

    cameraStatus.time = Math.round(cameraStatus.time * 10000.0) / 10000.0;

    if (cameraStatus.time >= 1.0) {
        cameraStatus.isPerspective = false;
        cameraStatus.isAnimating = false;
    } else if (cameraStatus.time <= -1.0) {
        cameraStatus.isPerspective = true;
        cameraStatus.isAnimating = false;
    }
}

export function initializeMLC(width, height, aspectRatio) {
    const n = document.querySelector("#n").value;
    const m = document.querySelector("#m").value;

    // Generate model matrix
    reflectionMatrix = WebGL.reflectionMatrix(WebGL.vec4(1.0, 0.0, 0.0, 0));
    let translationMatrix = WebGL.translationMatrix(-Math.pow(2, n - 1), 0, -Math.pow(2, m - 1));
    modelMatrix = WebGL.mult(reflectionMatrix, translationMatrix);

    // model initialization
    objectModel = new Model(gl, "model_" + n + "x" + m + ".obj", shaderProgram);

    // lighting initialization
    lights = [new PointLight(gl, WebGL.vec3(0.0, Math.min(n, m) + 1.0, 0.0), WebGL.vec3(2.0, 1.5, 0.5), 0.5, WebGL.vec4(1.0, 0.98, 1.0, 1.0))];

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
    camera.setTarget(WebGL.vec3(0.0, 0.0, 0.0));
}

window.addEventListener("DOMContentLoaded", () => {
    document.cookie = "page=0;";
    const canvas = document.getElementById('window');
    registerController(canvas);

    document.querySelector("#n").value = 1;;
    document.querySelector("#m").value = 1;

    const xBox = document.querySelector("#x-box");
    const yBox = document.querySelector("#y-box");
    xBox.value = "";
    yBox.value = "";
    
    const lcsButton = document.querySelector("#lcs-button");
    xBox.onbeforeinput = e => {
        // clear if not a binary string
        if(e.data && !e.data.match("[01]+")) {
            e.preventDefault();
            alert("Strings x and y must only contain the characters '0' and '1'");
            return;
        }
        
        lcsButton.disabled = !(xBox.value.length + 1 === xBox.maxLength && yBox.value.length === yBox.maxLength);
    };
    yBox.onbeforeinput = e => {
        // clear if not a binary string
        if(e.data && !e.data.match("[01]+")) {
            e.preventDefault();
            alert("Strings x and y must only contain the characters '0' and '1'");
            return;
        }
        
        lcsButton.disabled = !(xBox.value.length === xBox.maxLength && yBox.value.length + 1 === yBox.maxLength);
    };

    const substitutionKBox = document.querySelector("#substitution-k-box");
    const operationButton = document.querySelector("#operation-button");
    substitutionKBox.onchange = () => operationButton.disabled = substitutionKBox.value.length === 0 || isInProgress();

    const sliceConcatModeBox = document.querySelector("#slice-concat-mode");
    const prefixBox = document.querySelector("#concat-prefix");
    const suffixBox = document.querySelector("#concat-suffix");
    const prefixWrapper = document.querySelector("#concat-prefix-wrapper");
    const suffixWrapper = document.querySelector("#concat-suffix-wrapper");
    prefixBox.onchange = function () {
        if (prefixBox.selectedIndex != -1) {
            operationButton.disabled = false;
        } else {
            operationButton.disabled = true;
        }
    };
    suffixBox.onchange = function () {
        if (suffixBox.selectedIndex != -1) {
            operationButton.disabled = false;
        } else {
            operationButton.disabled = true;
        }
    };
    sliceConcatModeBox.onchange = function () {
        operationButton.disabled = true;

        const n = parseInt(document.querySelector("#n").value);
        const m = parseInt(document.querySelector("#m").value);
        const xString = document.querySelector("#x-box").value;
        const yString = document.querySelector("#y-box").value;
        let { lcPrefix, lcSuffix, lcCircumfix } = findFix(xString, yString, n, m);

        let mode = sliceConcatModeBox.value;
        if (mode === "prefix") {
            prefixBox.options.length = 0;
            for (let i = 0; i < Math.pow(2, lcPrefix); i++) {
                prefixBox.add(new Option(i.toString(2).padStart(lcPrefix, "0"), i.toString(2).padStart(lcPrefix, "0")));
            }

            prefixBox.selectedIndex = -1;
            suffixWrapper.classList.add("hidden");
            prefixWrapper.classList.remove("hidden");
        } else if (mode === "suffix") {
            suffixBox.options.length = 0;
            for (let i = 0; i < Math.pow(2, lcSuffix); i++) {
                suffixBox.add(new Option(i.toString(2).padStart(lcSuffix, "0"), i.toString(2).padStart(lcSuffix, "0")));
            }

            suffixBox.selectedIndex = -1;
            prefixWrapper.classList.add("hidden");
            suffixWrapper.classList.remove("hidden");
        } else if (mode === "circumfix") {
            let tempLCPrefix = lcPrefix;
            let tempLCSuffix = lcSuffix;

            if (lcCircumfix !== 0) {
                tempLCPrefix = Math.ceil(lcCircumfix / 2);
                tempLCSuffix = lcCircumfix - tempLCPrefix;
            }

            prefixBox.options.length = 0;
            for (let i = 0; i < Math.pow(2, tempLCPrefix); i++) {
                prefixBox.add(new Option(i.toString(2).padStart(tempLCPrefix, "0"), i.toString(2).padStart(tempLCPrefix, "0")));
            }
            prefixBox.selectedIndex = -1;

            suffixBox.options.length = 0;
            for (let i = 0; i < Math.pow(2, tempLCSuffix); i++) {
                suffixBox.add(new Option(i.toString(2).padStart(tempLCSuffix, "0"), i.toString(2).padStart(tempLCSuffix, "0")));
            }
            suffixBox.selectedIndex = -1;
            prefixWrapper.classList.remove("hidden");
            suffixWrapper.classList.remove("hidden");
        }
    };

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

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

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);

    gl.clearColor(BG_COLOR.R / 255, BG_COLOR.G / 255, BG_COLOR.B / 255, 1.0);

    // ====================================================
    // ======= NOTE: No post-processing effects are =======
    // ==== used in this project, so the FBO currently ====
    // ======== serves no purpose. However, it is  ========
    // ====== included for the sake of completeness. ======
    // ====================================================

    // create framebuffer object
    //let fbo = new FBO(gl, width, height);

    // initialize and activate shader program
    shaderProgram = createShaderProgram(gl);
    gl.useProgram(shaderProgram);

    // Initialize models, lighting, and camera
    initializeMLC(width, height, aspectRatio);
    let { updatedPerspective, updatedTime, updatedAlpha } = changeMatrix();

    // initialize uniforms
    const n = parseInt(document.querySelector("#n").value);
    const m = parseInt(document.querySelector("#m").value);

    if (n <= 0 || m <= 0) {
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "useTexture"), 1);
    } else {
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "useTexture"), 0);
    }

    // Set up DOM Bindings
    window.onresize = () => {
        const wrapperBounds = wrapper.getBoundingClientRect();
        canvas.width = wrapperBounds.width;
        canvas.height = wrapperBounds.height;
        gl.viewport(0, 0, canvas.width, canvas.height);
        registerController(canvas);
        initializeMLC(canvas.width, canvas.height, canvas.width / canvas.height);
        render();
    };
    canvas.addEventListener("mouseover", () => {
        canvas.focus();
    });
    canvas.addEventListener("mouseleave", () => {
        window.focus();
    });

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
        let { updatedPerspective, updatedTime, updatedAlpha } = changeMatrix();
        initializeMLC(width, height, aspectRatio);
        cameraStatus = { isAnimating: false, isPerspective: updatedPerspective, time: updatedTime, alpha: updatedAlpha };
    }
    document.querySelector("#lcs-button").onclick = changeLCS;
    document.querySelector("#reset").onclick = resetCamera;
    document.querySelector("#perspective").onclick = () => cameraStatus.isAnimating = !cameraStatus.isAnimating;
    document.querySelector("#operation-button").onclick = performOperation;

    // render the scene
    cameraStatus = { isAnimating: false, isPerspective: updatedPerspective, time: updatedTime, alpha: updatedAlpha };
    render();
});
