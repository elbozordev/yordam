import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import './globals.css';
export const metadata: Metadata = { title: 'Yordam — ваш AI SMM-менеджер', description: 'Контент, согласования и сообщения в одном спокойном рабочем пространстве. Интерактивный демо-прототип Yordam.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#ffffff' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="ru"><body>{children}<Toaster position="top-center" richColors /></body></html>; }
