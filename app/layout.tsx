
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  verification: {
    google: "s_2M2MKkkIk8sFnEI9angdfTvyCe2qTxl9a5VTt6JqA"
  },
  metadataBase: new URL('https://mreademz.vercel.app'), 
  title: {
    default: 'MdReademz - AI-Powered README Generator | Create Professional README Files',
    template: '%s | MdReademz'
  },
  description: 'Generate professional, comprehensive README.md files for your GitHub projects in seconds using AI. MdReademz creates beautiful, well-structured documentation with installation guides, usage examples, and more.',
  keywords: [
    'README generator',
    'AI README creator',
    'GitHub README',
    'markdown generator',
    'documentation generator',
    'project documentation',
    'README.md creator',
    'automatic documentation',
    'GitHub documentation',
    'open source documentation',
    'README template',
    'markdown documentation'
  ],
  authors: [{ name: 'MdReademz' }],
  creator: 'MdReademz',
  publisher: 'MdReademz',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://mdreademz.vercel.app',
    siteName: 'MdReademz',
    title: 'MdReademz - AI-Powered README Generator',
    description: 'Generate professional README.md files for your GitHub projects in seconds using AI. Create beautiful, well-structured documentation effortlessly.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'MdReademz - AI README Generator',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MdReademz - AI-Powered README Generator',
    description: 'Generate professional README.md files for your GitHub projects in seconds using AI.',
    images: ['/logo.png'],
    creator: '@mdreademz', 
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        
        <link rel="icon" href="/logo.png" type="image/png"></link>
        <link rel="canonical" href="https://mdreademz.vercel.app" />
        <meta name="theme-color" content="#000000" />
        
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "MdReademz",
              "description": "AI-powered README generator for GitHub projects",
              "url": "https://mdreademz.vercel.app",
              "applicationCategory": "DeveloperApplication",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "operatingSystem": "Any",
              "browserRequirements": "Requires JavaScript. Requires HTML5.",
              "softwareVersion": "1.0",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5",
                "ratingCount": "1"
              }
            })
          }}
        />
        
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is MdReademz?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "MdReademz is an AI-powered tool that automatically generates professional README.md files for your GitHub projects. It creates comprehensive documentation including installation guides, usage examples, and project descriptions."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How does MdReademz generate README files?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "MdReademz uses advanced AI to analyze your project details and generate a well-structured, professional README.md file. Simply provide information about your project, and the AI creates comprehensive documentation automatically."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is MdReademz free to use?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, MdReademz is free to use for generating README files for your projects."
                  }
                }
              ]
            })
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}