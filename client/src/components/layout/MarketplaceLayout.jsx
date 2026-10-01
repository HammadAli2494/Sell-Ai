import Header from "./Header.jsx";
import MarketplaceFooter from "./MarketplaceFooter.jsx";

function MarketplaceLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header />
      <div className="min-w-0 flex-1">{children}</div>
      <MarketplaceFooter />
    </div>
  );
}

export default MarketplaceLayout;
