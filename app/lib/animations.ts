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
 * Scale pulse animation for interactive elements
 */
export function scalePulse(target: HTMLElement, scale = 1.05) {
  return animate(target, {
    scale: [1, scale, 1],
    duration: DURATION.shorter,
    easing: EASING.sharp,
  });
}

/**
 * Drawer slide-in from bottom
 */
export function drawerSlideIn(target: HTMLElement) {
  return animate(target, {
    translateY: ['100%', '0%'],
    duration: DURATION.complex,
    easing: EASING.decelerate,
  });
}

/**
 * Drawer slide-out to bottom
 */
export function drawerSlideOut(target: HTMLElement) {
  return animate(target, {
    translateY: ['0%', '100%'],
    duration: DURATION.complex,
    easing: EASING.accelerate,
  });
}

/**
 * Ripple effect animation
 */
export function rippleEffect(container: HTMLElement, x: number, y: number) {
  const ripple = document.createElement('span');
  ripple.style.position = 'absolute';
  ripple.style.borderRadius = '50%';
  ripple.style.backgroundColor = 'currentColor';
  ripple.style.opacity = '0.3';
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.width = '0';
  ripple.style.height = '0';
  ripple.style.transform = 'translate(-50%, -50%)';
  ripple.style.pointerEvents = 'none';

  container.appendChild(ripple);

  animate(ripple, {
    width: '200px',
    height: '200px',
    opacity: [0.3, 0],
    duration: DURATION.complex,
    easing: EASING.standard,
    onComplete: () => ripple.remove(),
  });
}

/**
 * Slide in from right (for sidebars/drawers)
 */
export function slideInRight(target: HTMLElement) {
  return animate(target, {
    translateX: ['100%', '0%'],
    duration: DURATION.complex,
    easing: EASING.decelerate,
  });
}

/**
 * Slide out to right
 */
export function slideOutRight(target: HTMLElement) {
  return animate(target, {
    translateX: ['0%', '100%'],
    duration: DURATION.complex,
    easing: EASING.accelerate,
  });
}

/**
 * Bounce attention animation
 */
export function bounceAttention(target: HTMLElement) {
  return animate(target, {
    translateY: [-10, 0, -5, 0],
    duration: 700,
    easing: EASING.decelerate,
  });
}
