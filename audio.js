const MUSIC_URL = './audio/showroom-ambient.wav';
const VOLUME = 0.24;

// Background music with a short fade instead of an abrupt start/stop.
export function createAudioSystem() {
  const music = new Audio(MUSIC_URL);
  music.loop = true;
  music.preload = 'auto';
  music.volume = 0;

  let wanted = false;
  let frameId = 0;

  function fadeTo(target, duration, done) {
    cancelAnimationFrame(frameId);
    const start = music.volume;
    const startTime = performance.now();

    function frame(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const smooth = t * t * (3 - 2 * t);
      music.volume = start + (target - start) * smooth;
      if (t < 1) frameId = requestAnimationFrame(frame);
      else done?.();
    }
    frameId = requestAnimationFrame(frame);
  }

  async function play() {
    wanted = true;
    try {
      await music.play();
      fadeTo(VOLUME, 700);
    } catch (error) {
      console.warn('Music needs a user click before the browser allows playback.', error);
    }
  }

  function pause() {
    wanted = false;
    fadeTo(0, 400, () => music.pause());
  }

  return {
    play,
    pause,
    async toggle() {
      if (music.paused) await play();
      else pause();
    },
    isPlaying: () => !music.paused && wanted
  };
}
