export default function letterCascade(el, opts) {
  var duration = (opts && opts.duration != null) ? opts.duration : 0.6;
  var delay = (opts && opts.delay != null) ? opts.delay : 0;
  var ease = (opts && opts.easing) ? opts.easing : 'power3.out';

  // Query text leaf elements inside the block — avoids destroying rich HTML structure
  var textEls = el.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span:not(span span), a, li');
  var targets = textEls.length ? Array.from(textEls) : [el];

  var allSpans = [];

  for (var i = 0; i < targets.length; i++) {
    var textEl = targets[i];
    // Skip elements that have child elements (are structural containers) unless it's the root el
    if (textEl.children.length > 0 && textEl !== el) continue;
    var text = textEl.textContent || '';
    var words = text.split(' ').filter(Boolean);
    if (!words.length) continue;

    var spans = words.map(function(word, wi) {
      var s = document.createElement('span');
      s.textContent = (wi > 0 ? ' ' : '') + word;
      s.style.display = 'inline-block';
      return s;
    });

    textEl.textContent = '';
    spans.forEach(function(s) { textEl.appendChild(s); });
    allSpans = allSpans.concat(spans);
  }

  if (!allSpans.length) return;

  gsap.fromTo(allSpans, { opacity: 0, y: 24, rotateZ: 4 }, { opacity: 1, y: 0, rotateZ: 0, duration: duration, delay: delay, ease: ease, stagger: 0.08 });
}
