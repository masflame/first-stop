import { useParams } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import ProductGrid from "../components/ProductGrid";
import CollectionFilters from "../components/CollectionFilters";
import products from "../data/products";
import "./CollectionPage.css";

const PAGE_SIZE = 48;

const collectionMeta = {
  new: {
    title: "NEW",
    description: "Fresh drops, just landed.",
  },
  kids: {
    title: "KIDS",
    description: "Everyday rotation for the next generation.",
  },
  sale: {
    title: "SALE",
    description: "Selected pieces from our current drop. Now accessible.",
  },
  "spring-sale": {
    title: "SPRING SALE",
    description: "Seasonal favourites, now at better prices.",
  },
  soon: {
    title: "COMING SOON",
    description: "Upcoming releases and key restocks.",
  },
  raffle: {
    title: "RAFFLES",
    description: "Enter for exclusive launches and limited pairs.",
  },

  // Gender + subcategory combos
  "men-sneakers": {
    title: "MEN / SNEAKERS",
    description: "Daily rotation, from classics to new heat.",
  },
  "men-clothing": {
    title: "MEN / CLOTHING",
    description: "Layer-ready essentials for everyday wear.",
  },
  "men-accessories": {
    title: "MEN / ACCESSORIES",
    description: "Finishing pieces that complete the fit.",
  },
  "women-sneakers": {
    title: "WOMEN / SNEAKERS",
    description: "From statement pairs to everyday staples.",
  },
  "women-clothing": {
    title: "WOMEN / CLOTHING",
    description: "Street-led layers built for all-day comfort.",
  },
  "women-accessories": {
    title: "WOMEN / ACCESSORIES",
    description: "Clean add-ons to sharpen every look.",
  },
  "men-running": {
    title: "MEN / RUNNING",
    description: "Performance pairs built for pace and distance.",
  },
  "women-running": {
    title: "WOMEN / RUNNING",
    description: "Responsive runners designed to keep you moving.",
  },
  "men-slides": {
    title: "MEN / SLIDES & SANDALS",
    description: "Easy on-foot comfort for off-duty days.",
  },
  "women-slides": {
    title: "WOMEN / SLIDES & SANDALS",
    description: "Laid-back pairs made for everyday wear.",
  },
};

// Map of slug → brand name for brand-specific collection pages
const brandSlugMap = {
  nike: "NIKE",
  adidas: "ADIDAS",
  jordan: "JORDAN",
  "new-balance": "NEW BALANCE",
  asics: "ASICS",
  puma: "PUMA",
  ugg: "UGG",
  "nike-sb": "NIKE SB",
  nocta: "NOCTA",
};

export default function CollectionPage() {
  const { slug, subcategory } = useParams();
  const [sortBy, setSortBy] = useState("newest");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset pagination when filters/route change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [slug, subcategory, sortBy, selectedBrands, selectedCollections, selectedCategories]);

  const brandName = brandSlugMap[slug];
  const metaKey = subcategory ? `${slug}-${subcategory}` : slug;
  const meta = brandName
    ? { title: brandName, description: `Curated ${brandName} drops, all in one place.` }
    : collectionMeta[metaKey] || { title: metaKey?.toUpperCase(), description: "" };

  // Base filtering by route
  const baseFiltered = useMemo(() => {
    let items = products;

    const CLOTHING_CATS = ["hoodies", "jackets", "pants", "t-shirts", "tights", "tracksuits"];

    if (brandName) {
      // Brand-specific page
      items = products.filter((p) => p.brand === brandName);
    } else if (subcategory) {
      if (subcategory === "clothing") {
        items = products.filter(
          (p) => p.category.includes(slug) && p.category.some((c) => CLOTHING_CATS.includes(c))
        );
      } else {
        items = products.filter(
          (p) => p.category.includes(slug) && p.category.includes(subcategory)
        );
      }
    } else if (slug === "new") {
      items = products.filter((p) => p.isNew);
    } else if (slug === "sale" || slug === "spring-sale") {
      items = products.filter((p) => p.isSale);
    } else if (slug === "kids") {
      items = products.filter((p) => p.category.includes(slug));
    } else if (slug === "soon" || slug === "raffle") {
      items = [];
    } else if (slug === "all") {
      items = products;
    }

    return items;
  }, [slug, subcategory, brandName]);

  // Apply brand + collection + category filters + sort
  const filtered = useMemo(() => {
    let items = baseFiltered;

    if (selectedBrands.length > 0) {
      items = items.filter((p) => selectedBrands.includes(p.brand));
    }

    if (selectedCollections.length > 0) {
      items = items.filter((p) => selectedCollections.includes(p.collection));
    }

    if (selectedCategories.length > 0) {
      items = items.filter((p) =>
        p.category && p.category.some((c) => selectedCategories.includes(c))
      );
    }

    if (sortBy === "price-low") {
      items = [...items].sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
    } else if (sortBy === "price-high") {
      items = [...items].sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
    }

    return items;
  }, [baseFiltered, selectedBrands, selectedCollections, selectedCategories, sortBy]);

  function clearAllFilters() {
    setSelectedBrands([]);
    setSelectedCollections([]);
    setSelectedCategories([]);
  }

  return (
    <main className="collection-page">
      <div className="collection-header">
        <h1 className="collection-title">{meta.title}</h1>
        <p className="collection-desc">{meta.description}</p>
      </div>

      <div className="collection-toolbar">
        <span className="collection-count">{filtered.length} PRODUCTS</span>
        <div className="collection-sort">
          <label>SORT BY</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">NEWEST</option>
            <option value="price-low">PRICE: LOW TO HIGH</option>
            <option value="price-high">PRICE: HIGH TO LOW</option>
          </select>
        </div>
      </div>

      <div className="collection-body">
        <CollectionFilters
          products={baseFiltered}
          selectedBrands={selectedBrands}
          onBrandsChange={setSelectedBrands}
          selectedCollections={selectedCollections}
          onCollectionsChange={setSelectedCollections}
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          onClearAll={clearAllFilters}
        />

        <div className="collection-products">
          {filtered.length > 0 ? (
            <>
              <ProductGrid products={filtered.slice(0, visibleCount)} />
              {visibleCount < filtered.length && (
                <div className="collection-load-more">
                  <span className="collection-load-more__count">
                    Showing {Math.min(visibleCount, filtered.length)} of {filtered.length}
                  </span>
                  <button
                    className="collection-load-more__btn"
                    onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                  >
                    LOAD MORE
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="collection-empty">
              <p>No products match your filters. Try adjusting them.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
