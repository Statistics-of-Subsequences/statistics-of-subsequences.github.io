// =================
// ==== GLOBALS ====
// =================
var canvas, gl, shaderProgram, controller, onMobile;
var width, height, aspectRatio;
var xBox, yBox, lcsButton;
var operationRadio, substitutionSection, permutationSection, sliceConcatSection, lcPrefix, lcSuffix, operation = "substitute";
var substitutionKBox, permutationBox, sliceConcatModeBox, operationButton;
var lcsGenerated;
var n = 1;
var m = 1;

// ==============================
// ==== MODEL INITIALIZATION ====
// ==============================
var objectModel;
var modelMatrix;

// =================================
// ==== LIGHTING INITIALIZATION ====
// =================================
var lights = [];

// ===============================
// ==== CAMERA INITIALIZATION ====
// ===============================
var orthoSize;
var perspectiveStart;
var perspectiveMatrix, orthoMatrix;
var perspectiveEye, orthoEye;
var perspectiveOrientation, orthoOrientation;
var perspectiveUp, orthoUp;
var isPerspective = true;
var isAnimating = false;
var alpha = 0.01 * Math.min(n, m);
var time = -1.0;
var camera;

// =================
// ==== PROGRAM ====
// =================
function main() {
    // check platform
    onMobile = mobileAndTabletCheck();

    // Create the window
    canvas = document.getElementById('window');

    document.getElementById("n").value = n;
    document.getElementById("m").value = m;

    xBox = document.getElementById("x-box");
    yBox = document.getElementById("y-box");
    lcsButton = document.getElementById("lcs-button");
    substitutionKBox = document.getElementById("substitution-k-box");
    permutationBox = document.getElementById("permutation-box");
    sliceConcatModeBox = document.getElementById("slice-concat-mode");
    operationButton = document.getElementById("operation-button");
    lcsGenerated = false;

    operationRadio = document.getElementsByName("operation");
    substitutionSection = document.getElementById("substitution");
    permutationSection = document.getElementById("permutation");
    sliceConcatSection = document.getElementById("slice-concat");

    xBox.value = "";
    yBox.value = "";
    lcsButton.disabled = true;
    substitutionKBox.value = "";
    permutationBox.value = "";
    operationRadio[0].checked = true;
    operation = "substitute";
    operationButton.disabled = true;

    setup();

    document.getElementById("n").onkeyup = function () {
        if (this.value.length > 0) {
            var n = parseInt(this.value);
            if (isNaN(n) || n < 1 || n > 10) {
                this.value = 1;
            }
            document.getElementById("dimensionsButton").disabled = false;
        } else {
            document.getElementById("dimensionsButton").disabled = true;
        }
    }

    document.getElementById("m").onkeyup = function () {
        if (this.value.length > 0) {
            var m = parseInt(this.value);
            if (isNaN(m) || m < 1 || m > 10) {
                this.value = 1;
            }
            document.getElementById("dimensionsButton").disabled = false;
        } else {
            document.getElementById("dimensionsButton").disabled = true;
        }
    }

    xBox.onkeyup = function () {
        // clear if not a binary string
        if (!/^[01]*$/.test(xBox.value)) {
            xBox.value = "";
        }

        if (xBox.value.length < n || yBox.value.length < m) {
            lcsButton.disabled = true;
        } else {
            if (xBox.value.length > n) {
                xBox.value = xBox.value.slice(0, n);
            }
            lcsButton.disabled = false;
        }
    }

    yBox.onkeyup = function () {
        // clear if not a binary string
        if (!/^[01]*$/.test(yBox.value)) {
            yBox.value = "";
        }

        if (xBox.value.length != n || yBox.value.length != m) {
            lcsButton.disabled = true;
        } else {
            if (yBox.value.length > m) {
                yBox.value = yBox.value.slice(0, m);
            }

            lcsButton.disabled = false;
        }
    }

    substitutionKBox.onkeyup = function () {
        var k = parseInt(substitutionKBox.value);
        if (isNaN(k) || k < 0 || k >= m) {
            substitutionKBox.value = "";
        }
        if (substitutionKBox.value.length > 0 && lcsGenerated) {
            operationButton.disabled = false;
        } else {
            operationButton.disabled = true;
        }
    }

    sliceConcatModeBox.onchange = function () {
        var concatInputDiv = document.getElementById("concat-input");
        while (concatInputDiv.firstChild) {
            concatInputDiv.removeChild(concatInputDiv.firstChild);
        }

        var mode = sliceConcatModeBox.value;
        if (mode == "prefix") {
            var prefixText = document.createElement("p");
            prefixText.innerHTML = "Prefix: ";
            prefixText.style.display = "inline";

            var prefixBox = document.createElement("input");
            prefixBox.type = "text";
            prefixBox.id = "prefix-box";
            prefixBox.size = 5;
            prefixBox.style.display = "inline";
            prefixBox.onkeyup = function () {
                if (!/^[01]*$/.test(prefixBox.value)) {
                    prefixBox.value = "";
                }

                if (prefixBox.value.length >= lcPrefix) {
                    if (prefixBox.value.length > lcPrefix) {
                        prefixBox.value = prefixBox.value.slice(0, lcPrefix);
                    }
                    operationButton.disabled = false;
                } else {
                    operationButton.disabled = true;
                }
            }

            // create two breaks
            var br1 = document.createElement("br");
            var br2 = document.createElement("br");

            concatInputDiv.appendChild(prefixText);
            concatInputDiv.appendChild(prefixBox);
            concatInputDiv.appendChild(br1);
            concatInputDiv.appendChild(br2);
        } else if (mode == "suffix") {
            var suffixText = document.createElement("p");
            suffixText.innerHTML = "Suffix: ";
            suffixText.style.display = "inline";

            var suffixBox = document.createElement("input");
            suffixBox.type = "text";
            suffixBox.id = "suffix-box";
            suffixBox.size = 5;
            suffixBox.style.display = "inline";
            suffixBox.onkeyup = function () {
                if (!/^[01]*$/.test(suffixBox.value)) {
                    suffixBox.value = "";
                }

                if (suffixBox.value.length >= lcSuffix) {
                    if (suffixBox.value.length > lcSuffix) {
                        suffixBox.value = suffixBox.value.slice(0, lcSuffix);
                    }
                    operationButton.disabled = false;
                } else {
                    operationButton.disabled = true;
                }
            }

            // create two breaks
            var br1 = document.createElement("br");
            var br2 = document.createElement("br");

            concatInputDiv.appendChild(suffixText);
            concatInputDiv.appendChild(suffixBox);
            concatInputDiv.appendChild(br1);
            concatInputDiv.appendChild(br2);
        } else if (mode == "infix") {
            var prefixText = document.createElement("p");
            prefixText.innerHTML = "Prefix: ";
            prefixText.style.display = "inline";

            var prefixBox = document.createElement("input");
            prefixBox.type = "text";
            prefixBox.id = "prefix-box";
            prefixBox.size = 5;
            prefixBox.style.display = "inline";
            
            var nbsp = document.createElement("p");
            nbsp.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
            nbsp.style.display = "inline";

            var suffixText = document.createElement("p");
            suffixText.innerHTML = "Suffix: ";
            suffixText.style.display = "inline";

            var suffixBox = document.createElement("input");
            suffixBox.type = "text";
            suffixBox.id = "suffix-box";
            suffixBox.size = 5;
            suffixBox.style.display = "inline";

            prefixBox.onkeyup = function () {
                if (!/^[01]*$/.test(prefixBox.value)) {
                    prefixBox.value = "";
                }

                if (prefixBox.value.length >= lcPrefix && suffixBox.value.length >= lcSuffix) {
                    if (prefixBox.value.length > lcPrefix) {
                        prefixBox.value = prefixBox.value.slice(0, lcPrefix);
                    }
                    if (suffixBox.value.length > lcSuffix) {
                        suffixBox.value = suffixBox.value.slice(0, lcSuffix);
                    }
                    operationButton.disabled = false;
                } else {
                    operationButton.disabled = true;
                }
            }

            suffixBox.onkeyup = function () {
                if (!/^[01]*$/.test(suffixBox.value)) {
                    suffixBox.value = "";
                }

                if (prefixBox.value.length >= lcPrefix && suffixBox.value.length >= lcSuffix) {
                    if (prefixBox.value.length > lcPrefix) {
                        prefixBox.value = prefixBox.value.slice(0, lcPrefix);
                    }
                    if (suffixBox.value.length > lcSuffix) {
                        suffixBox.value = suffixBox.value.slice(0, lcSuffix);
                    }
                    operationButton.disabled = false;
                } else {
                    operationButton.disabled = true;
                }
            }

            // create two breaks
            var br1 = document.createElement("br");
            var br2 = document.createElement("br");

            concatInputDiv.appendChild(prefixText);
            concatInputDiv.appendChild(prefixBox);
            concatInputDiv.appendChild(nbsp);
            concatInputDiv.appendChild(suffixText);
            concatInputDiv.appendChild(suffixBox);
            concatInputDiv.appendChild(br1);
            concatInputDiv.appendChild(br2);
        }
    }

    changeMatrix();

    // specify the viewport in the window
    gl = WebGLUtils.setupWebGL(canvas);

    // Check that the return value is not null.
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // set viewport
    width = canvas.width;
    height = canvas.height;
    aspectRatio = width / height;
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
    var fbo = new FBO(width, height);

    // initialize and activate shader program
    shaderProgram = createShaderProgram(gl, "vertexShader", "fragmentShader");
    gl.useProgram(shaderProgram);

    // Initialize models, lighting, and camera
    initializeMLC(shaderProgram);

    // initialize uniforms
    if (n <= 0 || m <= 0) {
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "useTexture"), 1);
    } else {
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "useTexture"), 0);
    }

    // render the scene
    render();
}

