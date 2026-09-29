import * as THREE from 'three';
import { createScene } from '../scene.js';
import { createRenderer, resizeRenderer } from '../renderer.js';
import { createCameraRig, updateCameraRig } from '../camera.js';
import { createProjectTextures } from '../textures.js';
import { createShaderMaterials, syncShader } from '../shaders.js';
import { createRoad } from '../road.js';
import { createEnvironment } from '../environment.js';
import { createLightingRig } from '../lighting.js';
import { createCar } from '../car.js';
import { createInteractionState } from '../interactions.js';
import { createAudioSystem } from '../audio.js';
import { createControls } from '../controls.js';
import { createLoadingScreen } from '../loadingScreen.js';
import { createCarPartInspector } from '../partDetails.js';

// =====================================================
// PROJECT SETUP
// Each major feature is created in its own file above.
// =====================================================
const canvas = document.querySelector('#three-scene');
const scene = createScene();
const renderer = createRenderer(canvas);
const cameraRig = createCameraRig();
const interactions = createInteractionState(canvas);
const loading = createLoadingScreen();
const audio = createAudioSystem();

const textures = createProjectTextures(renderer);
const materials = createShaderMaterials(textures);
const road = createRoad(materials);
const environment = createEnvironment(renderer, scene);
const lighting = createLightingRig();
const car = createCar({ onProgress: loading.setProgress });

scene.add(environment.group, road.group, lighting.group, car.group);

// =====================================================
// DAY / NIGHT MODE
// Night automatically turns the car headlights on.
// =====================================================
let mode = 'day';
let exposureGoal = 0.68;
let roadBrightnessGoal = 0.86;
let inspector;
let controls;

function setVisualMode(nextMode) {
  mode = nextMode === 'night' ? 'night' : 'day';
  lighting.setMode(mode);
  environment.setMode(mode);
  car.setHeadlightsEnabled(mode === 'night');
  car.setEnvironmentIntensity(mode === 'night' ? 0.24 : 0.78);
  exposureGoal = mode === 'night' ? 0.48 : 0.68;
  roadBrightnessGoal = mode === 'night' ? 0.48 : 0.86;
  inspector?.setMode(mode);
  return mode;
}

const visualMode = {
  getMode: () => mode,
  toggle: () => setVisualMode(mode === 'day' ? 'night' : 'day')
};

inspector = createCarPartInspector({
  canvas,
  cameraRig,
  car,
  interactions,
  onDriveChange: () => controls?.sync(),
  getMode: visualMode.getMode
});

controls = createControls({ interactions, car, cameraRig, audio, visualMode, detailsInspector: inspector });
setVisualMode('day');

// Show the interface only after the .glb model is ready.
car.ready
  .then(() => {
    loading.complete();
    controls.show();
  })
  .catch((error) => {
    console.error(error);
    loading.fail(error.message);
  });

// =====================================================
// ANIMATION LOOP
// This is the only requestAnimationFrame loop in the app.
// =====================================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.04);

  interactions.update(delta);
  car.update(delta, interactions);
  road.update(delta, interactions);
  environment.update(delta, interactions);
  lighting.update(delta, interactions);
  updateCameraRig(cameraRig, interactions, delta, car.group);
  inspector.update();
  controls.update();

  // Smooth exposure and road brightness during day/night changes.
  const blend = 1 - Math.exp(-2.5 * delta);
  renderer.toneMappingExposure = THREE.MathUtils.lerp(renderer.toneMappingExposure, exposureGoal, blend);
  materials.roadSurface.uniforms.uBrightness.value = THREE.MathUtils.lerp(
    materials.roadSurface.uniforms.uBrightness.value,
    roadBrightnessGoal,
    blend
  );

  syncShader(materials, lighting.rotatingLight.position, scene);
  renderer.render(scene, cameraRig.camera);
}

window.addEventListener('resize', () => resizeRenderer(renderer, cameraRig.camera));
resizeRenderer(renderer, cameraRig.camera);
animate();
