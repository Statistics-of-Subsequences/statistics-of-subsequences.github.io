export const FRAGMENT_SHADER = 
`precision mediump float;

varying vec3 position;
varying vec3 normal;
varying vec3 color;
varying vec2 textureCoordinates;
varying vec3 materialAmbient;
varying vec3 materialSpecular;
varying float materialShininess;

// materials and viewing
uniform vec3 cameraPosition;
uniform sampler2D diffuse0;
uniform sampler2D specular0;
uniform sampler2D normal0;
uniform vec3 lightPosition;
uniform bool useTexture;

// lighting
uniform int lightCount;
uniform int lightType;
uniform float lightAmbience;
uniform vec4 lightColor;

// point lights
uniform vec3 pointLightAttenuation;

// directional lights
uniform vec3 directionalLightDirection;

// spot lights
uniform vec3 spotLightDirection;
uniform vec3 spotLightAttenuation;
uniform float spotLightInnerCone;
uniform float spotLightOuterCone;

float map(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

vec4 pointLight() {
    vec3 lightVector = lightPosition - position;

    // calculates intensity of light with respect to distance
    float dist = length(lightVector);
    float intensity = pointLightAttenuation.x / (pointLightAttenuation.z * dist * dist + pointLightAttenuation.y * dist + pointLightAttenuation.x);

    // diffuse lighting
    vec3 normal = normalize(normal); // normalize(texture2D(normal0, textureCoordinates).xyz * 2.0f - 1.0);
    vec3 lightDirection = normalize(lightVector);
    float diffuse = max(dot(normal, lightDirection), 0.0);

    // specular lighting
    float specular = 0.0;
    if (diffuse != 0.0) {
        vec3 viewDirection = normalize(cameraPosition - position);
        vec3 halfwayVector = normalize(viewDirection + lightDirection);
        specular = pow(max(dot(normal, halfwayVector), 0.0), materialShininess);
    }

    vec4 ambientColor, diffuseColor, specularColor;
    if (useTexture) {
        ambientColor = texture2D(diffuse0, textureCoordinates) * lightAmbience;
        diffuseColor = texture2D(diffuse0, textureCoordinates) * diffuse;
        specularColor = texture2D(specular0, textureCoordinates) * specular;
    } else {
        ambientColor = vec4(materialAmbient * lightAmbience, 1.0);
        diffuseColor = vec4(color * diffuse, 1.0);
        specularColor = vec4(materialSpecular * specular, 1.0);
    }

    return ambientColor + (diffuseColor * lightColor + specularColor) * intensity;
}

vec4 directionalLight() {
    // normalize light color
    float maxChannelColor = max(max(lightColor.r, lightColor.g), lightColor.b);
    float newRed = map(lightColor.r, 0.0, maxChannelColor, 0.0, 1.0);
    float newGreen = map(lightColor.g, 0.0, maxChannelColor, 0.0, 1.0);
    float newBlue = map(lightColor.b, 0.0, maxChannelColor, 0.0, 1.0);
    float newAlpha = clamp(lightColor.a, 0.0, 1.0);
    vec4 newLightColor = vec4(newRed, newGreen, newBlue, newAlpha);

    // diffuse lighting
    vec3 normal = normalize(normal);
    float diffuse = max(dot(normal, -directionalLightDirection), 0.0);

    // specular lighting
    float specular = 0.0;
    if (diffuse != 0.0) {
        vec3 viewDirection = normalize(cameraPosition - position);
        vec3 halfwayVector = normalize(viewDirection - directionalLightDirection);
        specular = pow(max(dot(normal, halfwayVector), 0.0), materialShininess);
    }

    vec4 ambientColor, diffuseColor, specularColor;
    if (useTexture) {
        ambientColor = texture2D(diffuse0, textureCoordinates) * lightAmbience;
        diffuseColor = texture2D(diffuse0, textureCoordinates) * diffuse;
        specularColor = texture2D(specular0, textureCoordinates) * specular;
    } else {
        ambientColor = vec4(materialAmbient * lightAmbience, 1.0);
        diffuseColor = vec4(color, 1.0) * diffuse;
        specularColor = vec4(materialSpecular * specular, 1.0);
    }

    return ambientColor + diffuseColor * newLightColor + specularColor;
}

vec4 spotLight() {
    // normalize light color
    float maxChannelColor = max(max(lightColor.r, lightColor.g), lightColor.b);
    float newRed = map(lightColor.r, 0.0, maxChannelColor, 0.0, 1.0);
    float newGreen = map(lightColor.g, 0.0, maxChannelColor, 0.0, 1.0);
    float newBlue = map(lightColor.b, 0.0, maxChannelColor, 0.0, 1.0);
    float newAlpha = clamp(lightColor.a, 0.0, 1.0);
    vec4 newLightColor = vec4(newRed, newGreen, newBlue, newAlpha);

    vec3 lightVector = lightPosition - position;

    // calculates intensity of light with respect to distance
    float dist = length(lightVector);
    float attenuationIntensity = spotLightAttenuation.x / (spotLightAttenuation.z * dist * dist + spotLightAttenuation.y * dist + spotLightAttenuation.x);

    // diffuse lighting
    vec3 normal = normalize(normal); // normalize(texture2D(normal0, textureCoordinates).xyz * 2.0f - 1.0);
    vec3 lightDirection = normalize(lightVector);
    float diffuse = max(dot(normal, lightDirection), 0.0);

    // specular lighting
    float specular = 0.0;
    if (diffuse != 0.0) {
        vec3 viewDirection = normalize(cameraPosition - position);
        vec3 halfwayVector = normalize(viewDirection + lightDirection);
        specular = pow(max(dot(normal, halfwayVector), 0.0), materialShininess);
    }

    // calculates intensity of the current position based on its angle to the center of the light cone
    float angle = dot(spotLightDirection, -lightDirection);
    float coneIntensity = clamp((cos(angle) - cos(spotLightOuterCone)) / (cos(spotLightInnerCone) - cos(spotLightOuterCone)), 0.0, 1.0);

    // combines the intensity of the light with the intensity of the current position
    float intensity = attenuationIntensity * (1.0 - attenuationIntensity * attenuationIntensity) + coneIntensity * (attenuationIntensity * attenuationIntensity);

    vec4 ambientColor, diffuseColor, specularColor;
    if (useTexture) {
        ambientColor = texture2D(diffuse0, textureCoordinates) * lightAmbience;
        diffuseColor = texture2D(diffuse0, textureCoordinates) * diffuse;
        specularColor = texture2D(specular0, textureCoordinates) * specular;
    } else {
        ambientColor = vec4(materialAmbient * lightAmbience, 1.0);
        diffuseColor = vec4(color, 1.0) * diffuse;
        specularColor = vec4(materialSpecular, 1.0) * specular;
    }

    return ambientColor + (diffuseColor * newLightColor + specularColor) * intensity;
}

void main() {
    if (lightType == 0) {
        if (useTexture) {
            gl_FragColor = texture2D(diffuse0, textureCoordinates);
        } else {
            gl_FragColor = vec4(color, 1.0);
        }
        return;
    } else if (lightType == 1) {
        gl_FragColor = pointLight();
        return;
    } else if (lightType == 2) {
        gl_FragColor = directionalLight();
        return;
    } else if (lightType == 3) {
        gl_FragColor = spotLight();
        return;
    }
}`;