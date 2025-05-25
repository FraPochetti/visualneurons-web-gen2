// pages/upload.tsx
import { useState, useEffect } from "react";
import { uploadData, list, getUrl } from "aws-amplify/storage";
import { fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import Layout from "@/components/Layout";

const client = generateClient<Schema>();

export default function PhotoUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUploadedPhotos();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setFileName(file.name);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    const attributes = await fetchUserAttributes();
    if (!selectedFile) return;
    try {
      setError(null);
      const session = await fetchAuthSession();
      const identityId = session.identityId!;
      const path = `photos/${identityId}/${selectedFile.name}`;
      await uploadData({ path, data: selectedFile });
      setPreviewUrl(null);
      setSelectedFile(null);
      setFileName("");
      setTimeout(fetchUploadedPhotos, 1500);
      await client.models.ImageRecord.create({
        identityId: identityId,
        userSub: attributes.sub,
        userEmail: attributes.email,
        originalImagePath: path,
        source: "uploaded",
      });
    } catch (err: any) {
      setError("Upload failed: " + err.message);
    }
  };

  const fetchUploadedPhotos = async () => {
    try {
      const session = await fetchAuthSession();
      const identityId = session.identityId;
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const { items } = await list({ path: `photos/${identityId}/` });

      // Convert each S3 item to a URL
      const urls = await Promise.all(
        items.map(async (item) => {
          const { url } = await getUrl({ path: item.path });
          return url.toString();
        })
      );

      // Shuffle the array in place (or use .sort(() => 0.5 - Math.random()))
      urls.sort(() => Math.random() - 0.5);

      // Take the first 6
      const randomSix = urls.slice(0, 6);

      setUploadedPhotos(randomSix);
    } catch (err: any) {
      setError("Error listing photos: " + err.message);
    }
  };


  return (
    <Layout>
      <h1 className="container">Upload a Photo</h1>

      {error && (
        <div style={{ margin: "1rem", padding: "1rem", backgroundColor: "#fee", border: "1px solid #fcc", borderRadius: "4px" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="file-input-wrapper">
        <label className="file-input-label">
          Choose File
          <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
        </label>
        <span className="file-name">{fileName || "No file chosen"}</span>

        {previewUrl && (
          <div className="preview-container">
            <h3>Preview</h3>
            <img src={previewUrl} alt="Preview" className="preview-image" />
          </div>
        )}

        <button onClick={handleUpload} disabled={!selectedFile} className="button">
          Upload Photo
        </button>
      </div>
      <h2 className="container">Some of my photos</h2>
      <div className="grid-container">
        {uploadedPhotos.map((photoUrl, index) => (
          <div className="photo-item" key={index}>
            <img src={photoUrl} alt="Uploaded" className="grid-image" />
          </div>
        ))}
      </div>
    </Layout>
  );
}