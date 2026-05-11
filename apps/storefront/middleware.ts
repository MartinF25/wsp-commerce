import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match all paths except internals, static files and admin
    "/((?!api|admin|_next/static|_next/image|favicon.ico|images|.*\\..*).*)",
  ],
};
