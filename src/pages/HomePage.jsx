import { Link } from "react-router-dom";
import HeroBanner from "../components/HeroBanner";
import ProductGrid from "../components/ProductGrid";
// import StoreLocations from "../components/StoreLocations";
import BrandShowcase from "../components/BrandShowcase";
import CurtainBanners from "../components/CurtainBanners";
import ScrollRevealWrap from "../components/ScrollRevealWrap";
import Seo from "../components/Seo";
import products from "../data/products";
import { resolveImage } from "../utils/imageResolver";
import { buildBreadcrumbSchema, buildItemListSchema, getCanonicalUrl } from "../utils/seo";

// Nike editorial images
import nikeGirlAF1 from "../assets/display/nike-girl-holding blue af1.jpg";
import nikeBlackAF1 from "../assets/display/nike black af1-held mid air-beige background.jpg";
import nikeRedAF1 from "../assets/display/nike-red af1-mid air.jpg";
import nikeGirlBball from "../assets/display/nike-closeup-girl-nike sweater-holding-basketball.jpg";
import nikeGuyAttire from "../assets/display/nike-guy-full-attire closeup.jpg";
import personAttire from "../assets/display/person-full-attire-white-backdrop.jpg";
import nike7 from "../assets/display/nike (7).jpg";

// Adidas editorial images
import adidasPink from "../assets/display/adidas-pink-on-skateboard.jpg";
import adidasYellowSambas from "../assets/display/adidas-yellow-sambas-in-hand.jpg";
import adidasGreenSide from "../assets/display/adidas-green-side-2.jpg";
import adidasPeach from "../assets/display/adidas peach-top-view.jpg";
import adidasBlack from "../assets/display/adidas black-running.jpg";
import adidasGreenBack from "../assets/display/adidas-green-back.jpg";
import adidasGreeSide from "../assets/display/adidas-gree-side.jpg";

// New Balance editorial images
import nbMountain from "../assets/display/new balance-550-pair-on-mountain-closeup-potrait.jpg";
import nbStairs from "../assets/display/new balance-persom-on-stairs.jpg";
import nbTopView from "../assets/display/new balance-top-view-darj-greenish-bakground.jpg";
import nbInHand from "../assets/display/new balance-white-in-hand-potrait.jpg";
import nbWide from "../assets/display/new balance-wide.jpg";

// Asics editorial images
import asicsBeige from "../assets/display/asics-beige-side-wide.jpg";
import asicsPeach from "../assets/display/asics-peach-closeup.jpg";
import asicsPurple from "../assets/display/asics-purple-wide.jpg";

// Puma editorial images
import pumaBlack from "../assets/display/puma-black shoes mid air-white backdrop.jpg";
import pumaNight from "../assets/display/puma-shoe closeup-at night.jpg";
import pumaBlue from "../assets/display/puma-top view-blue surface.jpg";

// UGG editorial images
import uggWall from "../assets/display/ugg-against wall-vertical.jpg";
import uggBack from "../assets/display/ugg-back-closeup.jpg";

const HOME_SECTION_ITEM_LIMIT = 9;

