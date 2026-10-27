const TARGETS =
  ".timeline__item, .card, .skills__group, .cert, .award, .education__item, .stat, .moment, .value, .entry";

let observer;

export function observeReveal() {
  observer ??= new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll(TARGETS).forEach((node) => {
    if (node.classList.contains("reveal")) return;
    node.classList.add("reveal");
    observer.observe(node);
  });
}
