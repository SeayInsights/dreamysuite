// @ts-nocheck
"use client";

const _inject_StickerPeel_Styles = () => {
  if (typeof document === 'undefined') return;
  const id = 'StickerPeel-styles';
  if (document.getElementById(id)) return;
  const el = document.createElement('style');
  el.id = id;
  el.textContent = `:root {
  --sticker-rotate: 30deg;
  --sticker-p: 10px;
  --sticker-peelback-hover: 30%;
  --sticker-peelback-active: 40%;
  --sticker-peel-easing: power3.out;
  --sticker-peel-hover-easing: power2.out;
  --sticker-start: calc(-1 * var(--sticker-p));
  --sticker-end: calc(100% + var(--sticker-p));
  --sticker-shadow-opacity: 0.6;
  --sticker-lighting-constant: 0.1;
  --peel-direction: 0deg;
}

.sticker-container {
  position: relative;
  transform: rotate(var(--peel-direction));
  transform-origin: center;
}

.sticker-container * {
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

.sticker-main {
  clip-path: polygon(
    var(--sticker-start) var(--sticker-start),
    var(--sticker-end) var(--sticker-start),
    var(--sticker-end) var(--sticker-end),
    var(--sticker-start) var(--sticker-end)
  );
  transition: clip-path 0.6s ease-out;
  filter: url(#dropShadow);
}

.sticker-main > * {
  transform: rotate(calc(-1 * var(--peel-direction)));
}

.sticker-lighting {
  filter: url(#pointLight);
}

.sticker-container:hover .sticker-main,
.sticker-container.touch-active .sticker-main {
  clip-path: polygon(
    var(--sticker-start) var(--sticker-peelback-hover),
    var(--sticker-end) var(--sticker-peelback-hover),
    var(--sticker-end) var(--sticker-end),
    var(--sticker-start) var(--sticker-end)
  );
}

.sticker-container:active .sticker-main {
  clip-path: polygon(
    var(--sticker-start) var(--sticker-peelback-active),
    var(--sticker-end) var(--sticker-peelback-active),
    var(--sticker-end) var(--sticker-end),
    var(--sticker-start) var(--sticker-end)
  );
}

.sticker-image {
  transform: rotate(var(--sticker-rotate));
}

.flap {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: calc(-100% - var(--sticker-p) - var(--sticker-p));
  clip-path: polygon(
    var(--sticker-start) var(--sticker-start),
    var(--sticker-end) var(--sticker-start),
    var(--sticker-end) var(--sticker-start),
    var(--sticker-start) var(--sticker-start)
  );
  transform: scaleY(-1);
  transition: all 0.6s ease-out;
}

.flap > * {
  transform: rotate(calc(-1 * var(--peel-direction)));
}

.sticker-container:hover .flap,
.sticker-container.touch-active .flap {
  clip-path: polygon(
    var(--sticker-start) var(--sticker-start),
    var(--sticker-end) var(--sticker-start),
    var(--sticker-end) var(--sticker-peelback-hover),
    var(--sticker-start) var(--sticker-peelback-hover)
  );
  top: calc(-100% + 2 * var(--sticker-peelback-hover) - 1px);
}

.sticker-container:active .flap {
  clip-path: polygon(
    var(--sticker-start) var(--sticker-start),
    var(--sticker-end) var(--sticker-start),
    var(--sticker-end) var(--sticker-peelback-active),
    var(--sticker-start) var(--sticker-peelback-active)
  );
  top: calc(-100% + 2 * var(--sticker-peelback-active) - 1px);
}

.flap-lighting {
  filter: url(#pointLightFlipped);
}

.flap-image {
  transform: rotate(var(--sticker-rotate));
  filter: url(#expandAndFill);
}

.draggable {
  position: absolute;
  cursor: grab;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

.draggable:active {
  cursor: grabbing;
}

/* Mobile-specific optimizations */
@media (hover: none) and (pointer: coarse) {
  .draggable {
    cursor: default;
  }

  .sticker-container {
    touch-action: none;
  }
}

.sticker-image,
.flap-image {
  width: var(--sticker-width, 200px);
}

.sticker-main,
.flap {
  will-change: clip-path, transform;
}

.sticker-ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  pointer-events: none;
  z-index: 10;
}
`;
  document.head.appendChild(el);
};
if (typeof document !== 'undefined') _inject_StickerPeel_Styles();
import { useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';

const StickerPeel = ({
  imageSrc,
  rotate = 30,
  peelBackHoverPct = 30,
  peelBackActivePct = 40,
  peelEasing = 'power3.out',
  peelHoverEasing = 'power2.out',
  width = 200,
  shadowIntensity = 0.6,
  lightingIntensity = 0.1,
  initialPosition = 'center',
  peelDirection = 0,
  className = ''
}) => {
  const containerRef = useRef(null);
  const dragTargetRef = useRef(null);
  const pointLightRef = useRef(null);
  const pointLightFlippedRef = useRef(null);
  const draggableInstanceRef = useRef(null);
  const gsapRef = useRef(null);
  const DraggableRef = useRef(null);


  const defaultPadding = 10;

  useEffect(() => {
    const gsap = gsapRef.current;
    const target = dragTargetRef.current;
    if (!target) return;
    if (!gsap) return;

    let startX = 0,
      startY = 0;

    if (initialPosition === 'center') {
      return;
    }

    if (typeof initialPosition === 'object' && initialPosition.x !== undefined && initialPosition.y !== undefined) {
      startX = initialPosition.x;
      startY = initialPosition.y;
    }

    gsap.set(target, { x: startX, y: startY });
  }, [initialPosition]);

  useEffect(() => {
    let cancelled = false;
    const cleanup: Array<() => void> = [];

    (async () => {
      const { gsap } = await import('gsap');
      const { Draggable } = await import('gsap/Draggable');
      gsap.registerPlugin(Draggable);
      gsapRef.current = gsap;
      DraggableRef.current = Draggable;
      if (cancelled) return;

      const target = dragTargetRef.current;
      if (!target) return;
      const boundsEl = target.parentNode;

      draggableInstanceRef.current = Draggable.create(target, {
        type: 'x,y',
        bounds: boundsEl,
        inertia: true,
        onDrag() {
          const rot = gsap.utils.clamp(-24, 24, this.deltaX * 0.4);
          gsap.to(target, { rotation: rot, duration: 0.15, ease: 'power1.out' });
        },
        onDragEnd() {
          const rotationEase = 'power2.out';
          const duration = 0.8;
          gsap.to(target, { rotation: 0, duration, ease: rotationEase });
        }
      })[0];

      const handleResize = () => {
        if (draggableInstanceRef.current) {
          draggableInstanceRef.current.update();

          const currentX = gsap.getProperty(target, 'x');
          const currentY = gsap.getProperty(target, 'y');

          const boundsRect = boundsEl.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();

          const maxX = boundsRect.width - targetRect.width;
          const maxY = boundsRect.height - targetRect.height;

          const newX = Math.max(0, Math.min(currentX, maxX));
          const newY = Math.max(0, Math.min(currentY, maxY));

          if (newX !== currentX || newY !== currentY) {
            gsap.to(target, {
              x: newX,
              y: newY,
              duration: 0.3,
              ease: 'power2.out'
            });
          }
        }
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);

      cleanup.push(
        () => window.removeEventListener('resize', handleResize),
        () => window.removeEventListener('orientationchange', handleResize),
        () => { if (draggableInstanceRef.current) draggableInstanceRef.current.kill(); }
      );
    })();

    return () => {
      cancelled = true;
      cleanup.forEach(fn => fn());
    };
  }, []);

  useEffect(() => {
    const updateLight = e => {
      const gsap = gsapRef.current;
      if (!gsap) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      gsap.set(pointLightRef.current, { attr: { x, y } });

      const normalizedAngle = Math.abs(peelDirection % 360);
      if (normalizedAngle !== 180) {
        gsap.set(pointLightFlippedRef.current, { attr: { x, y: rect.height - y } });
      } else {
        gsap.set(pointLightFlippedRef.current, { attr: { x: -1000, y: -1000 } });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', updateLight);
      return () => container.removeEventListener('mousemove', updateLight);
    }
  }, [peelDirection]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = () => {
      container.classList.add('touch-active');
    };

    const handleTouchEnd = () => {
      container.classList.remove('touch-active');
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  const cssVars = useMemo(
    () => ({
      '--sticker-rotate': `${rotate}deg`,
      '--sticker-p': `${defaultPadding}px`,
      '--sticker-peelback-hover': `${peelBackHoverPct}%`,
      '--sticker-peelback-active': `${peelBackActivePct}%`,
      '--sticker-peel-easing': peelEasing,
      '--sticker-peel-hover-easing': peelHoverEasing,
      '--sticker-width': `${width}px`,
      '--sticker-shadow-opacity': shadowIntensity,
      '--sticker-lighting-constant': lightingIntensity,
      '--peel-direction': `${peelDirection}deg`
    }),
    [
      rotate,
      peelBackHoverPct,
      peelBackActivePct,
      peelEasing,
      peelHoverEasing,
      width,
      shadowIntensity,
      lightingIntensity,
      peelDirection
    ]
  );

  return (
    <div className={`draggable ${className}`} ref={dragTargetRef} style={cssVars}>
      <svg width="0" height="0">
        <defs>
          <filter id="pointLight">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feSpecularLighting
              result="spec"
              in="blur"
              specularExponent="100"
              specularConstant={lightingIntensity}
              lightingColor="white"
            >
              <fePointLight ref={pointLightRef} x="100" y="100" z="300" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceGraphic" result="lit" />
            <feComposite in="lit" in2="SourceAlpha" operator="in" />
          </filter>

          <filter id="pointLightFlipped">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feSpecularLighting
              result="spec"
              in="blur"
              specularExponent="100"
              specularConstant={lightingIntensity * 7}
              lightingColor="white"
            >
              <fePointLight ref={pointLightFlippedRef} x="100" y="100" z="300" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceGraphic" result="lit" />
            <feComposite in="lit" in2="SourceAlpha" operator="in" />
          </filter>

          <filter id="dropShadow">
            <feDropShadow
              dx="2"
              dy="4"
              stdDeviation={3 * shadowIntensity}
              floodColor="black"
              floodOpacity={shadowIntensity}
            />
          </filter>

          <filter id="expandAndFill">
            <feOffset dx="0" dy="0" in="SourceAlpha" result="shape" />
            <feFlood floodColor="rgb(179,179,179)" result="flood" />
            <feComposite operator="in" in="flood" in2="shape" />
          </filter>
        </defs>
      </svg>

      <div className="sticker-container" ref={containerRef}>
        <div className="sticker-main">
          <div className="sticker-lighting">
            <Image
              src={imageSrc}
              alt=""
              width={width}
              height={width}
              className="sticker-image"
              draggable={false}
              onContextMenu={e => e.preventDefault()}
            />
          </div>
        </div>

        <div className="flap">
          <div className="flap-lighting">
            <Image
              src={imageSrc}
              alt=""
              width={width}
              height={width}
              className="flap-image"
              draggable={false}
              onContextMenu={e => e.preventDefault()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickerPeel;
