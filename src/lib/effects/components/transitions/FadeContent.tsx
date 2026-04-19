// @ts-nocheck
"use client";
import { useRef, useEffect } from 'react';

const FadeContent = ({
  children,
  container,
  blur = false,
  duration = 1000,
  ease = 'power2.out',
  delay = 0,
  threshold = 0.1,
  initialOpacity = 0,
  disappearAfter = 0,
  disappearDuration = 0.5,
  disappearEase = 'power2.in',
  onComplete,
  onDisappearanceComplete,
  className = '',
  style,
  ...props
}) => {
  const ref = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const cleanup: Array<() => void> = [];

    (async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);
      if (cancelled) return;

      const el = ref.current;
      if (!el) return;

      let scrollerTarget = container || document.getElementById('snap-main-container') || null;
      if (typeof scrollerTarget === 'string') {
        scrollerTarget = document.querySelector(scrollerTarget);
      }

      const startPct = (1 - threshold) * 100;

      const getSeconds = val => (typeof val === 'number' && val > 10 ? val / 1000 : val);

      gsap.set(el, {
        autoAlpha: initialOpacity,
        filter: blur ? 'blur(10px)' : 'blur(0px)',
        willChange: 'opacity, filter, transform'
      });

      const tl = gsap.timeline({
        paused: true,
        delay: getSeconds(delay),
        onComplete: () => {
          if (onComplete) onComplete();
          if (disappearAfter > 0) {
            gsap.to(el, {
              autoAlpha: initialOpacity,
              filter: blur ? 'blur(10px)' : 'blur(0px)',
              delay: getSeconds(disappearAfter),
              duration: getSeconds(disappearDuration),
              ease: disappearEase,
              onComplete: () => onDisappearanceComplete?.()
            });
          }
        }
      });

      tl.to(el, {
        autoAlpha: 1,
        filter: 'blur(0px)',
        duration: getSeconds(duration),
        ease: ease
      });

      const st = ScrollTrigger.create({
        trigger: el,
        scroller: scrollerTarget || window,
        start: `top ${startPct}%`,
        once: true,
        onEnter: () => tl.play()
      });

      cleanup.push(
        () => st.kill(),
        () => tl.kill(),
        () => gsap.killTweensOf(el)
      );
    })();

    return () => {
      cancelled = true;
      cleanup.forEach(fn => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref} className={className} style={style} {...props}>
      {children}
    </div>
  );
};

export default FadeContent;
