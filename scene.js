import * as THREE from 'three';

// Basic scene + fog. environment.js changes these colors for day/night.
export function createScene() {
  const skyColor = new THREE.Color(0xcfe7f2);
  const scene = new THREE.Scene();
  scene.background = skyColor;
  scene.fog = new THREE.FogExp2(skyColor.clone(), 0.0105);
  return scene;
}
