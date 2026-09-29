// Keyboard map kept in its own file so the controls are easy to find/change.
const KEY_MAP = {
  KeyW: 'forward',
  KeyS: 'backward',
  KeyA: 'left',
  KeyD: 'right',
  ArrowLeft: 'cameraLeft',
  ArrowRight: 'cameraRight',
  ArrowUp: 'cameraUp',
  ArrowDown: 'cameraDown'
};

export function createKeyboard() {
  const state = {};
  Object.values(KEY_MAP).forEach((key) => { state[key] = false; });

  function setKey(event, value) {
    const key = KEY_MAP[event.code];
    if (!key) return;
    state[key] = value;
    event.preventDefault();
  }

  window.addEventListener('keydown', (event) => setKey(event, true));
  window.addEventListener('keyup', (event) => setKey(event, false));
  window.addEventListener('blur', () => Object.keys(state).forEach((key) => { state[key] = false; }));

  return state;
}
