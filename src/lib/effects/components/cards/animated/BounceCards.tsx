// @ts-nocheck
"use client";

import { useEffect, useRef } from 'react';

const bounceCardsStyles = `
.bounceCardsContainer { position:relative; display:flex; justify-content:center; align-items:center; width:400px; height:400px; }
.bc-card { position:absolute; width:200px; aspect-ratio:1; border:5px solid #fff; border-radius:25px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.2); }
.bc-card .bc-image { width:100%; height:100%; object-fit:cover; }
`;

export default function BounceCards({
  className = '', images = [], containerWidth = 400, containerHeight = 400,
  animationDelay = 0.5, animationStagger = 0.06, easeType = 'elastic.out(1, 0.8)',
  transformStyles = [
    'rotate(10deg) translate(-170px)', 'rotate(5deg) translate(-85px)',
    'rotate(-3deg)', 'rotate(-10deg) translate(85px)', 'rotate(2deg) translate(170px)'
  ],
  enableHover = true
}) {
  const containerRef = useRef(null);
  const gsapRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let ctx = null;

    (async () => {
      const { gsap } = await import('gsap');
      gsapRef.current = gsap;
      if (cancelled) return;
      ctx = gsap.context(() => {
        gsap.fromTo('.bc-card', { scale: 0 }, { scale: 1, stagger: animationStagger, ease: easeType, delay: animationDelay });
      }, containerRef);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [animationStagger, easeType, animationDelay]);

  const getNoRotationTransform = transformStr => {
    if (/rotate\([\s\S]*?\)/.test(transformStr)) return transformStr.replace(/rotate\([\s\S]*?\)/, 'rotate(0deg)');
    if (transformStr === 'none') return 'rotate(0deg)';
    return `${transformStr} rotate(0deg)`;
  };

  const getPushedTransform = (baseTransform, offsetX) => {
    const translateRegex = /translate\(([-0-9.]+)px\)/;
    const match = baseTransform.match(translateRegex);
    if (match) {
      const newX = parseFloat(match[1]) + offsetX;
      return baseTransform.replace(translateRegex, `translate(${newX}px)`);
    }
    return baseTransform === 'none' ? `translate(${offsetX}px)` : `${baseTransform} translate(${offsetX}px)`;
  };

  const pushSiblings = hoveredIdx => {
    const gsap = gsapRef.current;
    if (!enableHover || !containerRef.current || !gsap) return;
    const q = gsap.utils.selector(containerRef);
    images.forEach((_, i) => {
      const target = q(`.bc-card-${i}`);
      gsap.killTweensOf(target);
      const baseTransform = transformStyles[i] || 'none';
      if (i === hoveredIdx) {
        gsap.to(target, { transform: getNoRotationTransform(baseTransform), duration: 0.4, ease: 'back.out(1.4)', overwrite: 'auto' });
      } else {
        const offsetX = i < hoveredIdx ? -160 : 160;
        gsap.to(target, { transform: getPushedTransform(baseTransform, offsetX), duration: 0.4, ease: 'back.out(1.4)', delay: Math.abs(hoveredIdx - i) * 0.05, overwrite: 'auto' });
      }
    });
  };

  const resetSiblings = () => {
    const gsap = gsapRef.current;
    if (!enableHover || !containerRef.current || !gsap) return;
    const q = gsap.utils.selector(containerRef);
    images.forEach((_, i) => {
      const target = q(`.bc-card-${i}`);
      gsap.killTweensOf(target);
      gsap.to(target, { transform: transformStyles[i] || 'none', duration: 0.4, ease: 'back.out(1.4)', overwrite: 'auto' });
    });
  };

  return (
    <>
      <style>{bounceCardsStyles}</style>
      <div className={`bounceCardsContainer ${className}`} ref={containerRef} style={{ position:'relative', width:containerWidth, height:containerHeight }}>
        {images.map((src, idx) => (
          <div key={idx} className={`bc-card bc-card-${idx}`} style={{ transform: transformStyles[idx] ?? 'none' }}
            onMouseEnter={() => pushSiblings(idx)} onMouseLeave={resetSiblings}>
            <img className="bc-image" src={src} alt={`card-${idx}`} />
          </div>
        ))}
      </div>
    </>
  );
}
