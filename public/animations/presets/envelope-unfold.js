export default function envelopeUnfold(el, opts) {
  var duration = (opts && opts.duration != null) ? opts.duration : 0.8;
  var delay = (opts && opts.delay != null) ? opts.delay : 0;
  var ease = (opts && opts.easing) ? opts.easing : 'back.out(1.4)';
  gsap.fromTo(
    el,
    { rotateX: -90, opacity: 0, transformOrigin: 'top center' },
    { rotateX: 0, opacity: 1, transformOrigin: 'top center', duration: duration, delay: delay, ease: ease }
  );
}
