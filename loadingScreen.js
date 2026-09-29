// Small helper for the loading overlay already written in index.html.
export function createLoadingScreen() {
  const root = document.querySelector('#loading-screen');
  const progress = document.querySelector('#loading-progress');
  const percent = document.querySelector('#loading-percent');
  const error = document.querySelector('#loading-error');
  let shown = 0;

  return {
    setProgress(value) {
      shown = Math.max(shown, Math.min(1, value));
      const number = Math.round(shown * 100);
      progress.style.width = `${number}%`;
      percent.textContent = `${number}%`;
    },
    complete() {
      this.setProgress(1);
      setTimeout(() => root.classList.add('is-done'), 250);
    },
    fail(message) {
      root.classList.add('has-error');
      error.textContent = message || 'Vehicle loading failed.';
      percent.textContent = 'Error';
    }
  };
}
