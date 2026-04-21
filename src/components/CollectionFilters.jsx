import { useState } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import "./CollectionFilters.css";

export default function CollectionFilters({
  products,
  selectedBrands,
  onBrandsChange,
  selectedCollections,
  onCollectionsChange,
  selectedCategories = [],
  onCategoriesChange,
  onClearAll,
}) {
  const [expandedBrands, setExpandedBrands] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);

  // Build brand → collections map from the product list
  const brandMap = {};
  for (const p of products) {
    const brand = p.brand || "OTHER";
    if (!brandMap[brand]) brandMap[brand] = { count: 0, collections: {} };
    brandMap[brand].count++;
    if (p.collection) {
      if (!brandMap[brand].collections[p.collection]) {
        brandMap[brand].collections[p.collection] = 0;
      }
      brandMap[brand].collections[p.collection]++;
    }
  }

  // Build category counts from the product list
  const DISPLAY_CATEGORIES = [
    "sneakers", "hoodies", "jackets", "pants", "t-shirts", "tights",
    "tracksuits", "running", "slides & sandals", "accessories", "dresses & skirts",
    "bags", "hats & headwear", "socks", "clothing",
  ];
  const categoryMap = {};
  for (const p of products) {
    if (!p.category) continue;
    for (const cat of p.category) {
      if (DISPLAY_CATEGORIES.includes(cat)) {
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      }
    }
  }
  const sortedCategories = Object.keys(categoryMap).sort();
  const hasCategories = sortedCategories.length > 0 && onCategoriesChange;

  const sortedBrands = Object.keys(brandMap).sort();
  const hasActiveFilters = selectedBrands.length > 0 || selectedCollections.length > 0 || selectedCategories.length > 0;

  function toggleBrand(brand) {
    const next = selectedBrands.includes(brand)
      ? selectedBrands.filter((b) => b !== brand)
      : [...selectedBrands, brand];
    onBrandsChange(next);

    // If un-checking a brand, also remove its collections from selection
    if (!next.includes(brand)) {
      const brandCols = Object.keys(brandMap[brand]?.collections || {});
      const nextCols = selectedCollections.filter(
        (c) => !brandCols.includes(c)
      );
      onCollectionsChange(nextCols);
    }
  }

  function toggleCollection(col) {
    const next = selectedCollections.includes(col)
      ? selectedCollections.filter((c) => c !== col)
      : [...selectedCollections, col];
    onCollectionsChange(next);
  }

  function toggleExpand(brand) {
    setExpandedBrands((prev) => ({ ...prev, [brand]: !prev[brand] }));
  }

  function toggleCategory(cat) {
    if (!onCategoriesChange) return;
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    onCategoriesChange(next);
  }

  const filterContent = (
    <div className="filters__inner">
      <div className="filters__header">
        <span className="filters__title">FILTER</span>
        {hasActiveFilters && (
          <button className="filters__clear" onClick={onClearAll}>
            CLEAR ALL
          </button>
        )}
      </div>

      {/* Active filter tags */}
      {hasActiveFilters && (
        <div className="filters__tags">
          {selectedBrands.map((b) => (
            <button
              key={b}
              className="filters__tag"
              onClick={() => toggleBrand(b)}
            >
              {b} <X size={10} />
            </button>
          ))}
          {selectedCollections.map((c) => (
            <button
              key={c}
              className="filters__tag"
              onClick={() => toggleCollection(c)}
            >
              {c} <X size={10} />
            </button>
          ))}
          {selectedCategories.map((c) => (
            <button
              key={c}
              className="filters__tag"
              onClick={() => toggleCategory(c)}
            >
              {c.toUpperCase()} <X size={10} />
            </button>
          ))}
        </div>
      )}

      {hasCategories && (
        <div className="filters__section">
          <h3 className="filters__section-title">CATEGORY</h3>
          <div className="filters__brand-list">
            {sortedCategories.map((cat) => (
              <div key={cat} className="filters__brand-group">
                <div className="filters__brand-row">
                  <label className="filters__checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                    />
                    <span className="filters__checkbox-custom" />
                    <span className="filters__brand-name">{cat.toUpperCase()}</span>
                    <span className="filters__count">({categoryMap[cat]})</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="filters__section">
        <h3 className="filters__section-title">BRAND</h3>
        <div className="filters__brand-list">
          {sortedBrands.map((brand) => {
            const info = brandMap[brand];
            const hasCols = Object.keys(info.collections).length > 0;
            const isExpanded = expandedBrands[brand];
            const isChecked = selectedBrands.includes(brand);
            const sortedCols = Object.keys(info.collections).sort();

            return (
              <div key={brand} className="filters__brand-group">
                <div className="filters__brand-row">
                  <label className="filters__checkbox-label">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleBrand(brand)}
                    />
                    <span className="filters__checkbox-custom" />
                    <span className="filters__brand-name">{brand}</span>
                    <span className="filters__count">({info.count})</span>
                  </label>
                  {hasCols && (
                    <button
                      className="filters__expand-btn"
                      onClick={() => toggleExpand(brand)}
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </button>
                  )}
                </div>

                {hasCols && isExpanded && (
                  <div className="filters__collection-list">
                    {sortedCols.map((col) => (
                      <label key={col} className="filters__checkbox-label filters__checkbox-label--sub">
                        <input
                          type="checkbox"
                          checked={selectedCollections.includes(col)}
                          onChange={() => toggleCollection(col)}
                        />
                        <span className="filters__checkbox-custom" />
                        <span className="filters__collection-name">{col}</span>
                        <span className="filters__count">
                          ({info.collections[col]})
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="filters__mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? "HIDE FILTERS" : "SHOW FILTERS"}
        {hasActiveFilters && (
          <span className="filters__active-count">
            {selectedBrands.length + selectedCollections.length + selectedCategories.length}
          </span>
        )}
      </button>

      {/* Desktop sidebar */}
      <aside className="filters filters--desktop">{filterContent}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="filters__mobile-overlay" onClick={() => setMobileOpen(false)}>
          <aside
            className="filters filters--mobile"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="filters__mobile-header">
              <span>FILTERS</span>
              <button onClick={() => setMobileOpen(false)}>
                <X size={18} />
              </button>
            </div>
            {filterContent}
          </aside>
        </div>
      )}
    </>
  );
}
