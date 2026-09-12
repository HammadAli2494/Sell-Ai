import { NavLink } from "react-router-dom";

const dashboardLinks = [
  {
    to: "/store",
    label: "Dashboard",
    end: true,
    icon: (
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    ),
  },
  {
    to: "/store/products",
    label: "Products",
    icon: (
      <path d="M4 8.5 12 4l8 4.5-8 4.5L4 8.5zm0 7 8 4.5 8-4.5M4 12l8 4.5L20 12" />
    ),
  },
  {
    to: "/store/categories",
    label: "Categories",
    icon: (
      <>
        <path d="M4 7h16M4 12h16M4 17h10" />
      </>
    ),
  },
  {
    to: "/store/orders",
    label: "Orders",
    icon: (
      <path d="M7 4h10l2 4H5l2-4zm-2 4h14v12H5zM9 12h6" />
    ),
  },
  {
    to: "/store/customers",
    label: "Customers",
    icon: (
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 9a7 7 0 0 1 14 0" />
    ),
  },
  {
    to: "/store/analytics",
    label: "Analytics",
    icon: (
      <path d="M5 19V9m7 10V5m7 14v-7" />
    ),
  },
  {
    to: "/store/ai",
    label: "AI Center",
    icon: (
      <path d="M12 3v3m0 12v3M3 12h3m12 0h3M6.3 6.3l2.1 2.1m7.2 7.2 2.1 2.1m0-11.4-2.1 2.1M8.4 15.6l-2.1 2.1M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" />
    ),
  },
  {
    to: "/store/billing",
    label: "Billing",
    icon: (
      <path d="M4 7h16v12H4zM4 11h16M8 15h4" />
    ),
  },
  {
    to: "/store/settings",
    label: "Settings",
    icon: (
      <path d="M12 15.5A3.5 3.5 0 1 0 8.5 12 3.5 3.5 0 0 0 12 15.5zM4.6 9.2l1.5.4m11.8 0 .9-.9M12 4v1.6M4 12h1.6M18.4 12H20M12 18.4V20M5.5 17.3l1.1-1.1m10.8 0 1.1 1.1" />
    ),
  },
];

function MerchantNav({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-0.5 px-3 py-3">
      {dashboardLinks.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition duration-200 ${
              isActive
                ? "bg-indigo-50 font-medium text-brand shadow-sm"
                : "text-slate-600 hover:translate-x-0.5 hover:bg-slate-50 hover:text-ink"
            }`
          }
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {link.icon}
          </svg>
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default MerchantNav;