window.mobileAndTabletCheck = function () {
    let check = false;
    (function (a) {
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};

function setup() {
    if (onMobile) { // if on a mobile device
        canvas.width = window.innerWidth * 0.875;
        canvas.height = canvas.width * 0.6667;

        var panel = document.getElementById("right");
        panel.parentNode.removeChild(panel); // remove div from main div
        document.body.appendChild(panel); // add div to body
        panel.style.width = canvas.width + "px";

        // clear style on left div
        var left = document.getElementById("left");
        left.style.width = "100%";
        left.style.marginTop = "0";
        left.style.marginLeft = "0";
        left.style.float = "none";

        document.getElementById("break0").style.height = canvas.height * 0.0536 + "px";
    } else { // if on a computer
        canvas.width = window.innerWidth * 0.51;
        canvas.height = canvas.width * 0.6667;

        // remove mobile controls div
        var mobileControls = document.getElementById("mobile-controls");
        var break0 = document.getElementById("break0");
        mobileControls.parentNode.removeChild(mobileControls);
        break0.parentNode.removeChild(break0);

    }
    document.getElementById("break1").style.height = canvas.height * 0.0536 + "px";
    document.getElementById("legend").style.height = (canvas.height - (canvas.height * 0.0536) - document.getElementById("matrixDimensions").clientHeight) + "px";
    document.getElementById("break2").style.height = canvas.height * 0.0536 + "px";

    registerController();
}

function render() {
    // clear the screen
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // if the model is loaded
    if (objectModel.modelLoaded) {
        // update camera matrix
        if (!isAnimating) {
            if (isPerspective) {
                perspectiveEye = camera.position;
                perspectiveOrientation = camera.orientation;
            } else {
                orthoEye = camera.position;
                orthoOrientation = camera.orientation;
            }
        } else {
            toggleCameraType();
        }

        // update camera
        camera.update(shaderProgram, "cameraMatrix");

        // update lighting
        Light.updateAll(shaderProgram, lights);

        // update model matrix
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "modelMatrix"), false, flatten(modelMatrix));

        // draw mesh
        objectModel.draw(shaderProgram, camera);
    }

    // request new frame
    requestAnimFrame(render);
}

