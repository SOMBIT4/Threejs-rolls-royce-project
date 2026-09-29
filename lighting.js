import * as THREE from 'three';

const MODES = {
  day: {
    hemi: 0.34, key: 1.08, fill: 0.30, rim: 0.48, moving: 0.34,
    sky: new THREE.Color(0xe9eaeb), ground: new THREE.Color(0x4f5357), light: new THREE.Color(0xffffff)
  },
  night: {
    hemi: 0.09, key: 0.34, fill: 0.11, rim: 0.30, moving: 0.44,
    sky: new THREE.Color(0x54606f), ground: new THREE.Color(0x080a0d), light: new THREE.Color(0xcbd8ea)
  }
};

const smooth = (value, goal, delta) => THREE.MathUtils.lerp(value, goal, 1 - Math.exp(-2.8 * delta));

// Main lighting. Includes one point light that slowly rotates around the car.
export function createLightingRig() {
  const group = new THREE.Group();
  const hemisphere = new THREE.HemisphereLight(0xe9eaeb, 0x4f5357, MODES.day.hemi);

  const key = new THREE.DirectionalLight(0xffffff, MODES.day.key);
  key.position.set(4.8, 7.8, 5.1);
  key.target.position.set(0, 0.8, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -7;
  key.shadow.camera.right = 7;
  key.shadow.camera.top = 7;
  key.shadow.camera.bottom = -7;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 24;

  const fill = new THREE.DirectionalLight(0xf1f3f5, MODES.day.fill);
  fill.position.set(-5.6, 3.8, 4.2);

  const rim = new THREE.DirectionalLight(0xffffff, MODES.day.rim);
  rim.position.set(-3.5, 5.8, -6.5);

  const rotatingLight = new THREE.PointLight(0xffffff, MODES.day.moving, 15, 2);
  rotatingLight.position.set(7.2, 3.2, 0);

  group.add(hemisphere, key, key.target, fill, rim, rotatingLight);

  let target = MODES.day;
  let angle = 0;

  return {
    group,
    rotatingLight,
    setMode(mode) {
      target = mode === 'night' ? MODES.night : MODES.day;
    },
    update(delta, interactions) {
      const blend = 1 - Math.exp(-2.8 * delta);
      hemisphere.intensity = smooth(hemisphere.intensity, target.hemi, delta);
      hemisphere.color.lerp(target.sky, blend);
      hemisphere.groundColor.lerp(target.ground, blend);
      key.intensity = smooth(key.intensity, target.key, delta);
      fill.intensity = smooth(fill.intensity, target.fill, delta);
      rim.intensity = smooth(rim.intensity, target.rim, delta);
      rotatingLight.intensity = smooth(rotatingLight.intensity, target.moving, delta);
      key.color.lerp(target.light, blend);
      fill.color.lerp(target.light, blend);
      rim.color.lerp(target.light, blend);
      rotatingLight.color.lerp(target.light, blend);

      angle += delta * (0.10 + interactions.driveAmount * 0.025);
      rotatingLight.position.set(Math.cos(angle) * 7.2, 3.2, Math.sin(angle) * 7.2);
    }
  };
}
