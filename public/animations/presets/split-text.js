export default function splitText(el) {
  var text = el.textContent || "";
  if (!text.trim()) return;
  var chars = text.split("").map(function (c) {
    var s = document.createElement("span");
    s.textContent = c === " " ? "\u00a0" : c;
    s.style.display = "inline-block";
    return s;
  });
  el.textContent = "";
  chars.forEach(function (s) { el.appendChild(s); });
  gsap.fromTo(chars, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.05 });
}
