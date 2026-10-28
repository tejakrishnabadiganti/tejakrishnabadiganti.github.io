// Scroll progress and pointer-driven 3D effects. Pointer effects are skipped on touch
// devices and for visitors who ask for reduced motion.
const TILT_MAX_DEGREES = 6;
const HERO_MAX_DEGREES = 9;
const LIFT_PX = 14;
const TILT_TARGETS = ".card, .award, .cert, .skills__group, .stat, .value";
const SHOW_TO_TOP_AFTER_PX = 700;

const canHover = () =>
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setTilt(node, rx, ry) {
  node.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
  node.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
}

function pointerRatio(event, rect) {
  return {
    x: Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1) - 0.5,
    y: Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1) - 0.5,
  };
}

function initScrollProgress() {
  const bar = document.getElementById("scroll-progress");
  const toTop = document.getElementById("to-top");
  let frame = 0;
  const update = () => {
    frame = 0;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty("--progress", scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0);
    toTop.classList.toggle("is-visible", window.scrollY > SHOW_TO_TOP_AFTER_PX);
  };
  window.addEventListener(
    "scroll",
    () => {
      frame ||= requestAnimationFrame(update);
    },
    { passive: true }
  );
  update();
}

function initHeroParallax() {
  const hero = document.querySelector(".hero");
  const stage = document.getElementById("hero-stage");

  hero.addEventListener("pointermove", (event) => {
    const { x, y } = pointerRatio(event, hero.getBoundingClientRect());
    setTilt(stage, -y * HERO_MAX_DEGREES, x * HERO_MAX_DEGREES);
  });
  hero.addEventListener("pointerleave", () => setTilt(stage, 0, 0));
}

function initCardTilt() {
  let active = null;
  const release = () => {
    if (!active) return;
    active.classList.remove("is-tilting");
    active.style.removeProperty("--lift");
    setTilt(active, 0, 0);
    active = null;
  };

  document.addEventListener("pointermove", (event) => {
    const target = event.target.closest?.(TILT_TARGETS) ?? null;
    if (target !== active) {
      release();
      active = target;
      active?.classList.add("is-tilting");
      active?.style.setProperty("--lift", `${LIFT_PX}px`);
    }
    if (!active) return;

    const { x, y } = pointerRatio(event, active.getBoundingClientRect());
    setTilt(active, -y * TILT_MAX_DEGREES, x * TILT_MAX_DEGREES);
  });
  document.addEventListener("pointerleave", release);
}

export function initMotion() {
  initScrollProgress();
  if (!canHover()) return;
  initHeroParallax();
  initCardTilt();
}
