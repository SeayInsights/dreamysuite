export default function fadeIn(el, opts) {
  var duration = (opts && opts.duration != null) ? opts.duration : 0.6;
  var delay = (opts && opts.delay != null) ? opts.delay : 0;
  var ease = (opts && opts.easing) ? opts.easing : 'power2.out';
  gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: duration, delay: delay, ease: ease });
}