function toggleCameraType() {
    var mixAmount = Math.sin(time * Math.PI / 2.0) * 0.5 + 0.5;
    var projectionMatrix = mat4();

    projectionMatrix[0] = mix(perspectiveMatrix[0], orthoMatrix[0], mixAmount);
    projectionMatrix[1] = mix(perspectiveMatrix[1], orthoMatrix[1], mixAmount);
    projectionMatrix[2] = mix(perspectiveMatrix[2], orthoMatrix[2], mixAmount);
    projectionMatrix[3] = mix(perspectiveMatrix[3], orthoMatrix[3], mixAmount);

    camera.projectionMatrix = projectionMatrix;

    var eye = mix(perspectiveEye, orthoEye, mixAmount);
    var orientation = mix(perspectiveOrientation, orthoOrientation, mixAmount);
    var up = mix(perspectiveUp, orthoUp, mixAmount);

    camera.setPosition(eye);
    camera.setOrientation(orientation);
    camera.setWorldUp(up);

    // update time
    if (isPerspective) {
        time += alpha;
    } else {
        time -= alpha;
    }

    // round time to 4 decimal places
    time = Math.round(time * 10000.0) / 10000.0;

    // update isPerspective
    if (time >= 1.0) {
        isPerspective = false;
        camera.isPerspective = false;
        isAnimating = false;
    } else if (time <= -1.0) {
        isPerspective = true;
        camera.isPerspective = true;
        isAnimating = false;
    }
}

