export default function letterCascade(el) {
  var words = (el.textContent || "").split(" ").filter(Boolean);
  if (!words.length) return;
  var spans = words.map(function (w, i) {
    var s = document.createElement("span");
    s.textContent = (i > 0 ? " " : "") + w;
    s.style.display = "inline-block";
    return s;
  });
  el.textContent = "";
  spans.forEach(function (s) { el.appendChild(s); });
  gsap.fromTo(spans, { opacity: 0, y: 24, rotateZ: 4 }, { opacity: 1, y: 0, rotateZ: 0, duration: 0.6, ease: "power3.out", stagger: 0.08 });
}
