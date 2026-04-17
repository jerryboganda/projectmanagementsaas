import { forwardRef, type ImgHTMLAttributes } from 'react';

type NextImageProps = {
  src: string | { src: string };
  alt: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  loader?: unknown;
  unoptimized?: boolean;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'width' | 'height'>;

/**
 * next/image shim. Renders a plain <img> because Next's image optimizer
 * does not run inside the mobile bundle. Preserves fill/sizes semantics.
 */
const NextImage = forwardRef<HTMLImageElement, NextImageProps>(function NextImage(
  { src, alt, width, height, fill, priority: _priority, quality: _quality, placeholder: _placeholder, blurDataURL: _blur, sizes: _sizes, loader: _loader, unoptimized: _u, style, ...rest },
  ref,
) {
  const resolvedSrc = typeof src === 'string' ? src : src.src;
  const fillStyle = fill
    ? { position: 'absolute' as const, inset: 0, width: '100%', height: '100%', objectFit: 'cover' as const, ...style }
    : style;
  return (
    <img
      ref={ref}
      src={resolvedSrc}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading="lazy"
      decoding="async"
      style={fillStyle}
      {...rest}
    />
  );
});

export default NextImage;
