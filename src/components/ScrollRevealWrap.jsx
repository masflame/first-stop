import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollRevealWrap({ children, className = "", direction = "up", delay = 0 }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const fromVars = { opacity: 0 };
    const toVars = { opacity: 1, duration: 0.8, ease: "power3.out" };

    switch (direction) {
      case "up":
        fromVars.y = 50;
        toVars.y = 0;
        break;
      case "down":
        fromVars.y = -50;
        toVars.y = 0;
        break;
      case "left":
        fromVars.x = 80;
        toVars.x = 0;
        break;
      case "right":
        fromVars.x = -80;
        toVars.x = 0;
        break;
      case "scale":
        fromVars.scale = 0.85;
        toVars.scale = 1;
        break;
    }

    if (delay > 0) toVars.delay = delay;

    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current, fromVars, {
        ...toVars,
        scrollTrigger: {
          trigger: ref.current,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      });
    });

    return () => ctx.revert();
  }, [direction, delay]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform, opacity" }}>
      {children}
    </div>
  );
}
