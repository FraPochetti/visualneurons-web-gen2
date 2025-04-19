// pages/generate-video.tsx
import { useState } from 'react';
import Layout from '@/components/Layout';
import UserPhotos from '@/components/UserPhotos';
import { uploadImage } from '@/utils/uploadImage';
import VideoGenerator from '@/components/VideoGenerator';
import styles from './GenerateVideo.module.css';

export default function GenerateVideoPage() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Called when a new image is chosen (upload or from gallery)
    const startWithImage = (url: string) => {
        setSelectedImage(url);
    };

    // Handle file upload
    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        try {
            const file = e.target.files[0];
            const url = await uploadImage(file);
            startWithImage(url);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Layout>
            <h1>Generate Video</h1>

            {!selectedImage ? (
                <>
                    <div className={styles.uploadArea}>
                        <input
                            id="video-image-upload"
                            type="file"
                            accept="image/*"
                            onChange={onFileChange}
                            style={{ display: 'none' }}
                        />
                        <label htmlFor="video-image-upload">
                            {uploading ? 'Uploading…' : 'Click to upload an image'}
                        </label>
                    </div>

                    <h3>Or select a previous image:</h3>
                    <UserPhotos onSelect={startWithImage} />
                </>
            ) : (
                <>
                    {/* Preview the chosen image and allow changing it */}
                    <div className={styles.imagePreview}>
                        <img
                            src={selectedImage}
                            alt="Selected for video"
                            className={styles.selectedImage}
                        />
                        <button
                            className="button"
                            onClick={() => setSelectedImage(null)}
                            style={{ marginTop: '0.5rem' }}
                        >
                            Choose a different image
                        </button>
                    </div>

                    {/* Now render the video form with the image seeded */}
                    <VideoGenerator initialPromptImage={selectedImage} />
                </>
            )}
        </Layout>
    );
}
