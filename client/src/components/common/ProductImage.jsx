import { useState } from "react";

function ProductImage({ src, alt = "", className = "h-36 w-full" }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-soft text-xs font-medium text-muted ring-1 ring-inset ring-line ${className}`}
      >
        No image
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`rounded-xl object-cover ${className}`}
    />
  );
}

export default ProductImage;
