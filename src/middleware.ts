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

export default function middleware(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

  const fixedUrl = request.nextUrl.clone();

  // Заменим 127.0.0.1 или localhost на домен
  const fixedHost = baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  fixedUrl.host = fixedHost;
  fixedUrl.hostname = fixedHost;

  // Создаём "новый" запрос с правильным URL
  const fixedRequest = new NextRequest(fixedUrl, {
    headers: request.headers,
    method: request.method,
    body: request.body,
    duplex: 'half'
  });

  const publicPathnameRegex = RegExp(
    `^(/(${routing.locales.join('|')}))?(${publicPages
      .flatMap((p) => (p === '/' ? ['', '/'] : p))
      .join('|')})/?$`,
    'i'
  );

  console.log('originalRequest', request);

  console.log('fixedRequest', fixedRequest);

  const isPublicPage = publicPathnameRegex.test(fixedRequest.nextUrl.pathname);

  if (isPublicPage) {
    // console.log('сработал: intlMiddleware', req);
    const newReq = intlMiddleware(fixedRequest);
    // console.log('newReq', newReq);

    return newReq;
  } else {
    // console.log('сработал: authMiddleware', req.headers.get('origin'));
    const newReq = (authMiddleware as any)(fixedRequest);

    // console.log('newReq', newReq.url);

    return newReq;
  }
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)']
};
