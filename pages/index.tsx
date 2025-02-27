// pages/index.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthenticator } from '@aws-amplify/ui-react';

export default function Home() {
    const router = useRouter();
    const { authStatus } = useAuthenticator((context) => [context.authStatus]);

    useEffect(() => {
        if (authStatus === 'authenticated') {
            router.push('/dashboard');
        }
    }, [authStatus, router]);

    return <p>Loading...</p>;
}
