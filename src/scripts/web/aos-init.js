import AOS from "aos";
import "aos/dist/aos.css";

document.addEventListener("DOMContentLoaded", () => {
  const isReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  
  // Detect mobile via viewport width
  const isMobile = window.innerWidth < 768;

  if (!isReducedMotion && !isMobile) {
    // Full animations on desktop with no motion preference
    AOS.init({
      duration: 800,
      easing: "ease-out-cubic",
      once: true,
      offset: 50,
      delay: 100,
    });
  } else if (!isReducedMotion && isMobile) {
    // Reduced animations on mobile for better INP/performance
    AOS.init({
      duration: 400,
      easing: "ease-out-cubic",
      once: true,
      offset: 30,
      delay: 0, // No delay on mobile
      disable: 'phone', // Disable on small screens if needed
    });
  }
  // If prefers-reduced-motion, don't initialize AOS at all
});

// Re-initialize AOS on View Transitions swap (Astro specific)
document.addEventListener("astro:after-swap", () => {
  const isReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  
  const isMobile = window.innerWidth < 768;

  if (!isReducedMotion && !isMobile) {
    AOS.init();
  } else if (!isReducedMotion && isMobile) {
    AOS.init({ disable: 'phone' });
  }
});

