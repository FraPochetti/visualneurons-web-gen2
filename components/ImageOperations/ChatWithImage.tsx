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
        if (!prompt.trim() || loading) {
            console.log('ChatWithImage: Empty prompt or already loading, skipping submission');
            return;
        }

        console.log('ChatWithImage: Handling chat submission');
        setLoading(true);
        setError(null);

        // Add user message to chat
        const userMessage: ChatMessage = {
            role: 'user',
            content: prompt,
            image: messages.length === 0 ? imageUrl : undefined // Only include image with first message (for display)
        };

        setMessages(prev => [...prev, userMessage]);

        try {
            // Convert our chat messages to the format expected by the API
            const history: HistoryItem[] = messages.map(msg => ({
                role: msg.role,
                parts: [
                    ...(msg.content ? [{ text: msg.content }] : []),
                    // Don't include image in history - the backend will handle the first image separately
                ]
            }));

            console.log(`ChatWithImage: Sending request to API. Provider: ${provider}, Prompt length: ${prompt.length}`);

            // Send direct imageUrl to backend - conversion happens there
            const result = await client.mutations.chatWithImage({
                prompt,
                imageUrl, // Pass original image URL directly
                history: history.length > 0 ? history : undefined,
                provider,
                operation: "chatWithImage"
            });

            if (result.errors && result.errors.length > 0) {
                const errorMessage = result.errors[0].message;
                console.error(`ChatWithImage: API returned error: ${errorMessage}`);
                throw new Error(errorMessage);
            }

            console.log('ChatWithImage: Received successful response from API');

            // Cast the result.data to our expected type
            const responseData = result.data as unknown as ChatResponse;

            if (responseData) {
                console.log(`ChatWithImage: Processing response. Has text: ${!!responseData.text}, Has image: ${!!responseData.image}`);

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
            } else {
                console.warn('ChatWithImage: Response data was empty or malformed');
                throw new Error('Received empty or invalid response from the AI service');
            }
        } catch (err: any) {
            console.error("ChatWithImage: Error during chat:", err);
            setError(err.message || "An error occurred during chat.");
        } finally {
            setLoading(false);
            setPrompt(''); // Clear input after sending
            console.log('ChatWithImage: Request completed, loading state reset');
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
                            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                                {msg.role === 'user' ? 'You' : 'AI'}
                            </div>
                            {msg.image && (
                                <img
                                    src={msg.image}
                                    alt="Message"
                                    className={styles.messageImage}
                                />
                            )}
                            {/* Then the text content */}
                            {msg.content}
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