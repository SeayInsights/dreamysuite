export default function fadeSlideUp(el, opts) {
  var duration = (opts && opts.duration != null) ? opts.duration : 0.6;
  var delay = (opts && opts.delay != null) ? opts.delay : 0;
  var ease = (opts && opts.easing) ? opts.easing : 'power2.out';
  gsap.fromTo(el, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: duration, delay: delay, ease: ease });
}
