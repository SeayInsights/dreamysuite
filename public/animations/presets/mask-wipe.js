export default function maskWipe(el, opts) {
  var duration = (opts && opts.duration != null) ? opts.duration : 0.8;
  var delay = (opts && opts.delay != null) ? opts.delay : 0;
  var ease = (opts && opts.easing) ? opts.easing : 'power2.inOut';
  gsap.fromTo(el, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: duration, delay: delay, ease: ease });
}
