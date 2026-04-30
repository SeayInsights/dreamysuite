export default function splitText(el, opts) {
  var duration = (opts && opts.duration != null) ? opts.duration : 0.45;
  var delay = (opts && opts.delay != null) ? opts.delay : 0;
  var ease = (opts && opts.easing) ? opts.easing : 'power2.out';

  // Query text leaf elements inside the block — avoids destroying rich HTML structure
  var textEls = el.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span:not(span span), a, li');
  var targets = textEls.length ? Array.from(textEls) : [el];

  var allSpans = [];

  for (var i = 0; i < targets.length; i++) {
    var textEl = targets[i];
    // Skip elements that have child elements (are structural containers) unless it's the root el
    if (textEl.children.length > 0 && textEl !== el) continue;
    var text = textEl.textContent || '';
    if (!text.trim()) continue;

    var chars = text.split('').map(function(ch) {
      var s = document.createElement('span');
      s.textContent = ch === ' ' ? ' ' : ch;
      s.style.display = 'inline-block';
      return s;
    });

    textEl.textContent = '';
    chars.forEach(function(s) { textEl.appendChild(s); });
    allSpans = allSpans.concat(chars);
  }

  if (!allSpans.length) return;

  gsap.fromTo(allSpans, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: duration, delay: delay, ease: ease, stagger: 0.05 });
}
