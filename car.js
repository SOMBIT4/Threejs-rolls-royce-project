import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// =====================================================
// CAR MODEL SETTINGS
// Change MODEL_URL only if you replace the .glb file.
// =====================================================
const MODEL_URL = './model/rolls-royce_silver_shadow_1965_1980/rolls-royce_silver_shadow_1965_1980.glb';
// GLTFLoader removes dots from node names: wheel.FR becomes wheelFR.
const WHEEL_NAMES = ['wheelFR', 'wheelFL', 'wheelRR', 'wheelRL'];
const DEFAULT_PAINT = '#050608';

function normalizeModel(model) {
  // Scale/center the downloaded model so the rest of the project can use simple coordinates.
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = 5.8 / Math.max(size.x, size.z);

  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
}

function tuneMaterial(material, paintMaterial) {
  if (!material) return material;
  const name = (material.name || '').toLowerCase();

  // Replace the original body material with our editable paint.
  if (name === 'body') return paintMaterial;

  if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
    material.envMapIntensity = 0.44;

    if (name.includes('chrome')) {
      material.metalness = 0.94;
      material.roughness = 0.22;
      material.envMapIntensity = 0.68;
    }

    if (name.includes('glass')) {
      material.color.set(0xaeb7bc);
      material.metalness = 0;
      material.roughness = 0.10;
      material.transparent = true;
      material.opacity = name === 'r_glass' ? 0.27 : 0.20;
      material.depthWrite = false;
      material.side = THREE.DoubleSide;
      material.envMapIntensity = 0.30;
    }

    if (name === 'black') {
      material.color.set(0x111214);
      material.roughness = Math.max(material.roughness, 0.60);
    }

    if (name.includes('wood')) {
      material.color.set(0x4a2b1c);
      material.roughness = 0.52;
    }
  }

  return material;
}

function prepareModel(model, paintMaterial, materialStates) {
  const savedMaterials = new Set();

  model.traverse((object) => {
    if (!object.isMesh) return;

    if (Array.isArray(object.material)) {
      object.material = object.material.map((material) => tuneMaterial(material, paintMaterial));
    } else {
      object.material = tuneMaterial(object.material, paintMaterial);
    }

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material || savedMaterials.has(material)) continue;
      savedMaterials.add(material);
      materialStates.push({ material, base: material.envMapIntensity ?? 1 });
    }

    const names = materials.map((material) => (material?.name || '').toLowerCase()).join(' ');
    const glass = names.includes('glass');
    object.castShadow = !glass && /body|wheel/i.test(object.name);
    object.receiveShadow = !glass;
  });
}

function createBeamTexture() {
  // Simple transparent gradient used on the road in front of the headlights.
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');

  const horizontal = context.createLinearGradient(0, 0, 512, 0);
  horizontal.addColorStop(0, 'rgba(255,246,214,.52)');
  horizontal.addColorStop(0.25, 'rgba(255,246,214,.25)');
  horizontal.addColorStop(1, 'rgba(255,246,214,0)');
  context.fillStyle = horizontal;
  context.fillRect(0, 0, 512, 128);

  const vertical = context.createLinearGradient(0, 0, 0, 128);
  vertical.addColorStop(0, 'rgba(0,0,0,0)');
  vertical.addColorStop(0.5, 'white');
  vertical.addColorStop(1, 'rgba(0,0,0,0)');
  context.globalCompositeOperation = 'destination-in';
  context.fillStyle = vertical;
  context.fillRect(0, 0, 512, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createHeadlights() {
  const group = new THREE.Group();
  group.name = 'Automatic headlights';

  const lensMaterial = new THREE.MeshBasicMaterial({
    color: 0xfff6d6,
    transparent: true,
    opacity: 0,
    toneMapped: false,
    depthWrite: false
  });
  const lensGeometry = new THREE.SphereGeometry(0.13, 14, 8);

  const spots = [];
  for (const z of [-0.72, 0.72]) {
    const lens = new THREE.Mesh(lensGeometry, lensMaterial);
    lens.scale.set(0.62, 0.82, 1);
    lens.position.set(2.73, 0.78, z);
    group.add(lens);

    const spot = new THREE.SpotLight(0xfff1c4, 0, 25, 0.28, 0.62, 1.4);
    spot.position.set(2.63, 0.80, z);
    spot.target.position.set(11.2, 0.24, z * 0.48);
    group.add(spot, spot.target);
    spots.push(spot);
  }

  const beamMaterial = new THREE.MeshBasicMaterial({
    map: createBeamTexture(),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide
  });
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 2.75), beamMaterial);
  beam.rotation.x = -Math.PI / 2;
  beam.position.set(6.95, 0.028, 0);
  group.add(beam);

  return { group, spots, lensMaterial, beamMaterial };
}