export default function HomePage() {
  // Helper: check if a product image path is for sneakers/shoes
  const isSneakerImage = (p) =>
    p.image && (p.image.startsWith("shop/Sneakers/") || p.image.startsWith("shop/Running/") || p.image.startsWith("shop/Slides"));

  // Helper: check if product is an Air Force 1
  const isAF1 = (p) =>
    p.name && p.name.toLowerCase().includes("air force");

  // Seeded shuffle - changes daily so sections feel dynamic
  const daySeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  function seededShuffle(arr, seed) {
    const a = [...arr];
    let s = seed;
    for (let i = a.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // New Arrivals: always AF1 + Jordans, rest shuffled daily
  const newArrivals = [];
  const af1New = products.find((p) => p.brand === "NIKE" && isAF1(p) && isSneakerImage(p));
  if (af1New) newArrivals.push(af1New);
  const jordanNew = products.find((p) => p.brand === "JORDAN" && isSneakerImage(p) && !newArrivals.includes(p));
  if (jordanNew) newArrivals.push(jordanNew);
  const restNew = seededShuffle(
    products.filter((p) => p.isNew && isSneakerImage(p) && !newArrivals.includes(p)),
    daySeed
  );
  for (const p of restNew) {
    if (newArrivals.length >= HOME_SECTION_ITEM_LIMIT) break;
    // Keep brand diversity - max 2 per brand
    const brandCount = newArrivals.filter((x) => x.brand === p.brand).length;
    if (brandCount < 2) newArrivals.push(p);
  }
  const newArrivalsSlice = newArrivals.slice(0, HOME_SECTION_ITEM_LIMIT);

  // Grand opening sales: keep category variety and always include this section on home.
  const salePool = seededShuffle(products.filter((p) => p.isSale), daySeed + 4242);
  const saleHighlights = [];
  for (const p of salePool) {
    if (saleHighlights.length >= HOME_SECTION_ITEM_LIMIT) break;
    const brandCount = saleHighlights.filter((x) => x.brand === p.brand).length;
    if (brandCount < 2) saleHighlights.push(p);
  }
  const saleHighlightsSlice = saleHighlights.slice(0, HOME_SECTION_ITEM_LIMIT);

  // Best sellers: pick top-priced products from each major brand (curated selection)
  const bestSellerBrands = ["NIKE", "ADIDAS", "JORDAN", "NEW BALANCE", "ASICS", "PUMA", "UGG"];
  const bestSellers = [];
  for (const brand of bestSellerBrands) {
    const brandProducts = products
      .filter((p) => p.brand === brand && isSneakerImage(p))
      .sort((a, b) => b.price - a.price);
    if (brandProducts.length > 0) bestSellers.push(brandProducts[0]);
    if (brandProducts.length > 1) bestSellers.push(brandProducts[1]);
  }
  const bestSellersSlice = bestSellers.slice(0, HOME_SECTION_ITEM_LIMIT);

  // Featured Jordans: sneakers only
  const featuredJordans = products
    .filter((p) => p.brand === "JORDAN" && isSneakerImage(p))
    .slice(0, HOME_SECTION_ITEM_LIMIT);

  // Trending: always AF1 + Jordan, rest shuffled daily (different seed offset)
  const trending = [];
  const af1Trending = products.find((p) => p.brand === "NIKE" && isAF1(p) && isSneakerImage(p) && !newArrivals.includes(p));
  if (af1Trending) trending.push(af1Trending);
  const jordanTrending = products.find((p) => p.brand === "JORDAN" && isSneakerImage(p) && !newArrivals.includes(p) && !trending.includes(p));
  if (jordanTrending) trending.push(jordanTrending);
  const restTrending = seededShuffle(
    products.filter((p) => p.isNew && isSneakerImage(p) && !newArrivals.includes(p) && !trending.includes(p)),
    daySeed + 7777
  );
  for (const p of restTrending) {
    if (trending.length >= HOME_SECTION_ITEM_LIMIT) break;
    const brandCount = trending.filter((x) => x.brand === p.brand).length;
    if (brandCount < 2) trending.push(p);
  }
  const trendingSlice = trending.slice(0, HOME_SECTION_ITEM_LIMIT);

  // Brand tiles for "Shop by Brand" section - prefer sneaker images
  const brandTiles = bestSellerBrands.map((brand) => {
    const bp = products.find((p) => p.brand === brand && isSneakerImage(p));
    return {
      name: brand,
      slug: brand.toLowerCase().replace(/ /g, "-"),
      image: bp ? resolveImage(bp.image) : "",
      count: products.filter((p) => p.brand === brand).length,
    };
  }).filter((b) => b.image);

  const homeSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "SHOE DISTRICT",
      url: getCanonicalUrl("/"),
      logo: getCanonicalUrl("/favicon.svg"),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "SHOE DISTRICT",
      url: getCanonicalUrl("/"),
    },
    buildBreadcrumbSchema([{ name: "Home", path: "/" }]),
    buildItemListSchema(newArrivalsSlice.slice(0, HOME_SECTION_ITEM_LIMIT), "New Arrivals", "/"),
  ];

  return (
    <main>
      <Seo
        title="Home"
        description="Shop premium sneakers and streetwear online in South Africa. Discover Nike, Jordan, Adidas, New Balance, ASICS, Puma, UGG, new arrivals, and curated drops at SHOE DISTRICT."
        canonicalPath="/"
        jsonLd={homeSchemas}
      />
      <HeroBanner />

      <div className="homepage-content">
      {/* <section className="grand-opening-banner">
        <div className="grand-opening-banner__content">
          <span className="grand-opening-banner__kicker">The Edit.</span>
          <h2 className="grand-opening-banner__title">The Streetwear Edit.</h2>
          <p className="grand-opening-banner__text">
            SELECTED PIECES FROM OUR CURRENT DROP. NOW ACCESSIBLE.
          </p>
          <Link to="/collections/sale" className="grand-opening-banner__cta">
            SHOP THE SELECTION
          </Link>
        </div>
      </section> */}

      <ProductGrid
        products={saleHighlightsSlice}
        title="THE STREETWEAR SELECTION"
        viewAllLink="/collections/sale"
        mobileLayout="row"
        desktopColumns={3}
      />

      <ProductGrid
        products={newArrivalsSlice}
        title="NEW ARRIVALS"
        viewAllLink="/collections/new"
        mobileLayout="row"
        desktopColumns={3}
      />

      {/* ── EDITORIAL 1: Nike - Force of Nature ── */}
      <ScrollRevealWrap direction="up">
        <section className="editorial editorial-nike">
          <div className="editorial__inner">
            <div className="editorial-nike__layout">
              <div className="editorial-nike__text-side">
                <span className="editorial__label">Editorial</span>
                <h2 className="editorial__headline">Force of Nature</h2>
                <p className="editorial__subtext">
                  Air Force 1. The icon that rewrote the rules of the street.
                </p>
                <Link to="/collections/nike" className="editorial__cta">
                  Shop Nike →
                </Link>
              </div>
              <div className="editorial-nike__grid">
                <div className="editorial__img editorial-nike__tall">
                  <img src={nikeGirlAF1} alt="Nike Air Force 1 editorial" />
                </div>
                <div className="editorial-nike__stack">
                  <div className="editorial__img">
                    <img src={nikeBlackAF1} alt="Black Air Force 1 suspended mid-air" />
                  </div>
                  <div className="editorial__img">
                    <img src={nikeRedAF1} alt="Red Air Force 1 mid-air" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollRevealWrap>

      {/* Curtain Reveal - Category Banners */}
      <CurtainBanners />

      {/* ── EDITORIAL 2: Adidas - Street Palette ── */}
      <ScrollRevealWrap direction="up">
        <section className="editorial editorial-adidas">
          <div className="editorial__inner">
            <div className="editorial__text editorial__text--left">
              <span className="editorial__label">The Edit</span>
              <h2 className="editorial__headline">Street Palette</h2>
              <p className="editorial__subtext">
                Every colour tells a story. Adidas, from sidewalk to skatepark.
              </p>
            </div>
            <div className="editorial-adidas__row">
              <div className="editorial-adidas__collage">
                <div className="editorial__img ed-adidas-wide">
                  <img src={adidasPink} alt="Pink Adidas on skateboard" />
                </div>
                <div className="editorial__img">
                  <img src={adidasYellowSambas} alt="Yellow Sambas held in hand" />
                </div>
                <div className="editorial__img">
                  <img src={adidasPeach} alt="Adidas peach top view" />
                </div>
                <div className="editorial__img">
                  <img src={adidasGreenSide} alt="Adidas green profile" />
                </div>
              </div>
              <div className="editorial-adidas__cta-side">
                <Link to="/collections/adidas" className="editorial__cta">
                  Shop Adidas →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </ScrollRevealWrap>

      {/* Best Sellers from all brands */}
      <ProductGrid
        products={bestSellersSlice}
        title="BEST SELLERS"
        viewAllLink="/collections/all"
        mobileLayout="row"
        desktopColumns={3}
      />

      {/* ── EDITORIAL 3: New Balance - Venture Beyond ── */}
      <section className="editorial editorial-nb">
        <div className="editorial-nb__hero">
          <img src={nbMountain} alt="New Balance 550 on mountain terrain" />
          <div className="editorial-nb__hero-overlay">
            <span className="editorial__label" style={{ color: "rgba(255,255,255,0.5)" }}>
              Lookbook
            </span>
            <h2 className="editorial__headline">Venture Beyond</h2>
            <p className="editorial__subtext">New Balance. Made for the journey.</p>
            <Link to="/collections/new-balance" className="editorial__cta">
              Shop New Balance →
            </Link>
          </div>
        </div>
        <div className="editorial-nb__strip">
          <ScrollRevealWrap direction="left">
            <div className="editorial__img">
              <img src={nbStairs} alt="New Balance lifestyle on stairs" />
            </div>
          </ScrollRevealWrap>
          <ScrollRevealWrap direction="up" delay={0.1}>
            <div className="editorial__img">
              <img src={nbTopView} alt="New Balance top-down view" />
            </div>
          </ScrollRevealWrap>
          <ScrollRevealWrap direction="right" delay={0.2}>
            <div className="editorial__img">
              <img src={nbInHand} alt="White New Balance held in hand" />
            </div>
          </ScrollRevealWrap>
        </div>
      </section>

      {/* Shop by Brand tiles */}
      <ScrollRevealWrap direction="up">
        <section className="brand-tiles-section">
          <div className="brand-tiles-header">
            <h2 className="brand-tiles-title">SHOP BY BRAND</h2>
          </div>
          <div className="brand-tiles-grid">
            {brandTiles.map((brand) => (
              <Link
                key={brand.name}
                to={`/collections/${brand.slug}`}
                className="brand-tile"
              >
                <div className="brand-tile__image-wrap">
                  <img src={brand.image} alt={brand.name} className="brand-tile__image" />
                  <div className="brand-tile__overlay" />
                </div>
                <div className="brand-tile__info">
                  <h3 className="brand-tile__name">{brand.name}</h3>
                  <span className="brand-tile__count">{brand.count} Products</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </ScrollRevealWrap>

      {/* Featured Jordans */}
      {featuredJordans.length > 0 && (
        <ProductGrid
          products={featuredJordans}
          title="FEATURED JORDANS"
          viewAllLink="/collections/jordan"
          mobileLayout="row"
          desktopColumns={3}
        />
      )}

      {/* ── EDITORIAL 4: The Culture - Multi-brand Collage ── */}
      <ScrollRevealWrap direction="up">
        <section className="editorial editorial-culture">
          <div className="editorial__inner">
            <div className="editorial-culture__header">
              <div className="editorial-culture__header-text">
                <span className="editorial__label">Culture</span>
                <h2 className="editorial__headline">The Culture</h2>
                <p className="editorial__subtext">
                  Style is a language spoken through sneakers.
                </p>
              </div>
              <Link to="/collections/all" className="editorial__cta" style={{ color: "#fff" }}>
                Shop All Brands →
              </Link>
            </div>
            <div className="editorial-culture__grid">
              <div className="editorial__img ed-culture-tall">
                <img src={nikeGirlBball} alt="Nike lifestyle - basketball culture" />
              </div>
              <div className="editorial__img">
                <img src={pumaNight} alt="Puma closeup at night" />
              </div>
              <div className="editorial__img">
                <img src={asicsBeige} alt="Asics beige side profile" />
              </div>
              <div className="editorial__img">
                <img src={uggWall} alt="UGG against the wall" />
              </div>
              <div className="editorial__img">
                <img src={personAttire} alt="Full attire editorial" />
              </div>
            </div>
          </div>
        </section>
      </ScrollRevealWrap>

      {/* Pinned Brand Showcase */}
      <BrandShowcase />

      {/* ── EDITORIAL 5: Grails on Display - Product Detail Strip ── */}
      <section className="editorial editorial-upclose">
        <div className="editorial__inner">
          <div className="editorial__text editorial__text--left">
            <span className="editorial__label">Details</span>
            <h2 className="editorial__headline">Grails on Display</h2>
            <p className="editorial__subtext">
              Craftsmanship in every stitch, every sole, every silhouette.
            </p>
          </div>
        </div>
        <div className="editorial-upclose__scroll">
          {[
            { src: asicsPurple, label: "ASICS", alt: "Asics purple wide angle" },
            { src: pumaBlack, label: "PUMA", alt: "Puma black shoes mid air" },
            { src: nbWide, label: "NEW BALANCE", alt: "New Balance wide shot" },
            { src: adidasBlack, label: "ADIDAS", alt: "Adidas black running" },
            { src: asicsPeach, label: "ASICS", alt: "Asics peach closeup" },
            { src: pumaBlue, label: "PUMA", alt: "Puma top view on blue" },
            { src: uggBack, label: "UGG", alt: "UGG back detail" },
            { src: adidasGreenBack, label: "ADIDAS", alt: "Adidas green back view" },
            { src: adidasGreeSide, label: "ADIDAS", alt: "Adidas green side view" },
            { src: nikeGuyAttire, label: "NIKE", alt: "Nike full attire closeup" },
            { src: nike7, label: "NIKE", alt: "Nike editorial" },
          ].map((item, i) => (
            <div key={i} className="editorial-upclose__item">
              <img src={item.src} alt={item.alt} />
              <div className="editorial-upclose__caption">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Now */}
      {trendingSlice.length > 0 && (
        <div className="trending-now-section">
          <ProductGrid
            products={trendingSlice}
            title="TRENDING NOW"
            viewAllLink="/collections/new"
            mobileLayout="row"
            desktopColumns={3}
          />
        </div>
      )}

      {/* Brands Strip */}
      <ScrollRevealWrap direction="up">
        <section className="brands-strip">
          <div className="brands-strip__inner">
            {["NIKE", "ADIDAS", "JORDAN", "NEW BALANCE", "ASICS", "PUMA", "UGG"].map(
              (brand) => (
                <Link key={brand} to={`/collections/${brand.toLowerCase().replace(/ /g, "-")}`} className="brands-strip__item">
                  {brand}
                </Link>
              )
            )}
          </div>
        </section>
      </ScrollRevealWrap>

      {/* <StoreLocations /> */}
      </div>
    </main>
  );
}