function initializeMLC(shader) {
    // model initialization
    objectModel = new Model("model_" + n + "x" + m + ".obj", shader);

    // Generate model matrix
    var reflectionPlane = vec4(1.0, 0.0, 0.0, 0.0);
    modelMatrix = mult(reflectionMatrix(reflectionPlane), translationMatrix(-Math.pow(2, n - 1), 0, -Math.pow(2, m - 1)));

    // lighting initialization
    lights.push(new PointLight(vec3(0.0, Math.min(n, m) + 1.0, 0.0), vec3(2.0, 1.5, 0.5), 0.5, vec4(1.0, 0.98, 1.0, 1.0)));

    // camera initialization
    orthoSize = Math.pow(2, Math.max(n, m) - 1.0) + 1.0;
    perspectiveStart = vec3(0.0, Math.min(n, m) + 1, -(0.5 * n + 2.0 + Math.pow(2, m - 1)));

    perspectiveMatrix = perspective(70.0, width / height, 0.1, 100.0);
    perspectiveEye = vec3(perspectiveStart[0], perspectiveStart[1], perspectiveStart[2]);
    perspectiveOrientation = vec3(0.0, 4.0, -8.0);
    perspectiveUp = vec3(0.0, 1.0, 0.0);
    orthoMatrix = ortho(2 * orthoSize * aspectRatio, 2 * orthoSize, 0.1, 100.0);
    orthoEye = vec3(0, orthoSize, 0);
    orthoOrientation = vec3(0.0, 1.0, 0.0);
    orthoUp = vec3(0.0, 0.0, 1.0);

    camera = new GenericCamera(width, height, perspectiveEye, perspectiveOrientation, perspectiveMatrix); // custom camera
    camera.speed = 0.1 * Math.min(n, m);
}

function changeMatrix() {
    var nInput = document.getElementById("n");
    var mInput = document.getElementById("m");

    n = parseInt(nInput.value);
    m = parseInt(mInput.value);

    if (n > 5 || m > 5) {
        var answer = confirm("Larger models may take longer than usual to render.\nWould you like to continue?");
        if (!answer) {
            return;
        }
    }

    setLegend();

    xBox.value = "";
    yBox.value = "";
    document.getElementById("lcs-length").innerHTML = "Length of Longest Common Subsequence: 0";
    document.getElementById("lcs-set").innerHTML = "Set of Longest Common Subsequences: {}";
    lcsButton.disabled = true;
    lcsGenerated = false;

    substitutionKBox.value = "";
    permutationBox.value = "";
    document.getElementById("new-x").value = "";
    document.getElementById("new-y").value = "";
    document.getElementById("new-length").innerHTML = "Length of Longest Common Subsequence: 0";
    document.getElementById("new-set").innerHTML = "Set of Longest Common Subsequences: {}";
    operationButton.disabled = true;

    while (permutationBox.rows.length > 0) {
        permutationBox.deleteRow(0);
    }

    var header = permutationBox.insertRow();
    var permRow = permutationBox.insertRow();
    permRow.id = "perm-row";
    for (var i = 0; i < m; i++) {
        var headerCell = header.insertCell();
        var cell = permRow.insertCell();

        var headerInput = document.createElement("input");
        headerInput.type = "text";
        headerInput.id = "index-" + i;
        headerInput.size = 2;
        headerInput.disabled = true;
        headerInput.value = i;

        var cellInput = document.createElement("input");
        cellInput.type = "text";
        cellInput.id = "perm-" + i;
        cellInput.size = 2;
        cellInput.maxLength = 2;
        cellInput.onkeyup = function () {
            if (this.value.length > 0) {
                var k = parseInt(this.value);
                if (k < 0 || k >= m) {
                    this.value = "";
                }

                var allFilled = true;
                var allUnique = true;
                var permSet = new Set();
                for (var j = 0; j < m; j++) {
                    var cell = document.getElementById("perm-" + j);
                    if (cell.value.length == 0) {
                        allFilled = false;
                    } else {
                        permSet.add(cell.value);
                    }
                }
                if (permSet.size < m) {
                    allUnique = false;
                }
            } else {
                allFilled = false;
            }

            if (allFilled && allUnique) {
                operationButton.disabled = false;
            } else {
                operationButton.disabled = true;
            }
        }

        headerCell.appendChild(headerInput);
        cell.appendChild(cellInput);
    }
    
    initializeMLC(shaderProgram);
    isPerspective = true;
    camera.isPerspective = true;
    time = -1.0;
    alpha = 0.01 * Math.min(n, m);
}

