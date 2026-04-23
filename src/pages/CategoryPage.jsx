import { useLocation, Link } from "react-router-dom";
import Seo from "../components/Seo";
import { buildBreadcrumbSchema } from "../utils/seo";
import "./CategoryPage.css";

const categoryData = {
  men: {
    title: "MEN",
    description: "Built for everyday wear, from pairs to layers.",
    subcategories: [
      {
        label: "SNEAKERS",
        slug: "sneakers",
        description: "From essentials to statement pairs.",
      },
      {
        label: "CLOTHING",
        slug: "clothing",
        description: "Core layers made for your rotation.",
      },
      {
        label: "ACCESSORIES",
        slug: "accessories",
        description: "Finishing touches for every fit.",
      },
    ],
  },
  women: {
    title: "WOMEN",
    description: "Street-ready picks with comfort and edge.",
    subcategories: [
      {
        label: "SNEAKERS",
        slug: "sneakers",
        description: "Fresh silhouettes and daily staples.",
      },
      {
        label: "CLOTHING",
        slug: "clothing",
        description: "Easy layers built for movement.",
      },
      {
        label: "ACCESSORIES",
        slug: "accessories",
        description: "Clean extras that pull it together.",
      },
    ],
  },
};

export default function CategoryPage() {
  const location = useLocation();
  const gender = location.pathname.split("/").pop();
  const data = categoryData[gender];

  if (!data) {
    return (
      <main className="category-page">
        <Seo title="Category Not Found" noindex canonicalPath={location.pathname} />
        <div className="category-header">
          <h1 className="category-title">NOT FOUND</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="category-page">
      <Seo
        title={`${data.title} Sneakers, Clothing & Accessories`}
        description={`Shop ${data.title.toLowerCase()} sneakers, streetwear clothing, and accessories online in South Africa at FIRST STOP. ${data.description}`}
        canonicalPath={location.pathname}
        jsonLd={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: data.title, path: location.pathname },
        ])}
      />
      <div className="category-header">
        <h1 className="category-title">{data.title}</h1>
        <p className="category-desc">{data.description}</p>
      </div>

      <div className="category-grid">
        {data.subcategories.map((sub) => (
          <Link
            key={sub.slug}
            to={`/collections/${gender}/${sub.slug}`}
            className="category-card"
          >
            <div className="category-card__inner">
              <h2 className="category-card__title">{sub.label}</h2>
              <p className="category-card__desc">{sub.description}</p>
              <span className="category-card__cta">SHOP NOW</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
