"use client";

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface GridMotionProps {
  items?: ReactNode[];
  gradientColor?: string;
}

export default function GridMotion({ items = [], gradientColor = 'black' }: GridMotionProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mouseXRef = useRef<number>(
    typeof window !== 'undefined' ? window.innerWidth / 2 : 0
  );

  const totalItems = 28;
  const defaultItems = Array.from({ length: totalItems }, (_, index) => `Item ${index + 1}`);
  const combinedItems = items.length > 0 ? items.slice(0, totalItems) : defaultItems;

  useEffect(() => {
    let cancelled = false;
    const cleanup: Array<() => void> = [];

    (async () => {
      const { gsap } = await import('gsap');
      if (cancelled) return;

      gsap.ticker.lagSmoothing(0);

      const handleMouseMove = (e: MouseEvent) => {
        mouseXRef.current = e.clientX;
      };

      const updateMotion = () => {
        const maxMoveAmount = 300;
        const baseDuration = 0.8;
        const inertiaFactors = [0.6, 0.4, 0.3, 0.2];

        rowRefs.current.forEach((row, index) => {
          if (row) {
            const direction = index % 2 === 0 ? 1 : -1;
            const moveAmount =
              ((mouseXRef.current / window.innerWidth) * maxMoveAmount - maxMoveAmount / 2) * direction;

            gsap.to(row, {
              x: moveAmount,
              duration: baseDuration + inertiaFactors[index % inertiaFactors.length],
              ease: 'power3.out',
              overwrite: 'auto'
            });
          }
        });
      };

      const removeAnimationLoop = gsap.ticker.add(updateMotion);
      window.addEventListener('mousemove', handleMouseMove);

      cleanup.push(
        () => window.removeEventListener('mousemove', handleMouseMove),
        () => removeAnimationLoop()
      );
    })();

    return () => {
      cancelled = true;
      cleanup.forEach(fn => fn());
    };
  }, []);

  return (
    <div
      ref={gridRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}
    >
      <section
        style={{
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle, ${gradientColor} 0%, transparent 100%)`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            padding: '1rem',
            width: '100%',
            height: '100%',
            justifyContent: 'center'
          }}
        >
          {[...Array(4)].map((_, rowIndex) => (
            <div
              key={rowIndex}
              ref={el => {
                rowRefs.current[rowIndex] = el;
              }}
              style={{
                display: 'flex',
                gap: '1rem',
                flex: 1,
                willChange: 'transform'
              }}
            >
              {[...Array(7)].map((_, itemIndex) => {
                const content = combinedItems[rowIndex * 7 + itemIndex];
                return (
                  <div
                    key={itemIndex}
                    style={{
                      flex: '0 0 auto',
                      width: '12rem',
                      height: '100%',
                      borderRadius: '0.5rem',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#111',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {typeof content === 'string' && content.startsWith('http') ? (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            backgroundImage: `url(${content})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            color: '#888',
                            fontSize: '0.875rem',
                            textAlign: 'center',
                            padding: '0.5rem'
                          }}
                        >
                          {content}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
