export const VERTEX_SHADER = 
`attribute vec3 vertexPosition;
attribute vec3 vertexNormal;
attribute vec3 vertexColor;
attribute vec2 vertexUV;
attribute vec3 vertexAmbient;
attribute vec3 vertexSpecular;
attribute float vertexShininess;

uniform mat4 cameraMatrix;
uniform mat4 modelMatrix;

varying vec3 position;
varying vec3 normal;
varying vec3 color;
varying vec2 textureCoordinates;
varying vec3 materialAmbient;
varying vec3 materialSpecular;
varying float materialShininess;

void main() {
    gl_Position = cameraMatrix * modelMatrix * vec4(vertexPosition, 1.0);
    normal = vertexNormal;
    color = vertexColor;
    textureCoordinates = vertexUV;
    materialAmbient = vertexAmbient;
    materialSpecular = vertexSpecular;
    materialShininess = vertexShininess;
}`;