export function createCar({ onProgress = () => {} } = {}) {
  const group = new THREE.Group();
  group.name = 'Rolls-Royce Silver Shadow';

  // The downloaded model needs this rotation so +X becomes the car's front.
  const modelRoot = new THREE.Group();
  modelRoot.rotation.y = Math.PI / 2;
  group.add(modelRoot);

  // Editable physical body paint.
  const paintMaterial = new THREE.MeshPhysicalMaterial({
    name: 'body',
    color: DEFAULT_PAINT,
    metalness: 0.04,
    roughness: 0.30,
    clearcoat: 0.66,
    clearcoatRoughness: 0.18,
    envMapIntensity: 0.44
  });
  const paintGoal = new THREE.Color(DEFAULT_PAINT);

  // Headlights are attached to the car, so they follow steering/movement.
  const headlights = createHeadlights();
  group.add(headlights.group);
  let headlightGoal = 0;
  let headlightValue = 0;

  const wheelNodes = [];
  const materialStates = [];
  let reflectionGoal = 0.78;

  const manager = new THREE.LoadingManager();
  manager.onProgress = (_url, loaded, total) => onProgress(Math.min(0.92, (loaded / total) * 0.92));

  const ready = new Promise((resolve, reject) => {
    new GLTFLoader(manager).load(
      MODEL_URL,
      (gltf) => {
        try {
          const model = gltf.scene;
          prepareModel(model, paintMaterial, materialStates);
          normalizeModel(model);

          // Save the four wheel groups for rotation. Missing wheels are ignored
          // so a renamed model part never prevents the whole car from loading.
          for (const name of WHEEL_NAMES) {
            const wheel = model.getObjectByName(name);
            if (wheel) wheelNodes.push(wheel);
          }

          modelRoot.add(model);
          onProgress(1);
          resolve(model);
        } catch (error) {
          reject(error);
        }
      },
      undefined,
      (error) => reject(new Error(`Could not load car model: ${error.message || error}`))
    );
  });

  return {
    group,
    ready,

    // Called by Color buttons.
    setBodyColor(color) {
      paintGoal.set(color);
    },

    // Night mode turns this on automatically from main.js.
    setHeadlightsEnabled(enabled) {
      headlightGoal = enabled ? 1 : 0;
    },

    // Day/night changes reflection strength.
    setEnvironmentIntensity(value) {
      reflectionGoal = THREE.MathUtils.clamp(value, 0.08, 1.2);
    },

    update(delta, interactions) {
      paintMaterial.color.lerp(paintGoal, 1 - Math.exp(-5.4 * delta));

      // Smooth headlights on/off.
      headlightValue = THREE.MathUtils.lerp(headlightValue, headlightGoal, 1 - Math.exp(-4.2 * delta));
      headlights.lensMaterial.opacity = 0.92 * headlightValue;
      headlights.beamMaterial.opacity = 0.24 * headlightValue;
      headlights.spots.forEach((spot) => { spot.intensity = 72 * headlightValue; });

      // Smooth environment reflections.
      const reflectionBlend = 1 - Math.exp(-2.8 * delta);
      for (const state of materialStates) {
        const goal = state.base * reflectionGoal;
        state.material.envMapIntensity = THREE.MathUtils.lerp(state.material.envMapIntensity ?? goal, goal, reflectionBlend);
      }

      // Wheel rotation follows speed.
      const wheelSpeed = 8.5 * interactions.driveVelocity;
      wheelNodes.forEach((wheel) => wheel.rotateZ(-delta * wheelSpeed));

      // Small steering yaw + sideways lane movement.
      group.rotation.y = THREE.MathUtils.lerp(
        group.rotation.y,
        interactions.steering * interactions.driveAmount * 0.075,
        1 - Math.exp(-5.2 * delta)
      );
      group.position.z = THREE.MathUtils.lerp(
        group.position.z,
        interactions.laneOffset,
        1 - Math.exp(-3.8 * delta)
      );
    }
  };
}
