import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { Link as RouterLink, type LinkProps as RouterLinkProps } from 'react-router-dom';

type NextLinkProps = {
  href: string;
  children?: ReactNode;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean;
  shallow?: boolean;
  passHref?: boolean;
  locale?: string | false;
  legacyBehavior?: boolean;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;

/**
 * next/link shim for the Capacitor/Vite mobile bundle.
 * Maps Next.js Link API onto react-router-dom Link so every shared
 * component that imports `next/link` works unchanged on mobile.
 */
const NextLink = forwardRef<HTMLAnchorElement, NextLinkProps>(function NextLink(
  { href, replace, children, prefetch: _prefetch, scroll: _scroll, shallow: _shallow, passHref: _passHref, locale: _locale, legacyBehavior: _legacy, ...rest },
  ref,
) {
  const to: RouterLinkProps['to'] = href ?? '#';
  return (
    <RouterLink ref={ref} to={to} replace={replace} {...rest}>
      {children}
    </RouterLink>
  );
});

export default NextLink;
