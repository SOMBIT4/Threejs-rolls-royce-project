import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const DAY = {
  sky: 0xcfe7f2,
  fog: 0xd7e9ef,
  grass: 0x5f8a48,
  trees: 0x3f6d39,
  trunks: 0x664831,
  posts: 0xe8e4d8,
  fogDensity: 0.0105,
  stars: 0
};

const NIGHT = {
  sky: 0x101925,
  fog: 0x172231,
  grass: 0x17301f,
  trees: 0x163220,
  trunks: 0x2d241f,
  posts: 0x979c9f,
  fogDensity: 0.016,
  stars: 0.9
};

function createStars() {
  const positions = [];
  for (let i = 0; i < 150; i += 1) {
    const angle = i * 2.39996;
    const radius = 45 + (i % 8);
    const height = 10 + ((i * 17) % 36);
    positions.push(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0xeaf2ff, size: 0.15, transparent: true, opacity: 0, fog: false })
  );
}

// Creates grass, sparse trees, roadside posts and night stars.
export function createEnvironment(renderer, scene) {
  const group = new THREE.Group();
  group.name = 'Simple countryside';

  // Reflection environment for the car paint/chrome.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment(renderer);
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  pmrem.dispose();

  const grassMaterial = new THREE.MeshStandardMaterial({ color: DAY.grass, roughness: 1 });
  const treeMaterial = new THREE.MeshStandardMaterial({ color: DAY.trees, roughness: 1 });
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: DAY.trunks, roughness: 1 });
  const postMaterial = new THREE.MeshStandardMaterial({ color: DAY.posts, roughness: 0.9 });

  const grass = new THREE.Mesh(new THREE.PlaneGeometry(100, 70), grassMaterial);
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = -0.015;
  grass.receiveShadow = true;
  group.add(grass);

  const stars = createStars();
  group.add(stars);

  // These objects move backwards while the car drives, creating motion cues.
  const movingObjects = [];
  const treeSpan = 92;
  const postSpan = 78;
  const trunkGeometry = new THREE.CylinderGeometry(0.11, 0.14, 1.2, 7);
  const crownGeometry = new THREE.ConeGeometry(0.9, 2.15, 9);
  const postGeometry = new THREE.BoxGeometry(0.11, 0.58, 0.11);

  for (const side of [-1, 1]) {
    for (let i = 0; i < 7; i += 1) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      const crown = new THREE.Mesh(crownGeometry, treeMaterial);
      trunk.position.y = 0.6;
      crown.position.y = 2.15;
      tree.add(trunk, crown);
      tree.position.set(-treeSpan / 2 + i * 13.2 + (side > 0 ? 4 : 0), 0, side * (8 + (i % 3) * 1.2));
      tree.userData.baseX = tree.position.x;
      tree.userData.span = treeSpan;
      movingObjects.push(tree);
      group.add(tree);
    }

    for (let i = 0; i < 11; i += 1) {
      const post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(-postSpan / 2 + i * 7.1 + (side > 0 ? 2 : 0), 0.29, side * 5.25);
      post.userData.baseX = post.position.x;
      post.userData.span = postSpan;
      movingObjects.push(post);
      group.add(post);
    }
  }

  let travel = 0;
  let mode = 'day';
  let target = DAY;

  const skyTarget = new THREE.Color(DAY.sky);
  const fogTarget = new THREE.Color(DAY.fog);
  const grassTarget = new THREE.Color(DAY.grass);
  const treeTarget = new THREE.Color(DAY.trees);
  const trunkTarget = new THREE.Color(DAY.trunks);
  const postTarget = new THREE.Color(DAY.posts);

  function setMode(nextMode) {
    mode = nextMode === 'night' ? 'night' : 'day';
    target = mode === 'night' ? NIGHT : DAY;
    skyTarget.set(target.sky);
    fogTarget.set(target.fog);
    grassTarget.set(target.grass);
    treeTarget.set(target.trees);
    trunkTarget.set(target.trunks);
    postTarget.set(target.posts);
    return mode;
  }

  return {
    group,
    setMode,
    update(delta, interactions) {
      travel += delta * 13.5 * interactions.driveVelocity;

      // Repeat trees/posts forever along the road.
      for (const object of movingObjects) {
        const half = object.userData.span / 2;
        object.position.x = THREE.MathUtils.euclideanModulo(object.userData.baseX - travel + half, object.userData.span) - half;
      }

      // Smooth day/night color transition.
      const blend = 1 - Math.exp(-2.4 * delta);
      scene.background.lerp(skyTarget, blend);
      scene.fog.color.lerp(fogTarget, blend);
      scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, target.fogDensity, blend);
      grassMaterial.color.lerp(grassTarget, blend);
      treeMaterial.color.lerp(treeTarget, blend);
      trunkMaterial.color.lerp(trunkTarget, blend);
      postMaterial.color.lerp(postTarget, blend);
      stars.material.opacity = THREE.MathUtils.lerp(stars.material.opacity, target.stars, blend);
    }
  };
}
