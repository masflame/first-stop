import { useParams } from "react-router-dom";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingBag } from "lucide-react";
import products from "../data/products";
import { useBag } from "../context/BagContext";
import { resolveImage } from "../utils/imageResolver";
import { getUnavailableSizeSet } from "../utils/sizeAvailability";
import { formatSizeDisplay } from "../utils/sizeFormat";
import Seo from "../components/Seo";
import { buildBreadcrumbSchema } from "../utils/seo";
import "./ProductPage.css";

function formatPrice(price, currency) {
  if (currency === "ZAR") {
    return `R ${price.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `€${price.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ProductPage() {
  const { id } = useParams();
  const { addItem } = useBag();
  const product = products.find((p) => p.id === Number(id));
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [hoveredImg, setHoveredImg] = useState(null);
  const unavailableSizes = useMemo(() => getUnavailableSizeSet(product), [product]);

  if (!product) {
    return (
      <main className="product-page">
        <Seo title="Product Not Found" noindex canonicalPath={`/product/${id}`} />
        <div className="product-not-found">
          <h1>Product not found</h1>
          <a href="/">Back to Home</a>
        </div>
      </main>
    );
  }

  // Build image list: use allImages if available, fall back to image/hoverImage
  const imageList = (product.allImages && product.allImages.length > 0)
    ? product.allImages.map(resolveImage).filter(Boolean)
    : [resolveImage(product.image)].filter(Boolean);

  const hasImages = imageList.length > 0;
  const requiresSize = product.sizes?.length > 0;
  const livePrice = product.salePrice || product.price;
  const currency = product.currency || "ZAR";
  const firstImage = imageList[0];
  const primaryCollectionPath = `/collections/${String(product.brand || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  const productSchema = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      image: imageList,
      brand: {
        "@type": "Brand",
        name: product.brand,
      },
      sku: product.sku || undefined,
      description:
        product.description ||
        `Shop ${product.name} by ${product.brand} online in South Africa at FIRST STOP.`,
      offers: {
        "@type": "Offer",
        priceCurrency: currency,
        price: Number(livePrice).toFixed(2),
        availability: "https://schema.org/InStock",
        url: `/product/${product.id}`,
        itemCondition: "https://schema.org/NewCondition",
      },
    },
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: product.brand, path: primaryCollectionPath },
      { name: product.name, path: `/product/${product.id}` },
    ]),
  ];

  const handleAddToBag = () => {
    if (requiresSize && !selectedSize) return;
    addItem(product, selectedSize || "ONE SIZE", quantity);
  };

  return (
    <main className="product-page">
      <Seo
        title={`${product.brand} ${product.name}`}
        description={
          product.description ||
          `Shop ${product.name} by ${product.brand} online in South Africa at FIRST STOP.`
        }
        canonicalPath={`/product/${product.id}`}
        image={firstImage}
        type="product"
        jsonLd={productSchema}
      />
      <div className="product-layout">
        {/* Images */}
        <div className="product-images">
          {hasImages && imageList.length > 1 && (
            <div className="product-image-thumbs">
              {imageList.map((src, i) => (
                <div
                  key={i}
                  className={`product-thumb ${i === activeImg ? "product-thumb--active" : ""}${hoveredImg === i ? " product-thumb--hovered" : ""}`}
                  onMouseEnter={() => setHoveredImg(i)}
                  onMouseLeave={() => setHoveredImg(null)}
                  onClick={() => setActiveImg(i)}
                >
                  <img src={src} alt={`${product.name} ${i + 1}`} loading="lazy" />
                </div>
              ))}
            </div>
          )}
          <div className="product-image-main">
            {hasImages ? (
              <>
                <img src={imageList[hoveredImg ?? activeImg]} alt={product.name} className="product-image-main__img" />
                {imageList.length > 1 && (
                  <>
                    <button
                      className="product-image-nav product-image-nav--prev"
                      onClick={() => setActiveImg((activeImg - 1 + imageList.length) % imageList.length)}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      className="product-image-nav product-image-nav--next"
                      onClick={() => setActiveImg((activeImg + 1) % imageList.length)}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="product-image-placeholder">
                <span>{product.brand}</span>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="product-details">
          <div className="product-breadcrumb">
            <a href="/">Home</a> / <a href={`/collections/${product.category[0]}`}>{product.category[0]}</a> / {product.name}
          </div>

          <h1 className="product-name">{product.name}</h1>
          <p className="product-sku">{product.sku}</p>
          <p className="product-color">{product.color}</p>

          <div className="product-price-block">
            {product.salePrice ? (
              <>
                <span className="product-price--sale">{formatPrice(product.salePrice, product.currency)}</span>
                <span className="product-price--original">{formatPrice(product.price, product.currency)}</span>
                <span className="product-price--discount">
                  -{Math.round((1 - product.salePrice / product.price) * 100)}%
                </span>
              </>
            ) : (
              <span className="product-price">{formatPrice(product.price, product.currency)}</span>
            )}
          </div>

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="product-sizes">
              <div className="product-sizes__header">
                <span className="product-sizes__label">SIZE (US)</span>
              </div>
              <div className="product-sizes__grid">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    className={`product-size-btn ${selectedSize === size ? "product-size-btn--active" : ""}${unavailableSizes.has(size) ? " product-size-btn--unavailable" : ""}`}
                    onClick={() => {
                      if (unavailableSizes.has(size)) return;
                      setSelectedSize(size);
                    }}
                    disabled={unavailableSizes.has(size)}
                    aria-disabled={unavailableSizes.has(size)}
                  >
                    {formatSizeDisplay(size)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="product-quantity">
            <span className="product-quantity__label">QUANTITY</span>
            <div className="product-quantity__controls">
              <button
                className="qty-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus size={14} />
              </button>
              <span className="qty-value">{quantity}</span>
              <button className="qty-btn" onClick={() => setQuantity(quantity + 1)}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Add to Bag */}
          <button
            className="product-add-to-cart"
            disabled={requiresSize && !selectedSize}
            onClick={handleAddToBag}
          >
            <ShoppingBag size={16} />
            {requiresSize && !selectedSize ? "SELECT A SIZE" : "ADD TO BAG"}
          </button>

          {/* Details Accordion */}
          <div className="product-accordions">
            <details className="product-accordion">
              <summary>DESCRIPTION</summary>
              <p>
                {product.description || `The ${product.name} from ${product.brand}${product.color ? ` in ${product.color}` : ""}. A timeless silhouette with premium materials and exceptional comfort.`}
              </p>
            </details>
            <details className="product-accordion">
              <summary>SHIPPING & RETURNS</summary>
              <p>
                {product.currency === "ZAR"
                  ? "Free shipping in South Africa from R1,500. International shipping rates calculated at checkout. Returns accepted within 14 days of delivery."
                  : "Free shipping in Germany from €80. International shipping rates calculated at checkout. Returns accepted within 14 days of delivery."}
              </p>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
}
