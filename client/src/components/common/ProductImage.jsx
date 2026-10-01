import { useEffect, useState } from "react";

function ProductImage({ src, alt = "", className = "h-36 w-full" }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-soft text-xs font-medium text-muted ring-1 ring-inset ring-line ${className}`}
      >
        {alt ? alt.slice(0, 1).toUpperCase() : "No image"}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`rounded-xl object-cover ${className}`}
    />
  );
}

export default ProductImage;
