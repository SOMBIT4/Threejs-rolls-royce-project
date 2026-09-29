import { setExteriorCamera } from './camera.js';

// =====================================================
// PAINT COLORS
// Add/remove colors here. No other file needs changing.
// =====================================================
const PAINTS = [
  { name: 'Obsidian Black', color: '#050608' },
  { name: 'Arctic White', color: '#e5e3dd' },
  { name: 'Royal Red', color: '#7a1018' },
  { name: 'Midnight Blue', color: '#102b48' }
];

export function createControls({ interactions, car, cameraRig, audio, visualMode, detailsInspector }) {
  const ui = document.querySelector('#app-ui');
  const cruiseButton = document.querySelector('#cruise-button');
  const modeButton = document.querySelector('#mode-button');
  const musicButton = document.querySelector('#music-button');
  const paintButton = document.querySelector('#paint-button');
  const paintPicker = document.querySelector('#paint-picker');
  const detailsButton = document.querySelector('#details-button');
  const resetButton = document.querySelector('#reset-button');
  const status = document.querySelector('#drive-status');

  // Refresh button states after any interaction.
  function sync() {
    const night = visualMode.getMode() === 'night';
    cruiseButton.classList.toggle('is-active', interactions.driving);
    musicButton.classList.toggle('is-active', audio.isPlaying());
    modeButton.classList.toggle('is-active', night);
    detailsButton.classList.toggle('is-active', detailsInspector.isEnabled());
    ui.classList.toggle('is-night', night);
    modeButton.textContent = night ? 'Day' : 'Night';
  }

  function updateStatus() {
    if (detailsInspector.isEnabled()) {
      status.textContent = 'Details mode • car stopped • click a point';
    } else if (interactions.isMoving()) {
      status.textContent = interactions.driveVelocity < 0 ? 'Reverse' : 'Driving';
    } else {
      status.textContent = 'Showroom mode • click car or Cruise';
    }
  }

  cruiseButton.addEventListener('click', async () => {
    if (detailsInspector.isEnabled()) detailsInspector.setEnabled(false);
    interactions.toggleDriving();
    if (!audio.isPlaying()) await audio.play();
    sync();
  });

  modeButton.addEventListener('click', () => {
    visualMode.toggle();
    sync();
  });

  musicButton.addEventListener('click', async () => {
    await audio.toggle();
    sync();
  });

  paintButton.addEventListener('click', () => paintPicker.classList.toggle('is-open'));

  detailsButton.addEventListener('click', () => {
    paintPicker.classList.remove('is-open');
    detailsInspector.toggle();
    sync();
  });

  resetButton.addEventListener('click', () => {
    interactions.requestReset();
    interactions.markManualInput();
    setExteriorCamera(cameraRig);
    sync();
  });

  // Build the four paint swatches from PAINTS above.
  PAINTS.forEach((paint, index) => {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = `paint-swatch${index === 0 ? ' is-active' : ''}`;
    swatch.style.background = paint.color;
    swatch.title = paint.name;

    swatch.addEventListener('click', () => {
      car.setBodyColor(paint.color);
      paintPicker.querySelectorAll('.paint-swatch').forEach((item) => item.classList.toggle('is-active', item === swatch));
    });
    paintPicker.append(swatch);
  });

  // M toggles music. Space/R are handled in interactions.js; this only refreshes the UI.
  window.addEventListener('keydown', async (event) => {
    if (!event.repeat && event.code === 'KeyM') {
      await audio.toggle();
      sync();
    }
    if (event.code === 'Space' || event.code === 'KeyR') requestAnimationFrame(sync);
  });

  // Click outside the right-side UI to close the color picker.
  document.addEventListener('pointerdown', (event) => {
    if (!ui.contains(event.target)) paintPicker.classList.remove('is-open');
  });

  sync();
  return {
    show: () => ui.classList.add('is-ready'),
    sync,
    update: updateStatus
  };
}
