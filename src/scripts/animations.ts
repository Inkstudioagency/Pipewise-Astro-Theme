/**
 * Animation runtime.
 *
 * Webflow Interactions (IX3, inside public/js/webflow.js) drive the page animations
 * with GSAP, which they read from `window.gsap` once the DOM is ready. This module
 * runs before DOMContentLoaded, so exposing GSAP here keeps the template's original
 * load order (jQuery -> webflow.js -> GSAP -> plugins) intact.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);
Object.assign(window, { gsap, ScrollTrigger, SplitText });

// Smooth scrolling (same settings as the template)
const lenis = new Lenis({
  smoothWheel: true,
  lerp: 0.1,
  wheelMultiplier: 1,
  infinite: false,
});
function raf(time: number) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Count-up numbers: any element with [data-counter] animates from 0 when scrolled into view.
// Values without a number (e.g. "Care") are left as they are.
window.Webflow ||= [];
window.Webflow.push(() => {
  document.querySelectorAll<HTMLElement>('[data-counter]').forEach((counter) => {
    // Animate the first text node (the number), so a trailing <span>+</span> is left alone
    const textNode = [...counter.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
    const textEl = (textNode as Text | undefined) ?? counter.firstElementChild ?? counter;
    const original = (textEl.textContent ?? '').trim();
    const match = original.match(/^([^0-9.-]*)([0-9.,-]+)(.*)$/);
    if (!match) return;
    const prefix = match[1];
    const number = match[2].replace(/,/g, '');
    const suffix = match[3];
    const target = parseFloat(number);
    if (Number.isNaN(target)) return;
    const hasDecimal = number.includes('.');
    const hasComma = original.includes(',');
    const value = { current: 0 };
    gsap.fromTo(
      value,
      { current: 0 },
      {
        current: target,
        duration: 1.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: counter,
          start: 'top 88%',
          once: true,
        },
        onUpdate: () => {
          let formattedValue: string | number = hasDecimal ? value.current.toFixed(1) : Math.floor(value.current);
          if (hasComma && !hasDecimal) {
            formattedValue = Number(formattedValue).toLocaleString();
          }
          textEl.textContent = prefix + formattedValue + suffix;
        },
      },
    );
  });
});
