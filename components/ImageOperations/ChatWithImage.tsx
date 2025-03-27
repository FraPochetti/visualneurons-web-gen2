// components/ImageOperations/ChatWithImage.tsx
import { useState } from 'react';
import styles from "./ChatWithImage.module.css";
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { HistoryItem } from '@/amplify/functions/providers/IAIProvider';

interface ChatWithImageProps {
    provider: string;
    imageUrl: string;
    onSuccess?: (result: {
        text: string | null;
        image: string | null;
    }) => void;
}

interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    image?: string;
}

interface ChatResponse {
    text: string | null;
    image: string | null;
}

export default function ChatWithImage({ provider, imageUrl, onSuccess }: ChatWithImageProps) {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const client = generateClient<Schema>();

    const handleSubmit = async () => {
        if (!prompt.trim() || loading) return;

        setLoading(true);
        setError(null);

        // Add user message to chat
        const userMessage: ChatMessage = {
            role: 'user',
            content: prompt,
            image: messages.length === 0 ? imageUrl : undefined // Only include image with first message
        };

        setMessages(prev => [...prev, userMessage]);

        try {
            // Convert our chat messages to the format expected by the API
            const history: HistoryItem[] = messages.map(msg => ({
                role: msg.role,
                parts: [
                    ...(msg.content ? [{ text: msg.content }] : []),
                    ...(msg.image ? [{ image: msg.image }] : [])
                ]
            }));

            // Call the API - always pass imageUrl, but only add it to history if it's the first message
            const result = await client.mutations.chatWithImage({
                prompt,
                imageUrl: imageUrl,
                history: history.length > 0 ? history : undefined,
                provider,
                operation: "chatWithImage"
            });

            if (result.errors && result.errors.length > 0) {
                throw new Error(result.errors[0].message);
            }

            // Cast the result.data to our expected type
            const responseData = result.data as unknown as ChatResponse;

            if (responseData) {
                // Add AI response to chat
                const aiMessage: ChatMessage = {
                    role: 'model',
                    content: responseData.text || 'No response text.',
                    image: responseData.image || undefined
                };

                setMessages(prev => [...prev, aiMessage]);

                if (onSuccess) {
                    onSuccess(responseData);
                }
            }
        } catch (err: any) {
            console.error("Chat error:", err);
            setError(err.message || "An error occurred during chat.");
        } finally {
            setLoading(false);
            setPrompt(''); // Clear input after sending
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.chatArea}>
                {messages.length === 0 ? (
                    <div className={styles.emptyChat}>
                        <p>Start chatting with the AI about this image.</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.aiMessage}`}
                        >
                            <div className={styles.messageHeader}>
                                {msg.role === 'user' ? 'You' : 'AI'}
                            </div>
                            <div className={styles.messageContent}>
                                {msg.content}
                                {msg.image && (
                                    <img src={msg.image} alt="Image" className={styles.messageImage} />
                                )}
                            </div>
                        </div>
                    ))
                )}
                {error && <div className={styles.errorMessage}>Error: {error}</div>}
            </div>

            <div className={styles.inputArea}>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask about the image..."
                    className={styles.textarea}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                />
                <button
                    onClick={handleSubmit}
                    disabled={loading || !prompt.trim()}
                    className="button"
                >
                    {loading ? <span className="spinner" /> : "Send"}
                </button>
            </div>
        </div>
    );
}