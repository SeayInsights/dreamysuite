export default function stickyDate(el, opts) {
  gsap.registerPlugin(ScrollTrigger);
  el.style.position = 'sticky';
  el.style.top = '0';
  el.style.zIndex = '10';
  gsap.fromTo(
    el,
    { scale: 1, transformOrigin: 'top center' },
    { scale: 0.85, transformOrigin: 'top center', ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: '+=200', scrub: true } }
  );
}
