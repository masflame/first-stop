import ProductCard from "./ProductCard";
import { useScrollReveal } from "../hooks/useScrollEffects";
import "./ProductGrid.css";

export default function ProductGrid({ products, title, viewAllLink, mobileLayout = "grid" }) {
  const gridRef = useScrollReveal(".product-card", { stagger: 0.08, y: 50 });
  const headerRef = useScrollReveal(".reveal-item", { y: 30, duration: 0.6 });

  return (
    <section className="product-grid-section">
      {title && (
        <div className="product-grid-header" ref={headerRef}>
          <h2 className="product-grid-title reveal-item">{title}</h2>
          {viewAllLink && (
            <a href={viewAllLink} className="product-grid-viewall reveal-item">
              VIEW ALL
            </a>
          )}
        </div>
      )}
      <div
        className={`product-grid${mobileLayout === "row" ? " product-grid--mobile-row" : ""}`}
        ref={gridRef}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
