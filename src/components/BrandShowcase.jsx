import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { resolveImage } from "../utils/imageResolver";
import "./BrandShowcase.css";

gsap.registerPlugin(ScrollTrigger);

const showcaseBrands = [
  {
    name: "NIKE",
    tagline: "Just Do It",
    description: "From the Air Max to the Dunk, Nike continues to set the standard in sneaker culture worldwide.",
    stat: "760+ Products",
    color: "#111",
    heroImage: "shop/Sneakers/Nike/nike-shoes-dunk/dunk-low-retro-black-white-panda-056984/dunk-low-retro-black-white-panda-dd1391-100/KA3ZUQvZ7QESwsHdhkwWQpHR.png",
  },
  {
    name: "ADIDAS",
    tagline: "Impossible Is Nothing",
    description: "German engineering meets street style. Samba, Gazelle, Campus - icons that define generations.",
    stat: "800+ Products",
    color: "#1a1a1a",
    heroImage: "shop/Sneakers/Adidas/adidas-new-releases/samba-og-wmns-rhinestone-black-silver-187322/samba-og-wmns-rhinestone-black-silver-ih9052/cxnmb0a0dcw72j2flb7ip0yjjmbj.png",
  },
  {
    name: "NEW BALANCE",
    tagline: "Fearlessly Independent",
    description: "The 990 series, the 550, the 2002R - where heritage craftsmanship meets modern hype.",
    stat: "270+ Products",
    color: "#222",
    heroImage: "shop/Sneakers/New Balance/men/new-balance-mens/2002r-phantom-062430/2002r-phantom-m2002rdb/5i8shp4gwg0nn7xrgrfvht4jumwm.png",
  },
  {
    name: "ASICS",
    tagline: "Sound Mind, Sound Body",
    description: "GEL-KAYANO, GT-2160, GEL-1130 - Japanese performance running meets Berlin streets.",
    stat: "220+ Products",
    color: "#1a1a2e",
    heroImage: "shop/Sneakers/Asics/asics-best-sellers/gel-ds-trainer-14-hidden-ny-dawn-179815/gel-ds-trainer-14-hidden-ny-dawn-1203a974-100/257tzeu8zr81e88fn47m1b9on7m1_0ca826cb-1a4a-4492-a5a6-87fae928c0c3.png",
  },
  {
    name: "JORDAN",
    tagline: "Greatness Is Earned",
    description: "Travis Scott collabs, Off-White grails, and iconic Retros - the pinnacle of sneaker culture.",
    stat: "22 Products",
    color: "#2e1a1a",
    heroImage: "shop/jordan.png",
  },
  {
    name: "UGG",
    tagline: "Feel Good Comfort",
    description: "From the Tasman to the Tazz, UGG brings cozy warmth and bold style to every season.",
    stat: "190+ Products",
    color: "#2e2e1a",
    heroImage: "shop/Sneakers/UGG/men/ugg-mens/tasman-ii-chestnut-173179/tasman-ii-chestnut-1174671-che/2w76hi43y4h09ql6qba6n3wb2g1j.png",
  },
  {
    name: "PUMA",
    tagline: "Forever Faster",
    description: "Suede XL, Speedcat, and Pokémon collabs - PUMA blends sport heritage with bold culture.",
    stat: "17 Products",
    color: "#1a2e1a",
    heroImage: "shop/puma.png",
  },
];

