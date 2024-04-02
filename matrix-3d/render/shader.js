import { FRAGMENT_SHADER } from "../fragment-shader.js";
import { VERTEX_SHADER } from "../vertex-shader.js";

export function createShaderProgram(gl) {
    let vertexShader;
    let fragmentShader;

    // console.log(vertexElement);
    vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, VERTEX_SHADER);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.log("Vertex shader failed to compile. The error log is:" + gl.getShaderInfoLog(vertexShader));
        return -1;
    }

    fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, FRAGMENT_SHADER);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.log("Fragment shader failed to compile. The error log is:" + gl.getShaderInfoLog(fragmentShader));
        return -1;
    }
    
    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log("Shader program failed to link. The error log is:" + gl.getProgramInfoLog(program));
        return -1;
    }

    return program;
}

// Get a file as a string using AJAX
export function loadFileAJAX(name) {
    let xhr = new XMLHttpRequest(),
        okStatus = document.location.protocol === "file:" ? 0 : 200;
    xhr.open('GET', name, false);
    xhr.send(null);
    return xhr.status == okStatus ? xhr.responseText : null;
}

export function initShadersFromFiles(gl, vShaderName, fShaderName) {
    function getShader(gl, shaderName, type) {
        let shader = gl.createShader(type),
            shaderScript = loadFileAJAX(shaderName);
        if (!shaderScript) {
            console.log("Could not find shader source: " + shaderName);
        }
        gl.shaderSource(shader, shaderScript);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }
    let vertexShader = getShader(gl, vShaderName, gl.VERTEX_SHADER),
        fragmentShader = getShader(gl, fShaderName, gl.FRAGMENT_SHADER),
        program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log("Could not initialise shaders");
        return null;
    }
    return program;
}