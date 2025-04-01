import { useState } from 'react';
import Layout from "@/components/Layout";
import UserPhotos from "@/components/UserPhotos";
import { uploadImage } from "@/utils/uploadImage";
import { getImageAsBase64 } from "@/utils/imageUtils";
import { saveImageRecord } from "@/utils/saveImageRecord";
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import styles from "./ImageChat.module.css";

const client = generateClient<Schema>();

type Message = {
    id: string;
    type: 'user' | 'ai';
    text: string;
    image?: string;
};

export default function ImageChatPage() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        setUploadingImage(true);
        try {
            const file = event.target.files[0];
            const url = await uploadImage(file);
            setSelectedImage(url);
        } catch (error) {
            console.error("Error uploading image:", error);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || !selectedImage) return;
        const userMessage: Message = { id: Date.now().toString(), type: 'user', text: inputText };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setProcessing(true);
        try {
            const imageBase64 = await getImageAsBase64(selectedImage);
            const result = await client.mutations.inpaintImage({
                prompt: inputText,
                imageBase64,
                provider: "gemini",
                operation: "inpaint",
            });
            if (typeof result === 'string') {
                const aiMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    type: 'ai',
                    text: 'Here\'s your edited image:',
                    image: result,
                };
                setMessages(prev => [...prev, aiMessage]);
                setSelectedImage(result);
            } else {
                throw new Error("Invalid response from Gemini");
            }
        } catch (error) {
            console.error("Error processing image:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                text: `Sorry, I couldn't process that request: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setProcessing(false);
        }
    };

    const handleSave = async (imageUrl: string) => {
        try {
            await saveImageRecord({
                imageUrl,
                fileName: `gemini-edit-${Date.now()}.png`,
                source: "edited",
                action: "inpaint",
                providerService: "gemini",
                modelName: "gemini-2.0-flash-exp-image-generation",
            });
        } catch (error) {
            console.error("Error saving edited image:", error);
        }
    };

    return (
        <Layout>
            <div className={styles.container}>
                <h1>Image Chat</h1>
                {!selectedImage ? (
                    <div>
                        <div className={styles.uploadArea}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                                id="image-upload"
                            />
                            <label htmlFor="image-upload">
                                {uploadingImage ? 'Uploading...' : 'Click to upload an image'}
                            </label>
                        </div>
                        <h3>Or select a previous image:</h3>
                        <UserPhotos onSelect={setSelectedImage} />
                    </div>
                ) : (
                    <div className={styles.imageArea}>
                        <img src={selectedImage} alt="Selected" className={styles.selectedImage} />
                        <button onClick={() => setSelectedImage(null)} className={styles.button}>
                            Change Image
                        </button>
                    </div>
                )}
                {selectedImage && (
                    <div className={styles.chatArea}>
                        <div className={styles.messageList}>
                            {messages.map(message => (
                                <div key={message.id} className={styles.message}>
                                    <div className={message.type === 'user' ? styles.userMessage : styles.aiMessage}>
                                        <p>{message.text}</p>
                                        {message.type === 'ai' && message.image && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                                                <img src={message.image} alt="AI response" style={{ maxWidth: '100%', borderRadius: '4px' }} />
                                                <button onClick={() => handleSave(message.image!)} className={styles.button}>
                                                    Save
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className={styles.inputArea}>
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Type a prompt to edit the image..."
                                className={styles.input}
                                disabled={processing}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={processing || !inputText.trim()}
                                className={styles.button}
                            >
                                {processing ? 'Processing...' : 'Send'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}