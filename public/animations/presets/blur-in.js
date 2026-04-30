export default function blurIn(el, opts) {
  var duration = (opts && opts.duration != null) ? opts.duration : 0.7;
  var delay = (opts && opts.delay != null) ? opts.delay : 0;
  var ease = (opts && opts.easing) ? opts.easing : 'power2.out';
  gsap.fromTo(el, { opacity: 0, filter: 'blur(10px)' }, { opacity: 1, filter: 'blur(0px)', duration: duration, delay: delay, ease: ease });
}