export default function BrandShowcase() {
  const sectionRef = useRef(null);
  const pinnedRef = useRef(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const steps = sectionRef.current.querySelectorAll(".showcase-step");

    function updatePinned(index, { animate = true } = {}) {
      const brand = showcaseBrands[index];
      if (!pinnedRef.current || !brand) return;

      const nameEl = pinnedRef.current.querySelector(".showcase-pinned__name");
      const counterEl = pinnedRef.current.querySelector(".showcase-pinned__counter");

      if (nameEl) {
        if (!animate) {
          nameEl.textContent = brand.name;
        } else {
          gsap.to(nameEl, {
            opacity: 0,
            y: -20,
            duration: 0.2,
            onComplete: () => {
              nameEl.textContent = brand.name;
              gsap.to(nameEl, { opacity: 1, y: 0, duration: 0.3 });
            },
          });
        }
      }

      if (counterEl) {
        counterEl.textContent = `${String(index + 1).padStart(2, "0")} / ${String(showcaseBrands.length).padStart(2, "0")}`;
      }

      if (animate) {
        gsap.to(pinnedRef.current, {
          backgroundColor: brand.color,
          duration: 0.5,
        });
      } else {
        pinnedRef.current.style.backgroundColor = brand.color;
      }
    }

    const mm = gsap.matchMedia();

    mm.add("(min-width: 769px)", () => {
      const ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${steps.length * window.innerHeight}`,
          pin: pinnedRef.current,
          pinSpacing: false,
          pinType: "transform",
        });

        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${steps.length * window.innerHeight}`,
          snap: {
            snapTo: 1 / (steps.length - 1),
            duration: { min: 0.25, max: 0.7 },
            delay: 0.08,
            ease: "power3.inOut",
          },
        });

        steps.forEach((step, i) => {
          gsap.fromTo(
            step,
            { opacity: 0, y: 60 },
            {
              opacity: 1,
              y: 0,
              ease: "power2.out",
              duration: 0.5,
              scrollTrigger: {
                trigger: step,
                start: "top 70%",
                end: "top 30%",
                toggleActions: "play none none reverse",
              },
            }
          );

          ScrollTrigger.create({
            trigger: step,
            start: "top 50%",
            end: "bottom 50%",
            onEnter: () => updatePinned(i),
            onEnterBack: () => updatePinned(i),
          });
        });
      }, sectionRef);

      return () => ctx.revert();
    });

    mm.add("(max-width: 768px)", () => {
      const scroller = sectionRef.current?.querySelector(".showcase-scroll");
      const mobileSteps = Array.from(sectionRef.current?.querySelectorAll(".showcase-step") || []);
      if (!scroller || mobileSteps.length === 0) return undefined;

      let activeIndex = 0;

      const getMostVisibleIndex = () => {
        const scrollerRect = scroller.getBoundingClientRect();
        let mostVisibleIndex = 0;
        let mostVisibleRatio = -1;

        mobileSteps.forEach((step, index) => {
          const stepRect = step.getBoundingClientRect();
          const visibleWidth =
            Math.max(0, Math.min(stepRect.right, scrollerRect.right) - Math.max(stepRect.left, scrollerRect.left));
          const ratio = visibleWidth / Math.max(stepRect.width, 1);

          if (ratio > mostVisibleRatio) {
            mostVisibleRatio = ratio;
            mostVisibleIndex = index;
          }
        });

        return mostVisibleIndex;
      };

      const syncPinnedFromScroll = () => {
        const nextIndex = getMostVisibleIndex();
        if (nextIndex === activeIndex) return;
        activeIndex = nextIndex;
        updatePinned(activeIndex, { animate: false });
      };

      let rafId = null;
      const onScroll = () => {
        if (rafId !== null) return;
        rafId = window.requestAnimationFrame(() => {
          rafId = null;
          syncPinnedFromScroll();
        });
      };

      activeIndex = getMostVisibleIndex();
      updatePinned(activeIndex, { animate: false });

      scroller.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", syncPinnedFromScroll);

      return () => {
        scroller.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", syncPinnedFromScroll);
        if (rafId !== null) {
          window.cancelAnimationFrame(rafId);
        }
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section className="brand-showcase" ref={sectionRef}>
      {/* Pinned left panel */}
      <div className="showcase-pinned" ref={pinnedRef}>
        <div className="showcase-pinned__inner">
          <span className="showcase-pinned__label">FEATURED BRANDS</span>
          <h2 className="showcase-pinned__name">{showcaseBrands[0].name}</h2>
          <span className="showcase-pinned__counter">01 / {String(showcaseBrands.length).padStart(2, "0")}</span>
          <div className="showcase-pinned__line" />
        </div>
      </div>

      {/* Scrolling right panel */}
      <div className="showcase-scroll">
        {showcaseBrands.map((brand, i) => (
          <div key={brand.name} className="showcase-step">
            <div className="showcase-step__content">
              <span className="showcase-step__tagline">{brand.tagline}</span>
              <p className="showcase-step__desc">{brand.description}</p>
              <div className="showcase-step__stat">
                <span className="showcase-step__stat-num">{brand.stat}</span>
              </div>
              <Link
                to={`/collections/${brand.name.toLowerCase().replace(/ /g, "-")}`}
                className="showcase-step__cta"
              >
                SHOP {brand.name}
              </Link>
            </div>
            <div className="showcase-step__hero">
              <img
                src={resolveImage(brand.heroImage)}
                alt={brand.name}
                className="showcase-step__hero-img"
                loading="lazy"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
