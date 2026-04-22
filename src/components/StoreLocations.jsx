import { Link } from "react-router-dom";
import stores from "../data/stores";
import { useScrollReveal } from "../hooks/useScrollEffects";
import "./StoreLocations.css";

export default function StoreLocations() {
  const titleRef = useScrollReveal(".reveal-item", { y: 30, duration: 0.7 });
  const cardsRef = useScrollReveal(".store-card", { stagger: 0.15, y: 60 });

  return (
    <div className="stores-section-wrapper">
    <section className="stores-section">
      <div ref={titleRef}>
        <h2 className="stores-title reveal-item">STORES</h2>
      </div>
      <div className="stores-grid" ref={cardsRef}>
        {stores.map((store) => (
          <Link
            key={store.id}
            to={`/stores/${store.slug}`}
            className="store-card"
          >
            <div className="store-card__image">
              <span className="store-card__placeholder">{store.name.charAt(0)}</span>
            </div>
            <div className="store-card__info">
              <h3 className="store-card__name">{store.name}</h3>
              {store.description ? (
                <p className="store-card__desc">{store.description}</p>
              ) : (
                <>
                  {store.address && (
                    <p className="store-card__address">
                      {store.address}
                      <br />
                      {store.city}
                    </p>
                  )}
                  {store.phone && (
                    <p className="store-card__phone">{store.phone}</p>
                  )}
                </>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
    </div>
  );
}
