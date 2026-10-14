'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef, type ReactNode } from 'react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function LandingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.from('.hero-copy > *', {
        y: 32,
        duration: 0.8,
        stagger: 0.08,
        ease: 'power3.out',
      });
      gsap.from('.stream-demo', {
        y: 48,
        scale: 0.96,
        duration: 1,
        delay: 0.18,
        ease: 'power3.out',
      });
      gsap.utils
        .toArray<HTMLElement>('.mechanism-grid > article')
        .forEach((card, index) => {
          gsap.from(card, {
            y: 64 + index * 6,
            scale: 0.97,
            scrollTrigger: {
              trigger: card,
              start: 'top 88%',
              end: 'top 58%',
              scrub: 0.7,
            },
          });
        });
      gsap.from('.trust-list article', {
        y: 54,
        stagger: 0.12,
        scrollTrigger: { trigger: '.trust-section', start: 'top 72%' },
      });
    },
    { scope: root },
  );
  return <div ref={root}>{children}</div>;
}
