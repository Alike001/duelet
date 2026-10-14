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
      gsap.from('.home-hero-copy > *', {
        y: 32,
        opacity: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: 'power3.out',
      });
      gsap.from('.stream-instrument', {
        y: 48,
        scale: 0.96,
        opacity: 0,
        duration: 1,
        delay: 0.18,
        ease: 'power3.out',
      });
      gsap.utils.toArray<HTMLElement>('.home-section').forEach((section) => {
        gsap.from(section, {
          y: 36,
          opacity: 0,
          duration: 0.7,
          scrollTrigger: { trigger: section, start: 'top 88%' },
        });
      });
    },
    { scope: root },
  );
  return <div ref={root}>{children}</div>;
}