function changeLCS() {
    // convert from binary string to int
    var x = parseInt(xBox.value, 2);
    var y = parseInt(yBox.value, 2);

    // select mesh
    var index = x * Math.pow(2, m) + y;
    objectModel.select(index);

    var lcsLength = objectModel.meshes[index].vertices[0].position[1];
    var setOfLCSs = Array.from(lcsSet(xBox.value, yBox.value));

    var lcsLengthLabel = document.getElementById("lcs-length");
    lcsLengthLabel.innerHTML = "Length of Longest Common Subsequence: " + lcsLength;

    var lcsSetLabel = document.getElementById("lcs-set");
    lcsSetLabel.innerHTML = "Set of Longest Common Subsequences: {" + setOfLCSs + "}";

    lcsGenerated = true;
    substitutionKBox.value = "";

    var permRow = document.getElementById("perm-row");
    for (var i = 0; i < m; i++) {
        var cell = permRow.cells[i];
        var cellInput = cell.children[0];
        cellInput.value = "";
    }

    while (sliceConcatModeBox.firstChild) {
        sliceConcatModeBox.removeChild(sliceConcatModeBox.firstChild);
    }
    operationRadio[2].disabled = true;

    document.getElementById("new-x").value = "";
    document.getElementById("new-y").value = "";
    document.getElementById("new-length").innerHTML = "Length of Longest Common Subsequence: 0";
    document.getElementById("new-set").innerHTML = "Set of Longest Common Subsequences: {}";
    operationButton.disabled = true;

    // find lcPrefix and lcSuffix
    var xString = xBox.value;
    var yString = yBox.value;

    lcPrefix = 0; // longest common prefix
    lcSuffix = 0; // longest common suffix

    if (xString.length > 0 && yString.length > 0) {
        while (xString.length > 0 && yString.length > 0 && xString[0] == yString[0]) {
            lcPrefix++;
            xString = xString.slice(1);
            yString = yString.slice(1);
        }

        while (xString.length > 0 && yString.length > 0 && xString[xString.length - 1] == yString[yString.length - 1]) {
            lcSuffix++;
            xString = xString.slice(0, -1);
            yString = yString.slice(0, -1);
        }
    }

    if (lcPrefix > 0 || lcSuffix > 0) {
        if (lcPrefix > 0) {
            // add prefix as an option to sliceConcatModeBox
            var option = document.createElement("option");
            option.value = "prefix";
            option.innerHTML = "Prefix";
            sliceConcatModeBox.appendChild(option);
        }

        if (lcSuffix > 0) {
            // add suffix as an option to sliceConcatModeBox
            var option = document.createElement("option");
            option.value = "suffix";
            option.innerHTML = "Suffix";
            sliceConcatModeBox.appendChild(option);
        }

        if (lcPrefix > 0 && lcSuffix > 0) {
            // add infix as an option to sliceConcatModeBox
            var option = document.createElement("option");
            option.value = "infix";
            option.innerHTML = "Infix";
            sliceConcatModeBox.appendChild(option);
        }

        sliceConcatModeBox.value = sliceConcatModeBox.options[0].value;

        var event = new Event("change");
        sliceConcatModeBox.dispatchEvent(event);

        operationRadio[2].disabled = false;
    } else {
        operationRadio[0].checked = true;
        setOperation();
    }
}

