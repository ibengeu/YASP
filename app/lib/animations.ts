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

