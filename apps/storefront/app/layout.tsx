// Root layout – kein HTML-Gerüst, nur next-intl-kompatibel.
// Das eigentliche HTML-Layout sitzt in app/[locale]/layout.tsx.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