function performOperation() {
    // convert from binary string to int
    var x = parseInt(xBox.value, 2);
    var y = parseInt(yBox.value, 2);

    var newX, newY;
    if (operation == "substitute") {
        newX = x;
        newY = y ^ (1 << (yBox.value.length - 1 - parseInt(substitutionKBox.value)));
    } else if (operation == "permutation") {
        // convert permutation row to array
        var perm = [];
        for (var i = 0; i < m; i++) {
            var cell = document.getElementById("perm-" + i);
            perm.push(cell.value);
        }

        newX = x;
        newY = permuteChars(yBox.value, perm);
    } else if (operation = "slice-n-concat") {
        var xString = xBox.value;
        var yString = yBox.value;
        var mode = sliceConcatModeBox.value;

        if (mode == "prefix") {
            var slicedX = xString.slice(lcPrefix);
            var slicedY = yString.slice(lcPrefix);
            var prefix = document.getElementById("prefix-box").value;

            newX = parseInt(prefix + slicedX, 2);
            newY = parseInt(prefix + slicedY, 2);
        } else if (mode == "suffix") {
            var slicedX = xString.slice(0, xString.length - lcSuffix);
            var slicedY = yString.slice(0, yString.length - lcSuffix);
            var suffix = document.getElementById("suffix-box").value;

            newX = parseInt(slicedX + suffix, 2);
            newY = parseInt(slicedY + suffix, 2);
        } else if (mode == "infix") {
            var prefix = document.getElementById("prefix-box").value;
            var suffix = document.getElementById("suffix-box").value;

            newX = parseInt(prefix + xString.slice(lcPrefix, xString.length - lcSuffix) + suffix, 2);
            newY = parseInt(prefix + yString.slice(lcPrefix, yString.length - lcSuffix) + suffix, 2);
        }
         
    } else if (operation == "complement") {
        newX = x ^ (Math.pow(2, n) - 1);
        newY = y ^ (Math.pow(2, m) - 1);
    } else if (operation == "reverse") {
        newX = parseInt(xBox.value.split("").reverse().join(""), 2);
        newY = parseInt(yBox.value.split("").reverse().join(""), 2);
    }

    var newXBox = newX.toString(2);
    var newYBox = newY.toString(2);

    // pad with zeros
    while (newXBox.length < n) {
        newXBox = "0" + newXBox;
    }
    while (newYBox.length < m) {
        newYBox = "0" + newYBox;
    }

    document.getElementById("new-x").value = newXBox;
    document.getElementById("new-y").value = newYBox;

    // select mesh
    var index = newX * Math.pow(2, m) + newY;
    objectModel.selectK(index);

    var lcsLength = objectModel.meshes[index].vertices[0].position[1];
    var setOfLCSs = Array.from(lcsSet(newXBox, newYBox));

    var newLengthLabel = document.getElementById("new-length");
    newLengthLabel.innerHTML = "Length of Longest Common Subsequence: " + lcsLength;

    var newSetLabel = document.getElementById("new-set");
    newSetLabel.innerHTML = "Set of Longest Common Subsequences: {" + setOfLCSs + "}";
}

