import './globals.css'

export const metadata = {
  title: 'Smart Bookmarks',
  description: 'Your personal bookmark manager',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0a0a0a] text-[#e8e8e0] min-h-screen font-mono antialiased">
        {children}
      </body>
    </html>
  )
}
