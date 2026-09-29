import * as THREE from 'three';

// All project textures are loaded here.
export function createProjectTextures(renderer) {
  const road = new THREE.TextureLoader().load('./texture/road-asphalt.svg');
  road.colorSpace = THREE.SRGBColorSpace;
  road.wrapS = THREE.RepeatWrapping;
  road.wrapT = THREE.RepeatWrapping;
  road.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return { road };
}
