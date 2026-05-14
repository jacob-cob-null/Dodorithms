const DEFAULTS = {
  barrel: 1.05,
  vignetteRadius: 0.92,
  vignetteStrength: 0.18,
  contrast: 0.045,
  saturation: 0.045,
};

export function applyCrt(scene, options = {}) {
  const config = { ...DEFAULTS, ...options };
  const camera = scene.cameras?.main;

  if (!camera || camera._dodorithmicCrtApplied) {
    return;
  }

  camera._dodorithmicCrtApplied = true;

  try {
    const filters = camera.filters?.external;
    if (!filters) {
      return;
    }

    if (config.barrel) {
      filters.addBarrel(config.barrel);
    }

    filters.addVignette(
      0.5,
      0.5,
      config.vignetteRadius,
      config.vignetteStrength,
      0x020810,
    );

    const color = filters.addColorMatrix();
    color.contrast(config.contrast, true);
    color.saturate(config.saturation, true);
  } catch {
    // Camera filters are WebGL-only; CSS overlays still provide the CRT shell.
  }
}

export function installCrtDomOverlay() {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.getElementById('game');
  if (!root || root.dataset.crtOverlay === 'installed') {
    return;
  }

  root.dataset.crtOverlay = 'installed';

  const shell = document.createElement('div');
  shell.className = 'crt-shell';
  shell.setAttribute('aria-hidden', 'true');

  const sweep = document.createElement('div');
  sweep.className = 'crt-sweep';
  shell.appendChild(sweep);

  root.appendChild(shell);
}
