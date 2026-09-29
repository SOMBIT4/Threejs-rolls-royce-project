import * as THREE from 'three';

// Custom road shader: textured asphalt + moving lane marks + simple light/fog.
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = `
  uniform sampler2D uRoad;
  uniform float uTravel;
  uniform float uBrightness;
  uniform vec3 uLightPosition;
  uniform vec3 uFogColor;
  uniform float uFogDensity;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  float line(float y, float center, float width) {
    return 1.0 - smoothstep(width, width + 0.006, abs(y - center));
  }

  void main() {
    vec2 uv = vec2(vUv.x * 18.0 - uTravel * 0.022, vUv.y * 3.2);
    vec3 color = texture2D(uRoad, uv).rgb * 0.52;

    float dash = step(0.50, fract(vUv.x * 20.0 - uTravel * 0.26));
    float center = line(vUv.y, 0.5, 0.0055) * dash;
    float edges = max(line(vUv.y, 0.075, 0.0036), line(vUv.y, 0.925, 0.0036)) * 0.55;
    color = mix(color, vec3(0.76), max(center, edges));

    vec3 lightDir = normalize(uLightPosition - vWorldPosition);
    float diffuse = max(dot(normalize(vWorldNormal), lightDir), 0.0);
    color = (color + diffuse * 0.025) * uBrightness;

    float distanceToCamera = length(cameraPosition - vWorldPosition);
    float fog = 1.0 - exp(-uFogDensity * uFogDensity * distanceToCamera * distanceToCamera);
    gl_FragColor = vec4(mix(color, uFogColor, clamp(fog, 0.0, 1.0)), 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createShaderMaterials(textures) {
  return {
    roadSurface: new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uRoad: { value: textures.road },
        uTravel: { value: 0 },
        uBrightness: { value: 0.86 },
        uLightPosition: { value: new THREE.Vector3(6, 4, 0) },
        uFogColor: { value: new THREE.Color(0xd7e9ef) },
        uFogDensity: { value: 0.0105 }
      }
    })
  };
}

export function syncShader(materials, lightPosition, scene) {
  const uniforms = materials.roadSurface.uniforms;
  uniforms.uLightPosition.value.copy(lightPosition);
  uniforms.uFogColor.value.copy(scene.fog.color);
  uniforms.uFogDensity.value = scene.fog.density;
}
