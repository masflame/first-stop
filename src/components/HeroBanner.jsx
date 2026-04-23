import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./HeroBanner.css";

import springSaleLeft from "../assets/Carousel/spring-sale-left.jpg";
import springSaleRight from "../assets/Carousel/spring-sale-right.jpg";
import newArrival from "../assets/Carousel/new-arrival.jpg";
import sneakerCultureLeft from "../assets/Carousel/sneaker-culture-left.jpg";
import sneakerCultureRight from "../assets/Carousel/sneaker-culture-right.jpg";
import caps from "../assets/Carousel/caps.jpg";

gsap.registerPlugin(ScrollTrigger);

const slides = [
  {
    id: 1,
    title: "GRAND OPENING SALE",
    subtitle: "MASSIVE MARKDOWNS ACROSS ALL CATEGORIES",
    cta: "SHOP SALE",
    link: "/collections/sale",
    bgColor: "#1a3a1a",
    layout: "split",
    imageLeft: springSaleLeft,
    imageRight: springSaleRight,
  },
  {
    id: 2,
    title: "NEW ARRIVALS",
    subtitle: "LATEST DROPS FROM TOP BRANDS",
    cta: "EXPLORE",
    link: "/collections/new",
    bgColor: "#1a1a2e",
    layout: "single",
    image: newArrival,
  },
  {
    id: 3,
    title: "SNEAKER CULTURE",
    subtitle: "SINCE 2007 / BERLIN",
    cta: "DISCOVER",
    link: "/collections/men",
    bgColor: "#2e1a1a",
    layout: "split",
    imageLeft: sneakerCultureLeft,
    imageRight: sneakerCultureRight,
  },
  {
    id: 4,
    title: "CAPS COLLECTION",
    subtitle: "TOP OFF YOUR FIT",
    cta: "SHOP CAPS",
    link: "/collections/caps",
    bgColor: "#2e2e1a",
    layout: "single",
    image: caps,
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const heroRef = useRef(null);
  const slidesRef = useRef([]);
  const animating = useRef(false);
  const timerRef = useRef(null);

  // Assign ref per slide
  const setSlideRef = useCallback((el, i) => {
    slidesRef.current[i] = el;
  }, []);

  // Animate transition between slides
  const goTo = useCallback(
    (next) => {
      if (animating.current || next === current) return;
      animating.current = true;

      const from = slidesRef.current[current];
      const to = slidesRef.current[next];
      if (!from || !to) { animating.current = false; return; }

      const tl = gsap.timeline({
        onComplete: () => {
          animating.current = false;
        },
      });

      // Prep incoming slide
      gsap.set(to, { zIndex: 2, visibility: "visible" });
      gsap.set(from, { zIndex: 1 });

      const toImg = to.querySelector(".hero-images");
      const toTitle = to.querySelector(".hero-title");
      const toSub = to.querySelector(".hero-subtitle");
      const toCta = to.querySelector(".hero-cta");

      const fromImg = from.querySelector(".hero-images");
      const fromTitle = from.querySelector(".hero-title");
      const fromSub = from.querySelector(".hero-subtitle");
      const fromCta = from.querySelector(".hero-cta");
      const isMobileViewport = window.matchMedia("(max-width: 768px)").matches;
      const revealClipPath = isMobileViewport
        ? "inset(0 50% 0 50%)"
        : "inset(0 0 100% 0)";

      // Incoming image: start clipped & scaled, reveal with clip-path
      gsap.set(toImg, {
        clipPath: revealClipPath,
        scale: 1.12,
        opacity: 1,
      });
      gsap.set([toTitle, toSub, toCta], { y: 60, opacity: 0 });

      // ── Timeline ──

      // Outgoing: text fades up & out quickly
      tl.to(
        [fromTitle, fromSub, fromCta],
        { y: -30, opacity: 0, duration: 0.4, stagger: 0.05, ease: "power3.in" },
        0
      );

      // Incoming image: clip-path reveal immediately - covers outgoing, no gap
      tl.to(
        toImg,
        { clipPath: "inset(0 0 0% 0)", scale: 1, duration: 1.1, ease: "power4.inOut" },
        0
      );

      // Incoming text: staggered rise after image is mostly revealed
      tl.to(toTitle, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, 0.55);
      tl.to(toSub, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, 0.65);
      tl.to(toCta, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, 0.75);

      // After done, hide old slide & reset its properties
      tl.set(from, { visibility: "hidden", zIndex: 0 });
      tl.set(fromImg, { scale: 1 });
      tl.set([fromTitle, fromSub, fromCta], { y: 0, opacity: 1 });

      setCurrent(next);
    },
    [current]
  );

  const prev = useCallback(
    () => goTo((current - 1 + slides.length) % slides.length),
    [current, goTo]
  );
  const next = useCallback(
    () => goTo((current + 1) % slides.length),
    [current, goTo]
  );

  // Auto-advance
  useEffect(() => {
    timerRef.current = setInterval(() => {
      // read current from ref-safe closure
      setCurrent((c) => {
        const n = (c + 1) % slides.length;
        // schedule goTo outside setState
        requestAnimationFrame(() => goTo(n));
        return c; // don't change here, goTo sets it
      });
    }, 6000);
    return () => clearInterval(timerRef.current);
  }, [goTo]);

  // Ken Burns: slow zoom on active slide image
  useEffect(() => {
    const active = slidesRef.current[current];
    if (!active) return;
    const img = active.querySelector(".hero-images");
    if (!img) return;

    const kb = gsap.to(img, {
      scale: 1.06,
      duration: 6,
      ease: "none",
    });
    return () => kb.kill();
  }, [current]);

  // Scroll parallax
  useEffect(() => {
    if (!heroRef.current) return;
    if (window.matchMedia("(max-width: 768px)").matches) return;
    const ctx = gsap.context(() => {
      gsap.to(heroRef.current, {
        scale: 1.08,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="hero-wrapper">
      <section className="hero" ref={heroRef}>
        {/* All slides stacked */}
        {slides.map((s, i) => (
          <div
            key={s.id}
            className="hero-slide"
            ref={(el) => setSlideRef(el, i)}
            style={{
              backgroundColor: s.bgColor,
              visibility: i === 0 ? "visible" : "hidden",
              zIndex: i === 0 ? 2 : 0,
            }}
          >
            {s.layout === "split" ? (
              <div className="hero-images hero-images--split">
                <div className="hero-img-half hero-img-half--left">
                  <img src={s.imageLeft} alt={s.title} />
                </div>
                <div className="hero-img-half hero-img-half--right">
                  <img src={s.imageRight} alt={s.title} />
                </div>
              </div>
            ) : (
              <div className="hero-images hero-images--single">
                <img src={s.image} alt={s.title} />
              </div>
            )}

            <div className="hero-content">
              <h1 className="hero-title">{s.title}</h1>
              <p className="hero-subtitle">{s.subtitle}</p>
              <Link to={s.link} className="hero-cta">
                {s.cta}
              </Link>
            </div>
          </div>
        ))}

        <button className="hero-arrow hero-arrow--left" onClick={prev} aria-label="Previous">
          <ChevronLeft size={32} />
        </button>
        <button className="hero-arrow hero-arrow--right" onClick={next} aria-label="Next">
          <ChevronRight size={32} />
        </button>

        <div className="hero-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`hero-dot ${i === current ? "hero-dot--active" : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>
    </section>
  );
}
