import brands from "../data/brands";
import Seo from "../components/Seo";
import { buildBreadcrumbSchema } from "../utils/seo";
import "./BrandsPage.css";

export default function BrandsPage() {
  return (
    <main className="brands-page">
      <Seo
        title="Brands"
        description="Browse sneaker and streetwear brands available online in South Africa at FIRST STOP, including Nike, Jordan, Adidas, New Balance, ASICS, Puma, and UGG."
        canonicalPath="/brands"
        jsonLd={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Brands", path: "/brands" },
        ])}
      />
      <div className="brands-header">
        <h1 className="brands-title">BRANDS</h1>
      </div>

      <div className="brands-alphabet">
        {brands.map((group) => (
          <a key={group.letter} href={`#brand-${group.letter}`} className="brands-alpha-link">
            {group.letter}
          </a>
        ))}
      </div>

      <div className="brands-list">
        {brands.map((group) => (
          <div key={group.letter} id={`brand-${group.letter}`} className="brands-group">
            <h2 className="brands-group__letter">{group.letter}</h2>
            <div className="brands-group__names">
              {group.names.map((name) => (
                <a
                  key={name}
                  href={`/collections/${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                  className="brands-group__link"
                >
                  {name}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
