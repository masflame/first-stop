import pumaProducts from "./pumaProducts.js";
import newbalanceProducts from "./newbalanceProducts.js";
import nikeProducts from "./nikeProducts.js";
import jordanProducts from "./jordanProducts.js";
import asicsProducts from "./asicsProducts.js";
import adidasProducts from "./adidasProducts.js";
import uggProducts from "./uggProducts.js";

const rawProducts = [
  ...pumaProducts,
  ...newbalanceProducts,
  ...nikeProducts,
  ...jordanProducts,
  ...asicsProducts,
  ...adidasProducts,
  ...uggProducts,
];

const EXCLUDED_CATEGORY_TAGS = new Set(["men", "women", "kids", "new", "sale"]);
const MIN_DISCOUNT = 0.2;
const MAX_DISCOUNT = 0.45;

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function normalizePrice(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.round(value * 100) / 100;
}

function getProductCategories(product) {
  const categories = Array.isArray(product.category) ? product.category : [];
  return categories.filter((c) => !EXCLUDED_CATEGORY_TAGS.has(c));
}

function buildSalePrice(product, hash) {
  const base = Number(product.price) || 0;
  if (base <= 0) return product.salePrice;

  // Strict discount range: 20% to 45% off.
  const discountSteps = Math.round((MAX_DISCOUNT - MIN_DISCOUNT) * 100);
  const discount = MIN_DISCOUNT + (hash % (discountSteps + 1)) / 100;
  const calculated = base * (1 - discount);
  return normalizePrice(Math.max(1, calculated));
}

function applyGrandOpeningSales(products) {
  const categoryFirstSale = new Set();

  const withInitialSales = products.map((product) => {
    const hash = hashString(`${product.id}-${product.brand}-${product.name}`);
    const categories = getProductCategories(product);
    const existingSale = product.isSale || typeof product.salePrice === "number";
    const computedSale = hash % 100 < 38; // 38% baseline sale coverage
    const shouldBeSale = existingSale || computedSale;

    const saleProduct = shouldBeSale
      ? {
          ...product,
          isSale: true,
          salePrice: buildSalePrice(product, hash),
        }
      : { ...product };

    if (saleProduct.isSale) {
      for (const category of categories) {
        categoryFirstSale.add(category);
      }
    }

    return saleProduct;
  });

  // Ensure every category has at least one sale item.
  const allCategories = new Set();
  for (const product of withInitialSales) {
    for (const category of getProductCategories(product)) {
      allCategories.add(category);
    }
  }

  const missingCategories = [...allCategories].filter((category) => !categoryFirstSale.has(category));
  if (missingCategories.length === 0) return withInitialSales;

  const result = [...withInitialSales];
  for (const category of missingCategories) {
    const idx = result.findIndex((p) => getProductCategories(p).includes(category));
    if (idx < 0) continue;

    const product = result[idx];
    const hash = hashString(`${product.id}-${product.brand}-${product.slug || product.name}`);
    result[idx] = {
      ...product,
      isSale: true,
      salePrice: buildSalePrice(product, hash),
    };
  }

  return result;
}

const allProducts = applyGrandOpeningSales(rawProducts);

export default allProducts;
