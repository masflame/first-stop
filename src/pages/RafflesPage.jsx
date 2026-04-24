import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import Seo from "../components/Seo";
import { buildBreadcrumbSchema } from "../utils/seo";
import "./RafflesPage.css";

const TARGET_DATE = new Date("2026-05-05T00:00:00");

function getTimeLeft() {
  const now = new Date();
  const diff = TARGET_DATE - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function RafflesPage() {
  const [time, setTime] = useState(getTimeLeft);
  const pageRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".raff-hero__title span", {
        y: 120,
        opacity: 0,
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.08,
      });
      gsap.from(".raff-hero__rule", { scaleX: 0, duration: 0.8, delay: 0.5, ease: "power2.inOut" });
      gsap.from(".raff-hero__date", { opacity: 0, y: 20, duration: 0.6, delay: 0.7 });
      gsap.from(".raff-timer__digit", { opacity: 0, y: 40, duration: 0.5, stagger: 0.06, delay: 0.8, ease: "power3.out" });
      gsap.from(".raff-bottom", { opacity: 0, y: 30, duration: 0.7, delay: 1.1 });
      gsap.from(".raff-how__step", { opacity: 0, y: 40, duration: 0.6, stagger: 0.12, delay: 1.3, ease: "power3.out" });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <main className="raff-page" ref={pageRef}>
      <Seo
        title="Raffles"
        description="Enter SHOE DISTRICT raffles for exclusive sneaker launches and limited pairs online in South Africa."
        canonicalPath="/collections/raffle"
        jsonLd={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Raffles", path: "/collections/raffle" },
        ])}
      />
      <section className="raff-hero">
        {/* Large watermark */}
        <div className="raff-hero__watermark" aria-hidden="true">05.05</div>

        <div className="raff-hero__top">
          <span className="raff-hero__eyebrow">SHOE DISTRICT EXCLUSIVE</span>
        </div>

        <h1 className="raff-hero__title">
          <span>R</span><span>A</span><span>F</span><span>F</span><span>L</span><span>E</span><span>S</span>
        </h1>

        <div className="raff-hero__rule" />

        <p className="raff-hero__date">05 - MAY - 2026</p>

        {/* Countdown */}
        <div className="raff-timer">
          <div className="raff-timer__group">
            <div className="raff-timer__digit">{pad(time.days)}</div>
            <div className="raff-timer__label">D</div>
          </div>
          <div className="raff-timer__colon">:</div>
          <div className="raff-timer__group">
            <div className="raff-timer__digit">{pad(time.hours)}</div>
            <div className="raff-timer__label">H</div>
          </div>
          <div className="raff-timer__colon">:</div>
          <div className="raff-timer__group">
            <div className="raff-timer__digit">{pad(time.minutes)}</div>
            <div className="raff-timer__label">M</div>
          </div>
          <div className="raff-timer__colon">:</div>
          <div className="raff-timer__group">
            <div className="raff-timer__digit">{pad(time.seconds)}</div>
            <div className="raff-timer__label">S</div>
          </div>
        </div>

        {/* Bottom - brief tagline */}
        <div className="raff-bottom">
          <p className="raff-bottom__text">
            Token-based entries. No bots. No luck - just loyalty.
          </p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="raff-how">
        <div className="raff-how__header">
          <span className="raff-how__eyebrow">HOW IT WORKS</span>
          <div className="raff-how__rule" />
        </div>

        <div className="raff-how__steps">
          <div className="raff-how__step">
            <span className="raff-how__num">01</span>
            <h3 className="raff-how__title">EARN TOKENS</h3>
            <p className="raff-how__desc">
              Every R8 you spend at Shoe District earns you 1 raffle token. Tokens accumulate automatically in your account.
            </p>
          </div>

          <div className="raff-how__step">
            <span className="raff-how__num">02</span>
            <h3 className="raff-how__title">ENTER RAFFLES</h3>
            <p className="raff-how__desc">
              When a raffle goes live, spend your tokens to enter. More tokens, more entries - but each raffle has a cap to keep it fair.
            </p>
          </div>

          <div className="raff-how__step">
            <span className="raff-how__num">03</span>
            <h3 className="raff-how__title">GET SELECTED</h3>
            <p className="raff-how__desc">
              Winners are drawn at random from the entry pool. If you're selected, you get exclusive access to purchase the drop at retail.
            </p>
          </div>
        </div>

        <div className="raff-how__note">
          <p>Tokens never expire. Unused entries on closed raffles are refunded back to your balance.</p>
        </div>
      </section>
    </main>
  );
}
