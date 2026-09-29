import * as THREE from 'three';

// =====================================================
// DETAIL POINTS - THIS IS THE MAIN SECTION TO EDIT
// position: [X, Y, Z]
// +X = front, -X = rear, Y = height, +/-Z = car sides.
// mirrorToCamera: true makes a side point move to the visible side.
// =====================================================
// ========================================================
// ROLLS-ROYCE CAR DETAIL POINTS
// Change position: [X, Y, Z] if you want to move a point.
// +X = front, -X = rear, Y = height, +/-Z = left/right.
// ========================================================

const DETAIL_POINTS = [
  {
    key: 'grille',
    title: 'Rolls-Royce Radiator Grille',
    text:
      'The tall polished radiator grille is one of the most recognizable Rolls-Royce design features. Its upright shape gives the front of the Silver Shadow its formal and luxurious appearance.',
    position: [2.58, 0.88, 0]
  },

  {
    key: 'bonnet',
    title: 'Bonnet & Spirit of Ecstasy',
    text:
      'At the front of the bonnet sits the famous Spirit of Ecstasy mascot, one of the signature symbols of Rolls-Royce. The long bonnet also contributes to the car’s classic luxury proportions.',
    position: [1.38, 1.27, 0]
  },

  {
    key: 'front-wheel',
    title: 'Front Wheel & Disc Brakes',
    text:
      'The Rolls-Royce Silver Shadow used hydraulic disc brakes on all four wheels. This was an important part of its braking system and helped provide smooth, controlled stopping for the heavy luxury saloon.',
    position: [1.63, 0.54, 1.05],
    mirrorToCamera: true
  },

  {
    key: 'glass',
    title: 'Passenger Cabin',
    text:
      'The Silver Shadow was designed to provide a spacious and comfortable passenger cabin. Its large windows improve outward visibility while also giving the interior a more open and elegant feeling.',
    position: [0.16, 1.45, 1.03],
    mirrorToCamera: true
  },

  {
    key: 'roof',
    title: 'Monocoque Body',
    text:
      'The Silver Shadow was the first Rolls-Royce production car to use monocoque construction, where the body and chassis structure are integrated. This helped create a more compact exterior while improving interior space.',
    position: [-0.18, 1.78, 0]
  },

  {
    key: 'rear-wheel',
    title: 'Rear Suspension',
    text:
      'The Silver Shadow used independent rear suspension together with a self-levelling hydraulic system. This helped maintain ride height and contributed to the smooth ride expected from a Rolls-Royce.',
    position: [-1.56, 0.54, 1.05],
    mirrorToCamera: true
  },

  {
    key: 'rear',
    title: 'Rear Body & Luggage Area',
    text:
      'The Silver Shadow introduced a more compact body design than the earlier Silver Cloud while providing improved passenger and luggage space. The rear styling remains simple, formal and characteristic of classic Rolls-Royce design.',
    position: [-2.48, 0.96, 0]
  }
];

export function createCarPartInspector({ canvas, cameraRig, car, interactions, onDriveChange, getMode }) {
  const pointsRoot = document.querySelector('#detail-points');
  const card = document.querySelector('#detail-card');
  const cardTitle = card.querySelector('strong');
  const cardText = card.querySelector('span');

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const localPoint = new THREE.Vector3();
  const worldPoint = new THREE.Vector3();
  const projected = new THREE.Vector3();
  const markers = [];

  let enabled = false;
  let clickStart = null;

  // Create one HTML button for every DETAIL_POINTS entry above.
  for (const detail of DETAIL_POINTS) {
    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = 'car-detail-point';
    marker.title = detail.title;

    marker.addEventListener('click', (event) => {
      event.stopPropagation();
      cardTitle.textContent = detail.title;
      cardText.textContent = detail.text;
      card.classList.toggle('is-night', getMode() === 'night');
      card.classList.add('is-visible');
    });

    pointsRoot.append(marker);
    markers.push({ marker, detail });
  }

  // Outside Details mode, a short click on the 3D car toggles cruise.
  canvas.addEventListener('pointerdown', (event) => {
    clickStart = { x: event.clientX, y: event.clientY };
  });

  canvas.addEventListener('pointerup', (event) => {
    if (!clickStart || enabled) {
      clickStart = null;
      return;
    }

    const moved = Math.hypot(event.clientX - clickStart.x, event.clientY - clickStart.y);
    clickStart = null;
    if (moved > 6) return; // It was a camera drag, not a click.

    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, cameraRig.camera);

    if (raycaster.intersectObject(car.group, true).length) {
      interactions.toggleDriving();
      onDriveChange?.();
    }
  });

  function setEnabled(value) {
    enabled = Boolean(value);
    interactions.setInspectionMode(enabled); // Also stops the car.
    pointsRoot.classList.toggle('is-active', enabled);
    card.classList.remove('is-visible');
    if (!enabled) markers.forEach(({ marker }) => marker.classList.remove('is-visible'));
    onDriveChange?.();
    return enabled;
  }

  // Convert each 3D local car point into a 2D browser position every frame.
  function update() {
    if (!enabled) return;

    car.group.updateMatrixWorld(true);
    const cameraLocal = car.group.worldToLocal(cameraRig.camera.position.clone());
    const visibleSide = cameraLocal.z < 0 ? -1 : 1;

    for (const { marker, detail } of markers) {
      const [x, y, z] = detail.position;
      localPoint.set(x, y, detail.mirrorToCamera ? Math.abs(z) * visibleSide : z);
      worldPoint.copy(localPoint);
      car.group.localToWorld(worldPoint);
      projected.copy(worldPoint).project(cameraRig.camera);

      const visible = projected.z > -1 && projected.z < 1 && Math.abs(projected.x) < 1.08 && Math.abs(projected.y) < 1.08;
      marker.classList.toggle('is-visible', visible);
      if (!visible) continue;

      marker.style.left = `${(projected.x * 0.5 + 0.5) * window.innerWidth}px`;
      marker.style.top = `${(-projected.y * 0.5 + 0.5) * window.innerHeight}px`;
    }
  }

  return {
    isEnabled: () => enabled,
    toggle: () => setEnabled(!enabled),
    setEnabled,
    update,
    setMode(mode) {
      const night = mode === 'night';
      pointsRoot.classList.toggle('is-night', night);
      card.classList.toggle('is-night', night);
    }
  };
}
