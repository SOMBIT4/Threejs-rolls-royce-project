import * as THREE from 'three';
import { createKeyboard } from './keyboard.js';

// Stores all mouse, keyboard and driving state in one place.
export function createInteractionState(canvas) {
  const state = {
    keyboard: createKeyboard(),
    pointerDelta: new THREE.Vector2(),
    lastPointer: new THREE.Vector2(),
    wheelDelta: 0,
    dragging: false,

    // Driving state.
    driving: false,
    inspectionMode: false,
    driveVelocity: 0,
    driveAmount: 0,
    steering: 0,
    laneOffset: 0,

    // Camera helpers.
    autoOrbit: true,
    idleSeconds: 0,
    resetQueued: false,

    toggleDriving() {
      if (this.inspectionMode) return false;
      this.driving = !this.driving;
      return this.driving;
    },

    setInspectionMode(enabled) {
      this.inspectionMode = Boolean(enabled);
      if (this.inspectionMode) {
        this.driving = false;
        this.driveVelocity = 0;
        this.driveAmount = 0;
        this.steering = 0;
      }
    },

    requestReset() {
      this.resetQueued = true;
      this.laneOffset = 0;
    },

    consumeReset() {
      const value = this.resetQueued;
      this.resetQueued = false;
      return value;
    },

    markManualInput() {
      this.idleSeconds = 0;
      this.autoOrbit = false;
    },

    isMoving() {
      return Math.abs(this.driveVelocity) > 0.035;
    },

    update(delta) {
      // W/S override cruise speed. Details mode always stops the car.
      let targetSpeed = this.inspectionMode ? 0 : (this.driving ? 0.70 : 0);
      if (!this.inspectionMode && this.keyboard.forward && !this.keyboard.backward) targetSpeed = 1.08;
      if (!this.inspectionMode && this.keyboard.backward && !this.keyboard.forward) targetSpeed = -0.48;

      const speedResponse = Math.abs(targetSpeed) > Math.abs(this.driveVelocity) ? 2.65 : 4.2;
      this.driveVelocity = THREE.MathUtils.lerp(
        this.driveVelocity,
        targetSpeed,
        1 - Math.exp(-speedResponse * delta)
      );
      if (Math.abs(this.driveVelocity) < 0.004 && targetSpeed === 0) this.driveVelocity = 0;
      this.driveAmount = Math.min(1, Math.abs(this.driveVelocity));

      // A/D steering.
      let targetSteering = 0;
      if (!this.inspectionMode && this.keyboard.left && !this.keyboard.right) targetSteering = 1;
      if (!this.inspectionMode && this.keyboard.right && !this.keyboard.left) targetSteering = -1;
      this.steering = THREE.MathUtils.lerp(this.steering, targetSteering, 1 - Math.exp(-8 * delta));

      // Move the car sideways while driving.
      if (this.driveAmount > 0.025) {
        const direction = this.driveVelocity < 0 ? -1 : 1;
        this.laneOffset += this.steering * direction * this.driveAmount * delta * 1.75;
        this.laneOffset = THREE.MathUtils.clamp(this.laneOffset, -2.15, 2.15);
      }

      // Resume slow showroom orbit after the user is inactive.
      this.idleSeconds += delta;
      if (!this.dragging && this.idleSeconds > 7.5) this.autoOrbit = true;
    }
  };

  // Mouse drag = orbit camera.
  canvas.addEventListener('pointerdown', (event) => {
    state.dragging = true;
    state.lastPointer.set(event.clientX, event.clientY);
    state.markManualInput();
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!state.dragging) return;
    state.pointerDelta.x += event.clientX - state.lastPointer.x;
    state.pointerDelta.y += event.clientY - state.lastPointer.y;
    state.lastPointer.set(event.clientX, event.clientY);
    state.markManualInput();
  });

  window.addEventListener('pointerup', () => { state.dragging = false; });

  // Mouse wheel = zoom.
  canvas.addEventListener('wheel', (event) => {
    state.wheelDelta += event.deltaY;
    state.markManualInput();
    event.preventDefault();
  }, { passive: false });

  // Extra shortcuts: Space = cruise, R = reset.
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && !event.repeat && !state.inspectionMode) {
      state.toggleDriving();
      event.preventDefault();
    }
    if (event.code === 'KeyR' && !event.repeat) {
      state.requestReset();
      state.markManualInput();
    }
    if (event.code.startsWith('Arrow')) state.markManualInput();
  });

  return state;
}
