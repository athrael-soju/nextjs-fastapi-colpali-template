import type React from "react"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import NextTopLoader from 'nextjs-toploader'
import "./globals.css"

export const metadata: Metadata = {
  title: "ColPali Dashboard",
  description: "Document Search Platform",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NextTopLoader
          color="#f97316"
          showSpinner={false}
          height={3}
          shadow="0 0 10px #f97316,0 0 5px #f97316"
          speed={200}
          zIndex={9999}
        />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
