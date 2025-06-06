import './globals.css';
import { Inter } from 'next/font/google';
import Head from 'next/head';
import ThemeToggle from './components/ThemeToggle';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'GitHub Dependency Visualizer',
  description: 'Explore internal file dependencies and contributor networks',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <Head>
        <link rel="stylesheet" href="/output.css" />
      </Head>
      <body className={`${inter.className} bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100`}>
        <div className="min-h-screen flex flex-col">
          <header className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <h1 className="text-xl font-semibold">GitHub Dependency Visualizer</h1>
            <ThemeToggle />
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}