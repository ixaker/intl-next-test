import {NextRequest} from 'next/server';
import {withAuth} from 'next-auth/middleware';
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

const publicPages = [
  '/',
  '/login'
  // (/secret requires auth)
];

const intlMiddleware = createMiddleware(routing);

const authMiddleware = withAuth(
  // Note that this callback is only invoked if
  // the `authorized` callback has returned `true`
  // and not for pages listed in `pages`.
  (req) => intlMiddleware(req),
  {
    callbacks: {
      authorized: ({token}) => token != null
    },
    pages: {
      signIn: '/login'
    }
  }
);

export default function middleware(req: NextRequest) {
  const publicPathnameRegex = RegExp(
    `^(/(${routing.locales.join('|')}))?(${publicPages
      .flatMap((p) => (p === '/' ? ['', '/'] : p))
      .join('|')})/?$`,
    'i'
  );
  const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname);

  if (isPublicPage) {
    console.log('сработал: intlMiddleware', req.headers.get('origin'));
    const newReq = intlMiddleware(req);
    console.log('newReq', newReq.url);

    return newReq;
  } else {
    console.log('сработал: authMiddleware', req.headers.get('origin'));
    const newReq = (authMiddleware as any)(req);

    console.log('newReq', newReq.url);

    return newReq;
  }
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)']
};
