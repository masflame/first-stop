import { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { resolveImage } from "../utils/imageResolver";
import { getUnavailableSizeSet } from "../utils/sizeAvailability";
import { formatSizeDisplay } from "../utils/sizeFormat";
import "./ProductCard.css";

function formatPrice(price, currency) {
  if (currency === "ZAR") {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(price);
  }
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

function getCardDetail(product) {
  if (product.collection) return product.collection;
  if (Array.isArray(product.category)) {
    const detail = product.category.find(
      (cat) => !["men", "women", "kids", "new", "sale"].includes(String(cat).toLowerCase())
    );
    if (detail) return detail;
  }
  return "";
}

export default function ProductCard({ product }) {
  const [hovered, setHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [mainImgError, setMainImgError] = useState(false);
  const [hoverImgError, setHoverImgError] = useState(false);

  const hasSizes = product.sizes && product.sizes.length > 0;

  const mainImg = resolveImage(product.image);
  const hoverImg = resolveImage(product.hoverImage);
  const unavailableSizes = useMemo(() => getUnavailableSizeSet(product), [product]);
  const discountPercent = useMemo(() => {
    const original = Number(product.price);
    const sale = Number(product.salePrice);
    if (!Number.isFinite(original) || !Number.isFinite(sale) || original <= 0 || sale >= original) {
      return null;
    }
    return Math.round(((original - sale) / original) * 100);
  }, [product.price, product.salePrice]);

  const handleLoad = useCallback(() => setImgLoaded(true), []);
  const handleError = useCallback(() => {
    // If hover image fails, drop back to the main image instead of removing the card.
    if (hovered && hoverImg && !hoverImgError) {
      setHoverImgError(true);
      setHovered(false);
      return;
    }
    setMainImgError(true);
    setImgLoaded(true);
  }, [hovered, hoverImg, hoverImgError]);

  const hasImage = !!mainImg && !mainImgError;
  const activeImg = hovered && hoverImg && !hoverImgError ? hoverImg : mainImg;
  const cardDetail = getCardDetail(product);

  return (
    <div className={`product-card${!imgLoaded ? " product-card--loading" : ""}`}>
      <Link to={`/product/${product.id}`} className="product-card__link">
        <div
          className="product-card__image-wrap"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {hasImage ? (
            <>
              {!imgLoaded && <div className="product-card__shimmer" />}
              <img
                src={activeImg}
                alt={product.name}
                className={`product-card__image${imgLoaded ? " product-card__image--loaded" : ""}`}
                loading="lazy"
                onLoad={handleLoad}
                onError={handleError}
              />
            </>
          ) : (
            <div className="product-card__image-placeholder">
              <span className="product-card__brand-watermark">{product.brand}</span>
            </div>
          )}

          {product.isSale && (
            <span className="product-card__badge product-card__badge--sale">
              {discountPercent ? `Sale -${discountPercent}%` : "Sale"}
            </span>
          )}
          {product.isNew && <span className="product-card__badge product-card__badge--new">New</span>}
        </div>
      </Link>

      <div className="product-card__info">
        <div className="product-card__meta" aria-label="Product details">
          <span className="product-card__brand">{product.brand}</span>
          {cardDetail && <span className="product-card__detail">{cardDetail}</span>}
        </div>

        <Link to={`/product/${product.id}`} className="product-card__name">
          {product.name}
        </Link>

        <div className="product-card__price">
          {product.salePrice ? (
            <>
              <span className="product-card__price-main">
                <span className="product-card__sale-price">
                  {formatPrice(product.salePrice, product.currency)}
                </span>
                <span className="product-card__original-price">
                  {formatPrice(product.price, product.currency)}
                </span>
              </span>
              {discountPercent && (
                <span className="product-card__discount">-{discountPercent}%</span>
              )}
            </>
          ) : (
            <span className="product-card__price-main">{formatPrice(product.price, product.currency)}</span>
          )}
        </div>

        {/* Size selector on hover */}
        {hovered && hasSizes && (
          <div className="product-card__sizes">
            <div className="product-card__size-list">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  className={`size-btn${unavailableSizes.has(size) ? " size-btn--unavailable" : ""}`}
                  disabled={unavailableSizes.has(size)}
                  aria-disabled={unavailableSizes.has(size)}
                >
                  {formatSizeDisplay(size)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
