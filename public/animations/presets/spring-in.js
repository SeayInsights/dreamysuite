export default function springIn(el, opts) {
  var duration = (opts && opts.duration != null) ? opts.duration : 0.8;
  var delay = (opts && opts.delay != null) ? opts.delay : 0;
  var ease = (opts && opts.easing) ? opts.easing : 'elastic.out(1, 0.4)';
  gsap.fromTo(el, { opacity: 0, y: 24, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: duration, delay: delay, ease: ease });
}
