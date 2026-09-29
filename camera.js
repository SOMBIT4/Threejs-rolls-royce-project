import * as THREE from 'three';

const DEFAULT = { angle: 0.70, radius: 8.7, height: 2.35, fov: 47 };

const smooth = (current, target, speed, delta) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-speed * delta));

// Perspective camera + smooth orbit values.
export function createCameraRig() {
  const camera = new THREE.PerspectiveCamera(
    DEFAULT.fov,
    window.innerWidth / window.innerHeight,
    0.02,
    150
  );

  return {
    camera,
    angle: DEFAULT.angle,
    angleGoal: DEFAULT.angle,
    radius: DEFAULT.radius,
    radiusGoal: DEFAULT.radius,
    height: DEFAULT.height,
    heightGoal: DEFAULT.height,
    target: new THREE.Vector3(0, 0.98, 0)
  };
}

export function resetCameraRig(rig) {
  rig.angleGoal = DEFAULT.angle;
  rig.radiusGoal = DEFAULT.radius;
  rig.heightGoal = DEFAULT.height;
}

export const setExteriorCamera = resetCameraRig;

export function updateCameraRig(rig, interactions, delta, carGroup) {
  if (interactions.consumeReset()) resetCameraRig(rig);

  // Slow automatic orbit when the user is idle.
  if (interactions.autoOrbit) rig.angleGoal += delta * (0.052 + interactions.driveAmount * 0.016);

  // Mouse orbit.
  rig.angleGoal -= interactions.pointerDelta.x * 0.0049;
  rig.heightGoal += interactions.pointerDelta.y * 0.0068;
  interactions.pointerDelta.set(0, 0);

  // Arrow keys only control camera angle/height.
  const keys = interactions.keyboard;
  if (keys.cameraLeft !== keys.cameraRight) rig.angleGoal += (keys.cameraLeft ? 1 : -1) * delta * 1.08;
  if (keys.cameraUp !== keys.cameraDown) rig.heightGoal += (keys.cameraUp ? 1 : -1) * delta * 1.55;

  // Mouse wheel zoom.
  rig.radiusGoal += interactions.wheelDelta * 0.003;
  interactions.wheelDelta = 0;
  rig.radiusGoal = THREE.MathUtils.clamp(rig.radiusGoal, 2.2, 11.8);
  rig.heightGoal = THREE.MathUtils.clamp(rig.heightGoal, 0.85, 4.75);

  const response = interactions.dragging ? 15 : 7;
  rig.angle = smooth(rig.angle, rig.angleGoal, response, delta);
  rig.radius = smooth(rig.radius, rig.radiusGoal, response, delta);
  rig.height = smooth(rig.height, rig.heightGoal, response, delta);

  // Follow a little of the car's sideways movement so the framing stays smooth.
  rig.target.z = smooth(rig.target.z, carGroup.position.z * 0.30, 4, delta);

  rig.camera.position.set(
    rig.target.x + Math.cos(rig.angle) * rig.radius,
    rig.height,
    rig.target.z + Math.sin(rig.angle) * rig.radius
  );
  rig.camera.lookAt(rig.target);
}
