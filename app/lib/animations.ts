/**
 * Animation utilities using anime.js v4
 * Following official React integration patterns
 * https://animejs.com/documentation/getting-started/using-with-react
 */

import { animate } from 'animejs';

// Material Design Motion - Standard Easing Curves
export const EASING = {
  standard: 'cubicBezier(0.4, 0.0, 0.2, 1)',
  decelerate: 'cubicBezier(0.0, 0.0, 0.2, 1)',
  accelerate: 'cubicBezier(0.4, 0.0, 1, 1)',
  sharp: 'cubicBezier(0.4, 0.0, 0.6, 1)',
};

// Material Design Standard Durations
export const DURATION = {
  shortest: 150,
  shorter: 200,
  short: 250,
  standard: 300,
  complex: 375,
  entering: 225,
  leaving: 195,
};

/**
 * Staggered fade-in animation for list items
 * Use with useRef array in React components
 */
export function staggerFadeIn(targets: HTMLElement[], delayMs = 50) {
  return animate(targets, {
    opacity: [0, 1],
    translateY: [20, 0],
    duration: DURATION.standard,
    delay: (_, index) => index * delayMs,
    easing: EASING.standard,
  });
}

/**
 * Page transition fade-in
 */
export function pageTransition(target: HTMLElement) {
  return animate(target, {
    opacity: [0, 1],
    translateY: [10, 0],
    duration: DURATION.complex,
    easing: EASING.decelerate,
  });
}

/**
 * Pulse animation for a running workflow step (scale 1 → 1.02 → 1)
 */
export function pulseElement(target: HTMLElement) {
  return animate(target, {
    scale: [1, 1.02, 1],
    duration: DURATION.complex * 2,
    easing: EASING.standard,
    loop: true,
  });
}

/**
 * Brief green border flash for a successful workflow step
 */
export function successFlash(target: HTMLElement) {
  return animate(target, {
    borderColor: ['oklch(0.72 0.19 142)', 'oklch(0.72 0.19 142)', ''],
    duration: DURATION.complex * 2,
    easing: EASING.decelerate,
  });
}

/**
 * Horizontal shake for a failed workflow step
 */
export function failureShake(target: HTMLElement) {
  return animate(target, {
    translateX: [0, -6, 6, -4, 4, 0],
    duration: DURATION.standard,
    easing: EASING.sharp,
  });
}

