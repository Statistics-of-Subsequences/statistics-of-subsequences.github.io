import * as WebGL from "./render/util/webgl-utils.js";
import * as WebGLUtils from "./render/util/setup.js";
import { createShaderProgram } from "./render/shader.js";
import Model from "./render/model.js";
import { Light, PointLight } from "./render/light.js";
import GenericCamera from "./render/camera.js";

import { registerController } from "./controls.js";
import { changeMatrix, findFix, isInProgress } from "./edit-properties.js";

// =================
// ==== PROGRAM ====
// =================
function mobileAndTabletCheck() {
    let check = false;
    (function (a) {
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) ||
            /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))
        check = true;
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
}

function setup(onMobile, canvas) {
    if (onMobile) { // if on a mobile device
        canvas.width = window.innerWidth * 0.875;
        canvas.height = canvas.width * 0.6667;

        let panel = document.getElementById("right");
        panel.parentNode.removeChild(panel); // remove div from main div
        document.body.appendChild(panel); // add div to body
        panel.style.width = canvas.width + "px";

        // clear style on left div
        let left = document.getElementById("left");
        left.style.width = "100%";
        left.style.marginTop = "0";
        left.style.marginLeft = "0";
        left.style.float = "none";

        document.getElementById("break0").style.height = canvas.height * 0.0536 + "px";
    } else { // if on a computer
        canvas.width = window.innerWidth * 0.51;
        canvas.height = canvas.width * 0.6667;

        // hide mobile controls div
        let mobileControls = document.getElementById("mobile-controls");
        let break0 = document.getElementById("break0");
        mobileControls.style.display = "none";
        break0.style.display = "none";

    }
    document.getElementById("break1").style.height = canvas.height * 0.0536 + "px";
    document.getElementById("legend").style.height = (canvas.height - (canvas.height * 0.0536) - document.getElementById("matrixDimensions").clientHeight) + "px";
    document.getElementById("break2").style.height = canvas.height * 0.0536 + "px";

    registerController(canvas);
}

function render(gl, shaderProgram, camera, objectModel, modelMatrix, lights, viewport, cameraStatus) {
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
            toggleCameraType(camera, viewport, cameraStatus);
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
    window.requestAnimFrame(() => render(gl, shaderProgram, camera, objectModel, modelMatrix, lights, viewport, cameraStatus));
}

function toggleCameraType(camera, viewport, cameraStatus) {
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

function initializeMLC(gl, shader, width, height, aspectRatio) {
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

    const camera = new GenericCamera(gl, width, height, perspectiveEye, perspectiveOrientation, perspectiveMatrix); // custom camera
    camera.speed = 0.1 * Math.min(n, m);
    return {camera: camera, objectModel: objectModel, modelMatrix: modelMatrix, lights: lights, viewport: {
        orthoSize, perspectiveStart, perspectiveMatrix, perspectiveEye, perspectiveOrientation, perspectiveUp, orthoMatrix, orthoEye, orthoOrientation, orthoUp
    } };
}

function toggleDivs(divIds) {
    for (let i = 0; i < divIds.length; i++) {
        let div = document.getElementById(divIds[i]);
        if (div.style.display === "none") {
            div.style.display = "block";
        } else {
            div.style.display = "none";
        }
    }
}

window.addEventListener("DOMContentLoaded", () => {
    // check platform
    const onMobile = mobileAndTabletCheck();

    // Create the window
    const canvas = document.getElementById('window');
    setup(onMobile, canvas);

    const xBox = document.querySelector("#x-box");
    xBox.onbeforeinput = e => {
        // clear if not a binary string
        if(!e.data.match("[01]+")) {
            e.preventDefault();
            return;
        }
    };
    document.querySelector("#y-box").onbeforeinput = xBox.onbeforeinput;

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
    let { updatedPerspective, updatedTime, updatedAlpha } = changeMatrix(onMobile);
    let { camera, objectModel, modelMatrix, lights, viewport } = initializeMLC(gl, shaderProgram, width, height, aspectRatio);

    // initialize uniforms
    const n = parseInt(document.querySelector("#n").value);
    const m = parseInt(document.querySelector("#m").value);

    if (n <= 0 || m <= 0) {
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "useTexture"), 1);
    } else {
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "useTexture"), 0);
    }

    // Set up screen scaling
    window.onresize = () => {
        if (!onMobile) {
            gl.viewport(0, 0, canvas.width, canvas.height);
            setup(onMobile, canvas);
            let { camera, objectModel, modelMatrix, lights, viewport } = initializeMLC(gl, shaderProgram, canvas.width, canvas.height, canvas.width / canvas.height);
            render(gl, shaderProgram, camera, objectModel, modelMatrix, lights, viewport, cameraStatus);
        }
    };

    // render the scene
    const cameraStatus = { isAnimating: false, isPerspective: updatedPerspective, time: updatedTime, alpha: updatedAlpha };
    render(gl, shaderProgram, camera, objectModel, modelMatrix, lights, viewport, cameraStatus);
});