import * as THREE from 'three';

// One simple country road. The shader scrolls to make forward motion visible.
export function createRoad(shaderMaterials) {
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(72, 8.6),
    shaderMaterials.roadSurface
  );
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.006;
  road.receiveShadow = true;

  const group = new THREE.Group();
  group.name = 'Country road';
  group.add(road);

  let travel = 0;
  return {
    group,
    update(delta, interactions) {
      travel += delta * 13.5 * interactions.driveVelocity;
      shaderMaterials.roadSurface.uniforms.uTravel.value = travel;
    }
  };
}
