import { flatten } from "./util/webgl-utils.js";

export class Light {
    constructor(gl, type, ambience, color) {
        this.gl = gl;
        this.type = type;
        this.ambience = ambience;
        this.color = color;
    }

    update(shader, indexString) {
        this.gl.uniform1i(this.gl.getUniformLocation(shader, "lightType" + indexString), this.type);
        this.gl.uniform1f(this.gl.getUniformLocation(shader, "lightAmbience" + indexString), this.ambience);
        this.gl.uniform4fv(this.gl.getUniformLocation(shader, "lightColor" + indexString), flatten(this.color));
        this.gl.uniform3fv(this.gl.getUniformLocation(shader, "lightPosition" + indexString), flatten(this.position));
    }

    static updateAll(gl, shader, lights) {
        gl.uniform1i(gl.getUniformLocation(shader, "lightCount"), lights.length);
        for (let i = 0; i < lights.length; i++) {
            let light = lights[i];
            // let indexString = "[" + lights.indexOf(light) + "]";
            let indexString = "";
            light.update(shader, indexString);
        }
    }
}

export class PointLight extends Light {
    constructor(gl, position, attenuation, ambience, color) {
        super(gl, 1, ambience, color);
        this.position = position;
        this.attenuation = attenuation;
    }

    update(shader, indexString) {
        super.update(shader, indexString);
        this.gl.uniform3fv(this.gl.getUniformLocation(shader, "pointLightAttenuation" + indexString), flatten(this.attenuation));
    }
}

export class DirectionalLight extends Light {
    constructor(gl, direction, ambience, color) {
        super(gl, 2, ambience, color);
        this.direction = direction;
    }

    update(shader, indexString) {
        super.update(shader, indexString);
        this.gl.uniform3fv(this.gl.getUniformLocation(shader, "directionalLightDirection" + indexString), flatten(this.direction));
    }
}

export class SpotLight extends Light {
    constructor(gl, position, direction, attenuation, innerConeAngle, outerConeAngle, ambience, color) {
        super(gl, 3, ambience, color);
        this.position = position;
        this.direction = direction;
        this.attenuation = attenuation;
        this.innerConeAngle = innerConeAngle;
        this.outerConeAngle = outerConeAngle;
    }

    update(shader, indexString) {
        super.update(shader, indexString);
        this.gl.uniform3fv(this.gl.getUniformLocation(shader, "spotLightDirection"), flatten(this.direction));
        this.gl.uniform3fv(this.gl.getUniformLocation(shader, "spotLightAttenuation" + indexString), flatten(this.attenuation));
        this.gl.uniform1f(this.gl.getUniformLocation(shader, "spotLightInnerCone" + indexString), this.innerCone);
        this.gl.uniform1f(this.gl.getUniformLocation(shader, "spotLightOuterCone" + indexString), this.outerCone);
    }
}