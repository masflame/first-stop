import { useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import products from "../data/products";
import { resolveImage } from "../utils/imageResolver";
import Seo from "../components/Seo";
import "./ComingSoonPage.css";

gsap.registerPlugin(ScrollTrigger);

export default function ComingSoonPage() {
  const heroRef = useRef(null);

  const drops = useMemo(() => {
    const isSneaker = (p) =>
      p.image &&
      (p.image.startsWith("shop/Sneakers/") || p.image.startsWith("shop/Running/"));

    const isAdult = (name) =>
      !/ TD[ "]/i.test(name) && !/ PS[ "]/i.test(name) && !/ GS[ "]/i.test(name) &&
      !name.endsWith(" TD") && !name.endsWith(" PS") && !name.endsWith(" GS");

    const isFootwear = (name) =>
      !/\b(hat|cap|headwear|bag|sock|shirt|jacket|puffer|hoodie|pants|shorts|fleece|sweatshirt)\b/i.test(name);

    const brands = ["NIKE", "JORDAN", "ADIDAS", "NEW BALANCE", "ASICS", "PUMA", "UGG"];
    const picked = [];

    // Pick isNew adult sneakers in realistic retail price range per brand
    for (const brand of brands) {
      const pool = products
        .filter((p) => p.brand === brand && isSneaker(p) && isAdult(p.name) && isFootwear(p.name) && p.isNew && p.price >= 2000 && p.price <= 8000)
        .sort((a, b) => b.price - a.price);
      if (pool.length > 0) picked.push(pool[0]);
      if (pool.length > 1 && picked.length < 9) picked.push(pool[1]);
    }

    // Fill remaining slots from any brand
    if (picked.length < 9) {
      const pickedIds = new Set(picked.map((p) => p.id));
      const extras = products
        .filter((p) => isSneaker(p) && isAdult(p.name) && isFootwear(p.name) && p.isNew && p.price >= 2000 && p.price <= 8000 && !pickedIds.has(p.id))
        .sort((a, b) => b.price - a.price);
      for (const e of extras) {
        if (picked.length >= 9) break;
        picked.push(e);
      }
    }

    return picked.sort((a, b) => b.price - a.price).slice(0, 9);
  }, []);

  // Split into hero (first 3) and grid (rest)
  const heroDrops = drops.slice(0, 3);
  const gridDrops = drops.slice(3);

  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".soon-hero__title", {
        y: 80,
        opacity: 0,
        duration: 0.9,
        ease: "power4.out",
      });
      gsap.from(".soon-hero__rule", { scaleX: 0, duration: 0.7, delay: 0.4, ease: "power2.inOut" });
      gsap.from(".soon-hero__sub", { opacity: 0, y: 20, duration: 0.6, delay: 0.6 });
      gsap.from(".soon-highlight", {
        opacity: 0,
        y: 60,
        duration: 0.7,
        stagger: 0.12,
        delay: 0.7,
        ease: "power3.out",
      });

      // Grid cards scroll reveal
      gsap.utils.toArray(".soon-card").forEach((card) => {
        gsap.from(card, {
          opacity: 0,
          y: 50,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <main className="soon-page" ref={heroRef}>
      <Seo
        title="Coming Soon"
        description="Preview upcoming sneaker and streetwear drops at FIRST STOP."
        canonicalPath="/collections/soon"
      />
      {/* ── Hero ── */}
      <section className="soon-hero">
        <span className="soon-hero__eyebrow">UPCOMING RELEASES</span>
        <h1 className="soon-hero__title">DROPPING SOON</h1>
        <div className="soon-hero__rule" />
        <p className="soon-hero__sub">The next wave of heat. Don't sleep.</p>
      </section>

      {/* ── 3 Highlighted drops ── */}
      <section className="soon-highlights">
        {heroDrops.map((p, i) => (
          <Link key={p.id} to={`/product/${p.id}`} className="soon-highlight">
            <div className="soon-highlight__img-wrap">
              <img
                src={resolveImage(p.image)}
                alt={p.name}
                className="soon-highlight__img"
                loading="lazy"
              />
            </div>
            <div className="soon-highlight__info">
              <span className="soon-highlight__idx">{String(i + 1).padStart(2, "0")}</span>
              <div className="soon-highlight__text">
                <span className="soon-highlight__brand">{p.brand}</span>
                <span className="soon-highlight__name">{p.name}</span>
                <span className="soon-highlight__price">{`R ${p.price.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
              </div>
            </div>
          </Link>
        ))}
      </section>

      {/* ── Grid of remaining drops ── */}
      <section className="soon-grid-section">
        <div className="soon-grid-section__header">
          <span className="soon-grid-section__label">MORE DROPS</span>
          <div className="soon-grid-section__rule" />
        </div>
        <div className="soon-grid">
          {gridDrops.map((p) => (
            <Link key={p.id} to={`/product/${p.id}`} className="soon-card">
              <div className="soon-card__img-wrap">
                <img
                  src={resolveImage(p.image)}
                  alt={p.name}
                  className="soon-card__img"
                  loading="lazy"
                />
              </div>
              <div className="soon-card__info">
                <span className="soon-card__brand">{p.brand}</span>
                <span className="soon-card__name">{p.name}</span>
                <span className="soon-card__price">{`R ${p.price.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
