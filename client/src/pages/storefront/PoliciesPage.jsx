import { Link, useOutletContext } from "react-router-dom";

function PoliciesPage() {
  const { store } = useOutletContext();
  const settings = store.settings || {};

  return (
    <main className="ui-page mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="ui-title">Store policies</h1>
      <p className="ui-sub">{store.name}</p>

      <section className="ui-card mt-8 p-5">
        <h2 className="text-base font-semibold text-ink">Returns</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
          {settings.returnPolicy || "No return policy has been published."}
        </p>
      </section>

      <section className="ui-card mt-4 p-5">
        <h2 className="text-base font-semibold text-ink">Shipping</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
          {settings.shippingPolicy || "No shipping policy has been published."}
        </p>
      </section>

      {settings.supportEmail ? (
        <p className="mt-6 text-sm text-muted">
          Support:{" "}
          <a className="ui-link" href={`mailto:${settings.supportEmail}`}>
            {settings.supportEmail}
          </a>
        </p>
      ) : null}

      <Link to={`/s/${store.slug}`} className="ui-link mt-8 inline-block text-sm">
        Back to store
      </Link>
    </main>
  );
}

export default PoliciesPage;
