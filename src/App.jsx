import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { BagProvider } from "./context/BagContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import BagSlider from "./components/BagSlider";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import CollectionPage from "./pages/CollectionPage";
import ProductPage from "./pages/ProductPage";
import BrandsPage from "./pages/BrandsPage";
import CheckoutPage from "./pages/CheckoutPage";
import AccountPage from "./pages/AccountPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import RafflesPage from "./pages/RafflesPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import ScrollToTop from "./components/ScrollToTop";
import SmoothScroll from "./components/SmoothScroll";
import Seo from "./components/Seo";
import useVisitorTracker from "./hooks/useVisitorTracker";
import "./App.css";

function App() {
  return (
    <SmoothScroll>
      <Router>
        <BagProvider>
          <AppLayout />
        </BagProvider>
      </Router>
    </SmoothScroll>
  );
}

function AppLayout() {
  useVisitorTracker();

  const { pathname } = useLocation();
  const isPaymentFlow = pathname.startsWith("/payment/");

  return (
    <>
      <ScrollToTop />
      <Header />
      <div
        className={`app-header-spacer${pathname === "/" ? " app-header-spacer--home" : ""}`}
        aria-hidden="true"
      />
      <BagSlider />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/collections/men" element={<CategoryPage />} />
        <Route path="/collections/women" element={<CategoryPage />} />
        <Route path="/collections/raffle" element={<RafflesPage />} />
        <Route path="/collections/soon" element={<ComingSoonPage />} />
        <Route path="/collections/:slug/:subcategory" element={<CollectionPage />} />
        <Route path="/collections/:slug" element={<CollectionPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/brands" element={<BrandsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/blog" element={<PlaceholderPage title="BLOG" />} />
        <Route path="/about" element={<PlaceholderPage title="ABOUT US" />} />
        <Route path="/stores" element={<PlaceholderPage title="STORES" />} />
        <Route path="/stores/:slug" element={<PlaceholderPage title="STORE" />} />
        <Route path="/contact" element={<PlaceholderPage title="CONTACT" />} />
        <Route path="/faq" element={<PlaceholderPage title="FAQ" />} />
        <Route path="/shipping" element={<PlaceholderPage title="SHIPPING & RETURNS" />} />
        <Route path="/size-guide" element={<PlaceholderPage title="SIZE GUIDE" />} />
        <Route path="/privacy" element={<PlaceholderPage title="PRIVACY POLICY" />} />
        <Route path="/terms" element={<PlaceholderPage title="TERMS & CONDITIONS" />} />
        <Route path="/imprint" element={<PlaceholderPage title="IMPRINT" />} />
        <Route path="/careers" element={<PlaceholderPage title="CAREERS" />} />
        <Route path="*" element={<PlaceholderPage title="404 - PAGE NOT FOUND" />} />
      </Routes>
      {!isPaymentFlow && <Footer />}
    </>
  );
}

function PlaceholderPage({ title }) {
  return (
    <main style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Seo
        title={title}
        description="This page is coming soon on SHOE DISTRICT."
        noindex
      />
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase" }}>{title}</h1>
        <p style={{ color: "#999", fontSize: 14, marginTop: 12 }}>This page is coming soon.</p>
      </div>
    </main>
  );
}

export default App;
