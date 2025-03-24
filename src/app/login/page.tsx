'use client';

import ClientProvider from '@/components/ClientProvider';
import LoginPage from '@/components/LoginPage';

export default function Login() {
  return (
    <ClientProvider>
      <LoginPage />
    </ClientProvider>
  );
}
