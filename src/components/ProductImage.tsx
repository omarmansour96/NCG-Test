import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductImageProps {
  src: string;
  alt: string;
  sku?: string;
  className?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  sku,
  className = 'w-full h-full object-contain',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-6 text-center select-none">
        <Package className="w-10 h-10 text-teal-700 mb-2 stroke-[1.75]" />
        <span className="text-xs font-semibold text-slate-700 line-clamp-2 max-w-[180px]">
          {alt}
        </span>
        {sku && (
          <span className="text-[11px] font-mono text-slate-500 mt-1">
            {sku}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
