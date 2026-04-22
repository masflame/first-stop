import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * useScrollReveal - Animate children into view with stagger.
 * Returns a ref to attach to the parent container.
 * @param {string} childSelector - CSS selector for children to animate
 * @param {object} options - { stagger, y, duration, start }
 */
export function useScrollReveal(childSelector = ".reveal-item", options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const items = ref.current.querySelectorAll(childSelector);
    if (items.length === 0) return;

    gsap.set(items, {
      y: options.y ?? 60,
      opacity: 0,
    });

    const ctx = gsap.context(() => {
      gsap.to(items, {
        y: 0,
        opacity: 1,
        duration: options.duration ?? 0.8,
        stagger: options.stagger ?? 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: options.start ?? "top 85%",
          toggleActions: "play none none none",
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [childSelector, options.y, options.duration, options.stagger, options.start]);

  return ref;
}

/**
 * useParallax - Move an element at a different speed while scrolling.
 * Returns a ref to attach to the element.
 * @param {number} speed - Parallax intensity (-1 to 1, negative = slower)
 */
export function useParallax(speed = -0.3) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      gsap.to(ref.current, {
        yPercent: speed * 100,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });

    return () => ctx.revert();
  }, [speed]);

  return ref;
}

/**
 * useCurtainReveal - Split-panel reveal that opens like doors.
 * Returns refs for the container, left panel, and right panel.
 */
export function useCurtainReveal() {
  const containerRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !leftRef.current || !rightRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          end: "top 20%",
          scrub: 0.6,
        },
      });

      tl.fromTo(
        leftRef.current,
        { xPercent: 0 },
        { xPercent: -100, ease: "power2.inOut" },
        0
      );
      tl.fromTo(
        rightRef.current,
        { xPercent: 0 },
        { xPercent: 100, ease: "power2.inOut" },
        0
      );
    });

    return () => ctx.revert();
  }, []);

  return { containerRef, leftRef, rightRef };
}

/**
 * usePinnedSection - Pin an element while scrolling through content.
 * Returns a ref for the pinned wrapper.
 * @param {string} endTrigger - Selector or element to end pinning
 */
export function usePinnedSection(contentSelector = ".pinned-content") {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const content = ref.current.querySelector(contentSelector);
    if (!content) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: ref.current,
        start: "top top",
        end: () => `+=${content.scrollHeight - window.innerHeight}`,
        pin: ref.current.querySelector(".pinned-left"),
        pinSpacing: false,
      });

      // Animate content items as they scroll into view
      const items = content.querySelectorAll(".pinned-step");
      items.forEach((item, i) => {
        gsap.fromTo(
          item,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: item,
              start: "top 75%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    }, ref);

    return () => ctx.revert();
  }, [contentSelector]);

  return ref;
}