function registerController() {
    controller = new Controller();
    controller.keyPress = function (keys) {
        if (keys.indexOf("KeyZ") != -1) {
            togglePerspective();
        }

        if (keys.indexOf("KeyR") != -1) {
            resetCamera();
        }

        if (!isAnimating) {
            if (isPerspective) {
                if (keys.indexOf("KeyW") != -1) {
                    camera.setPosition(add(camera.position, scale(-camera.speed, camera.orientation)));
                }
                if (keys.indexOf("KeyA") != -1) {
                    camera.setPosition(add(camera.position, scale(camera.speed, normalize(cross(camera.orientation, camera.worldUp)))));
                }
                if (keys.indexOf("KeyS") != -1) {
                    camera.setPosition(add(camera.position, scale(camera.speed, camera.orientation)));
                }
                if (keys.indexOf("KeyD") != -1) {
                    camera.setPosition(add(camera.position, scale(-camera.speed, normalize(cross(camera.orientation, camera.worldUp)))));
                }
                if (keys.indexOf("Space") != -1) {
                    camera.setPosition(add(camera.position, scale(camera.speed, camera.worldUp)));
                }
                if (keys.indexOf("ShiftLeft") != -1) {
                    camera.setPosition(add(camera.position, scale(-camera.speed, camera.worldUp)));
                }
            } else {
                if (keys.indexOf("KeyW") != -1) {
                    camera.setPosition(add(camera.position, scale(camera.speed, vec3(0.0, 0.0, 1.0))));
                }
                if (keys.indexOf("KeyA") != -1) {
                    camera.setPosition(add(camera.position, scale(camera.speed, vec3(1.0, 0.0, 0.0))));
                }
                if (keys.indexOf("KeyS") != -1) {
                    camera.setPosition(add(camera.position, scale(-camera.speed, vec3(0.0, 0.0, 1.0))));
                }
                if (keys.indexOf("KeyD") != -1) {
                    camera.setPosition(add(camera.position, scale(-camera.speed, vec3(1.0, 0.0, 0.0))));
                }
                if (keys.indexOf("Space") != -1) {
                    orthoSize += 0.1 * Math.min(n, m);
                    orthoEye = vec3(camera.position[0], orthoSize, camera.position[2]);
                    orthoMatrix = ortho(2 * orthoSize * aspectRatio, 2 * orthoSize, 0.1, 100.0);
                    camera.projectionMatrix = orthoMatrix;
                    camera.setPosition(orthoEye);
                }
                if (keys.indexOf("ShiftLeft") != -1) {
                    orthoSize -= 0.1 * Math.min(n, m);
                    orthoEye = vec3(camera.position[0], orthoSize, camera.position[2]);
                    orthoMatrix = ortho(2 * orthoSize * aspectRatio, 2 * orthoSize, 0.1, 100.0);
                    camera.projectionMatrix = orthoMatrix;
                    camera.setPosition(orthoEye);
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
        zoomCamera(delta);
    };

    controller.pinch = controller.wheel;
    controller.twoFingerDrag = function (drag) {
        panCamera(drag[0], drag[1]);
    };

    controller.registerForCanvas(canvas);
}

function rotateCamera(deltaX, deltaY) {
    if (!isAnimating && isPerspective) {
        var rotX = camera.sensitivity * deltaX / 100;
        var rotY = camera.sensitivity * deltaY / 100;

        camera.setOrientation(rotate(camera.orientation, vec3(0.0, 1.0, 0.0), radians(-rotX)));
        camera.setOrientation(rotate(camera.orientation, normalize(cross(camera.orientation, camera.worldUp)), radians(rotY)));
    }
}

function panCamera(deltaX, deltaY) {
    if (!isAnimating) {
        var panX = -camera.sensitivity * deltaX / 1000;
        var panY = -camera.sensitivity * deltaY / 1000;

        if (isPerspective) {
            var newPosition = add(camera.position, add(scale(panX, normalize(cross(camera.orientation, camera.worldUp))), scale(panY, camera.worldUp)));
            camera.setPosition(newPosition);
        } else {
            var newPosition = add(camera.position, add(scale(panX, vec3(1.0, 0.0, 0.0)), scale(panY, vec3(0.0, 0.0, 1.0))));
            camera.setPosition(newPosition);
        }
    }
}

function zoomCamera(delta) {
    if (!isAnimating) {
        var zoom = camera.sensitivity * delta / 10000;

        if (isPerspective) {
            var newPosition = add(camera.position, scale(zoom, camera.orientation));
            camera.setPosition(newPosition);
        } else {
            orthoSize += zoom * Math.min(n, m);
            orthoEye = vec3(camera.position[0], orthoSize, camera.position[2]);
            orthoMatrix = ortho(-orthoSize * aspectRatio, orthoSize * aspectRatio, -orthoSize, orthoSize, 0.1, 100.0);
            camera.projectionMatrix = orthoMatrix;
            camera.setPosition(orthoEye);
        }
    }
}

function togglePerspective() {
    if (!isAnimating) {
        isAnimating = true;
    }
}

function resetCamera() {
    if (!isAnimating) {
        initializeMLC(shaderProgram);
        isPerspective = true;
        camera.isPerspective = true;
        time = -1.0;
    }
}

function setOperation() {
    substitutionKBox.value = "";
    permutationBox.value = "";
    operationButton.disabled = true;
    if (operationRadio[0].checked) {
        operation = "substitute";
        substitutionSection.style.display = "block";
        permutationSection.style.display = "none";
        sliceConcatSection.style.display = "none";
    } else if (operationRadio[1].checked) {
        operation = "permutation";
        substitutionSection.style.display = "none";
        permutationSection.style.display = "block";
        sliceConcatSection.style.display = "none";
    } else if (operationRadio[2].checked) {
        operation = "slice-n-concat";
        substitutionSection.style.display = "none";
        permutationSection.style.display = "none";
        sliceConcatSection.style.display = "block";
        operationButton.disabled = false;
    } else if (operationRadio[3].checked) {
        operation = "complement";
        substitutionSection.style.display = "none";
        permutationSection.style.display = "none";
        sliceConcatSection.style.display = "none";
        operationButton.disabled = false;
    } else if (operationRadio[4].checked) {
        operation = "reverse";
        substitutionSection.style.display = "none";
        permutationSection.style.display = "none";
        sliceConcatSection.style.display = "none";
        operationButton.disabled = false;
    }

    document.getElementById("new-x").value = "";
    document.getElementById("new-y").value = "";
    document.getElementById("new-length").innerHTML = "Length of Longest Common Subsequence: 0";
    document.getElementById("new-set").innerHTML = "Set of Longest Common Subsequences: {}";
}

function permuteChars(str, perm) {
    var newStr = "";
    for (var i = 0; i < str.length; i++) {
        newStr += str[perm[i]];
    }
    return parseInt(newStr, 2);
}

function toggleDivs(divIds) {
    for (var i = 0; i < divIds.length; i++) {
        var div = document.getElementById(divIds[i]);
        if (div.style.display === "none") {
            div.style.display = "block";
        } else {
            div.style.display = "none";
        }
    }
}

function setLegend() {
    // var legend = document.getElementById("legendSVG");

    // // clear legend svg
    // while (legend.firstChild) {
    //     legend.removeChild(legend.firstChild);
    // }

    // var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    // svg.setAttribute("width", "100%");
    // svg.setAttribute("height", "100%");
    // svg.setAttribute("viewBox", "0 0 100 100");
    // svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    
    // // create linear gradient
    // var gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    // gradient.setAttribute("id", "gradient");
    // gradient.setAttribute("x1", "0%");
    // gradient.setAttribute("y1", "0%");
    // gradient.setAttribute("x2", "100%");
    // gradient.setAttribute("y2", "0%");
    // gradient.setAttribute("spreadMethod", "pad");

    // var stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    // stop1.setAttribute("offset", "0%");
    // stop1.setAttribute("stop-color", "blue");
    // stop1.setAttribute("stop-opacity", "1");

    // var stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    // stop2.setAttribute("offset", "100%");
    // stop2.setAttribute("stop-color", "red");
    // stop2.setAttribute("stop-opacity", "1");

    // gradient.appendChild(stop1);
    // gradient.appendChild(stop2);
    // svg.appendChild(gradient);

    // // create rectangle
    // var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    // rect.setAttribute("x", "0");
    // rect.setAttribute("y", "0");
    // rect.setAttribute("width", "100%");
    // rect.setAttribute("height", "100");
    // rect.setAttribute("fill", "url(#gradient)");

    // svg.appendChild(rect);
    // legend.appendChild(svg);
}

function showControls() {
    // create popup
    var popup = document.createElement("div");
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
    var content = document.createElement("div");
    content.style.position = "relative";
    content.style.width = "25%";
    content.style.height = "25%";
    content.style.backgroundColor = "white";
    content.style.padding = "20px";
    content.style.borderRadius = "10px";
    content.style.overflow = "auto";
    content.style.zIndex = "2";

    // create title
    var title = document.createElement("h2");
    title.innerHTML = "Controls";
    title.style.textAlign = "center";

    // create list
    var list = document.createElement("ul");
    list.style.listStyleType = "none";
    list.style.padding = "0";
    list.style.margin = "0";

    var items;
    if (onMobile) {
        items = ["Two Finger Drag - Pan Camera", "Drag - Rotate Camera", "Pinch - Zoom Camera"]; //  "Tap - Toggle Elevation/Orthographic Mode", "Double Tap - Reset Camera"
    } else {
        items = ["W - Move Forward", "A - Move Left", "S - Move Backward", "D - Move Right", "Space - Move Up", "Shift - Move Down", "Z - Toggle Elevation/Orthographic Mode", "R - Reset Camera"];
    }
    for (var i = 0; i < items.length; i++) {
        var item = document.createElement("li");
        item.innerHTML = items[i];
        list.appendChild(item);
    }

    // create close button
    var closeButton = document.createElement("button");
    closeButton.innerHTML = "Close";
    closeButton.style.position = "absolute";
    closeButton.style.top = "0";
    closeButton.style.left = "0";
    closeButton.style.padding = "5px";
    closeButton.style.borderRadius = "2.5px";
    closeButton.style.cursor = "pointer";
    closeButton.onclick = function () {
        document.body.removeChild(popup);
    }

    // append elements
    content.appendChild(title);
    content.appendChild(list);

    // center list to content
    list.style.textAlign = "center";

    content.appendChild(closeButton);
    popup.appendChild(content);
    document.body.appendChild(popup);
}

window.onresize = function () {
    if (!onMobile) {
        width = canvas.width;
        height = canvas.height;
        aspectRatio = width / height;
        gl.viewport(0, 0, width, height);
        setup();
    }
};

window.onload = main;