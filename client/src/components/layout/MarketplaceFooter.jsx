import { Link } from "react-router-dom";

function MarketplaceFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-4">
        <div>
          <p className="text-sm font-semibold text-ink">SellAi</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            A marketplace for independent merchants and the customers who shop with them.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Shop</p>
          <div className="mt-3 grid gap-2 text-sm">
            <Link to="/stores" className="ui-link">
              Browse stores
            </Link>
            <Link to="/categories" className="ui-link">
              Categories
            </Link>
            <Link to="/customer/login" className="ui-link">
              Customer login
            </Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">For merchants</p>
          <div className="mt-3 grid gap-2 text-sm">
            <Link to="/register" className="ui-link">
              Start selling
            </Link>
            <Link to="/login" className="ui-link">
              Merchant login
            </Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Contact</p>
          <p className="mt-3 text-sm text-muted">Questions about a product or order belong with the store you shopped.</p>
        </div>
      </div>
      <div className="border-t border-line px-4 py-4 text-center text-xs text-muted">
        Powered by SellAi
      </div>
    </footer>
  );
}

export default MarketplaceFooter;
