'use client';
import Header from '../components/Header';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif', margin: 0, padding: 20, background: '#fafafa' }}>
        <Header />
        {children}
      </body>
    </html>
  );
}


