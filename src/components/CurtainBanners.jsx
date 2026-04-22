import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { resolveImage } from "../utils/imageResolver";
import "./CurtainBanners.css";

gsap.registerPlugin(ScrollTrigger);

export default function CurtainBanners() {
  const sectionRef = useRef(null);
  const leftDoorRef = useRef(null);
  const rightDoorRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          end: "top 15%",
          scrub: 0.8,
        },
      });

      // Doors open
      tl.fromTo(
        leftDoorRef.current,
        { xPercent: 0 },
        { xPercent: -101, ease: "power3.inOut" },
        0
      );
      tl.fromTo(
        rightDoorRef.current,
        { xPercent: 0 },
        { xPercent: 101, ease: "power3.inOut" },
        0
      );

      // Content zooms in slightly as doors open
      tl.fromTo(
        contentRef.current,
        { scale: 0.92, opacity: 0.5 },
        { scale: 1, opacity: 1, ease: "power2.out" },
        0
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="curtain-section" ref={sectionRef}>
      {/* The doors/curtains */}
      <div className="curtain-door curtain-door--left" ref={leftDoorRef}>
        <span className="curtain-door__text">DISCOVER</span>
      </div>
      <div className="curtain-door curtain-door--right" ref={rightDoorRef}>
        <span className="curtain-door__text">MORE</span>
      </div>

      {/* The revealed content */}
      <div className="curtain-content" ref={contentRef}>
        <a
          href="/collections/men"
          className="curtain-banner curtain-banner--men"
          style={{ backgroundImage: `url(${resolveImage("shop/men.png")})` }}
        >
          <div className="curtain-banner__inner">
            <span className="curtain-banner__label">COLLECTION</span>
            <h2 className="curtain-banner__title">MEN</h2>
            <span className="curtain-banner__cta">SHOP NOW</span>
          </div>
        </a>
        <a
          href="/collections/women"
          className="curtain-banner curtain-banner--women"
          style={{ backgroundImage: `url(${resolveImage("shop/women.png")})` }}
        >
          <div className="curtain-banner__inner">
            <span className="curtain-banner__label">COLLECTION</span>
            <h2 className="curtain-banner__title">WOMEN</h2>
            <span className="curtain-banner__cta">SHOP NOW</span>
          </div>
        </a>
      </div>
    </section>
  );
}
