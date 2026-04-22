import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { gsap } from "gsap";

export default function PageTransition({ children }) {
  const location = useLocation();
  const contentRef = useRef(null);
  const overlayRef = useRef(null);
  const isFirst = useRef(true);

  useLayoutEffect(() => {
    // First render: gentle fade in, no overlay
    if (isFirst.current) {
      isFirst.current = false;
      gsap.fromTo(
        contentRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.7, ease: "power2.out", delay: 0.1 }
      );
      return;
    }

    // Before browser paints: hide new content, show overlay
    gsap.set(contentRef.current, { opacity: 0, y: 30 });
    gsap.set(overlayRef.current, {
      scaleY: 1,
      transformOrigin: "center bottom",
    });

    // Animate overlay away then reveal content
    const tl = gsap.timeline();

    tl.to(overlayRef.current, {
      scaleY: 0,
      duration: 0.55,
      ease: "power4.inOut",
      transformOrigin: "center top",
      delay: 0.05,
    }).to(
      contentRef.current,
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
      },
      "-=0.35"
    );

    return () => tl.kill();
  }, [location.pathname]);

  return (
    <>
      <div ref={contentRef} style={{ willChange: "opacity, transform" }}>
        {children}
      </div>
      <div
        ref={overlayRef}
        style={{
          position: "fixed",
          inset: 0,
          background: "#000",
          zIndex: 9998,
          transform: "scaleY(0)",
          transformOrigin: "center bottom",
          pointerEvents: "none",
          willChange: "transform",
        }}
      />
    </>
  );
}
