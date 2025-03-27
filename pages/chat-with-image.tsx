// pages/chat-with-image.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from "@/components/Layout";
import ProviderSelector from "@/components/ProviderSelector";
import ChatWithImage from "@/components/ImageOperations/ChatWithImage";
import Link from 'next/link';

export default function ChatWithImagePage() {
    const router = useRouter();
    const { imageUrl } = router.query;
    const [provider, setProvider] = useState("gemini"); // Default to gemini

    // Validate imageUrl
    const validImageUrl = typeof imageUrl === 'string' ? imageUrl : '';

    return (
        <Layout>
            <h1>Chat with Image</h1>
            <ProviderSelector
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                allowedProviders={["gemini"]}
            />

            {validImageUrl ? (
                <>
                    <div style={{ margin: '1rem 0', textAlign: 'center' }}>
                        <img
                            src={validImageUrl}
                            alt="Selected"
                            style={{ maxWidth: '400px', maxHeight: '400px', borderRadius: '8px' }}
                        />
                    </div>
                    <ChatWithImage
                        provider={provider}
                        imageUrl={validImageUrl}
                    />
                </>
            ) : (
                <div style={{ textAlign: 'center', margin: '2rem' }}>
                    <p>No image selected. Please select an image first.</p>
                    <Link href="/dashboard" className="button" style={{ display: 'inline-block', marginTop: '1rem' }}>
                        Go to Dashboard
                    </Link>
                </div>
            )}
        </Layout>
    );
}