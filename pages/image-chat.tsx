import { useState } from 'react';
import Layout from "@/components/Layout";
import UserPhotos from "@/components/UserPhotos";
import { uploadImage } from "@/utils/uploadImage";
import { saveImageRecord } from "@/utils/saveImageRecord";
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import styles from "./ImageChat.module.css";

const client = generateClient<Schema>();

type Message = {
    id: string;
    type: 'original' | 'user' | 'ai';
    text: string;
    image?: string;
};

export default function ImageChatPage() {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [processing, setProcessing] = useState(false);

    // 1) Called when user picks a brand-new image (upload or from gallery).
    //    Resets chat and sets the original image.
    const startNewChat = (imageUrl: string) => {
        setMessages([
            {
                id: `original-${Date.now()}`,
                type: 'original',
                text: 'Original Image',
                image: imageUrl,
            },
        ]);
        setOriginalImage(imageUrl);
        setSelectedImage(imageUrl);
    };

    // 2) Handle direct file upload
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        setUploadingImage(true);
        try {
            const file = event.target.files[0];
            const url = await uploadImage(file);
            startNewChat(url);
        } catch (error) {
            console.error("Error uploading image:", error);
        } finally {
            setUploadingImage(false);
        }
    };

    // 3) Handle user selecting an existing photo
    const handleSelectExistingImage = (url: string) => {
        startNewChat(url);
    };

    // 4) Send user prompt -> call Gemini inpaint -> append new AI message
    const handleSendMessage = async () => {
        if (!inputText.trim() || !selectedImage) return;

        // Insert user prompt (latest at top)
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            type: 'user',
            text: inputText,
        };
        setMessages((prev) => [userMessage, ...prev]);
        setInputText('');
        setProcessing(true);

        try {
            // Call your AI inpainting function
            const output = await client.mutations.inpaintImage({
                prompt: inputText,
                imageUrl: selectedImage,
                provider: "gemini",
                operation: "inpaint",
            });

            if (typeof output.data === 'string') {
                const aiMessage: Message = {
                    id: `ai-${Date.now()}`,
                    type: 'ai',
                    text: "Here's your edited image:",
                    image: output.data,
                };
                // Insert AI message at top
                setMessages((prev) => [aiMessage, ...prev]);
                // Update the big display to the new edited image
                setSelectedImage(output.data);
            } else {
                throw new Error("Invalid response from Gemini");
            }
        } catch (error) {
            console.error("Error processing image:", error);
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                type: 'ai',
                text: `Sorry, I couldn't process that request: ${error instanceof Error ? error.message : 'Unknown error'
                    }`,
            };
            setMessages((prev) => [errorMessage, ...prev]);
        } finally {
            setProcessing(false);
        }
    };

    // 5) Save the currently displayed image to your backend
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
            alert("File saved successfully.");
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
                        {/* Upload from local */}
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

                        {/* Or pick from your existing user photos */}
                        <h3>Or select a previous image:</h3>
                        <UserPhotos onSelect={handleSelectExistingImage} />
                    </div>
                ) : (
                    <div className={styles.imageArea}>
                        {/* Show the currently selected/edited image at the top */}
                        <img
                            src={selectedImage}
                            alt="Selected"
                            className={styles.selectedImage}
                        />
                        {/* Optionally revert to original if you want that functionality */}
                        <button
                            onClick={() => setSelectedImage(originalImage)}
                            className={styles.button}
                            disabled={!originalImage}
                        >
                            Revert to Original
                        </button>
                    </div>
                )}

                {selectedImage && (
                    <div className={styles.chatArea}>
                        <div className={styles.messageList}>
                            {messages.map((message) => (
                                <div key={message.id} className={styles.message}>
                                    <div
                                        className={
                                            message.type === 'user'
                                                ? styles.userMessage
                                                : styles.aiMessage
                                        }
                                    >
                                        <p>{message.text}</p>
                                        {message.image && (
                                            <div className={styles.aiMessageImageContainer}>
                                                <img
                                                    src={message.image}
                                                    alt={
                                                        message.type === 'original'
                                                            ? 'Original'
                                                            : 'AI response'
                                                    }
                                                    className={styles.aiMessageImage}
                                                />
                                                {/* Hide the "Save" button for the original image message */}
                                                {message.type === 'ai' && (
                                                    <button
                                                        onClick={() => handleSave(message.image!)}
                                                        className={styles.button}
                                                    >
                                                        Save
                                                    </button>
                                                )}
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
