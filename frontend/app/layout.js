import './globals.css'

export const metadata = {
  title: 'Global Energy Dashboard',
  description: 'A comprehensive dashboard for global energy data',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  )
} 