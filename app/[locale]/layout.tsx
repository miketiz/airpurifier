import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return [{ locale: 'th' }, { locale: 'en' }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  let messages;
  try {
    messages = (await import(`../../messages/${params.locale}.json`)).default;
  } catch (error) {
    notFound();
  }

  return (
    <html lang={params.locale}>
      <body>
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}