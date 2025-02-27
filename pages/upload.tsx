// pages/upload.tsx
import { useState, useEffect } from "react";
import { uploadData, list, getUrl } from "aws-amplify/storage";
import { fetchAuthSession, fetchUserAttributes, signOut } from "aws-amplify/auth";
import Link from "next/link";
import Layout from "@/components/Layout";

export default function PhotoUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");

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
    if (!selectedFile) return;
    try {
      const session = await fetchAuthSession();
      const identityId = session.identityId;
      const path = `photos/${identityId}/${selectedFile.name}`;
      await uploadData({ path, data: selectedFile });
      setPreviewUrl(null);
      setSelectedFile(null);
      setFileName("");
      setTimeout(fetchUploadedPhotos, 1500);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const fetchUploadedPhotos = async () => {
    try {
      const session = await fetchAuthSession();
      const identityId = session.identityId;
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const { items } = await list({ path: `photos/${identityId}/` });
      const urls = await Promise.all(
        items.map(async (item) => {
          const { url } = await getUrl({ path: item.path });
          return url.toString();
        })
      );
      setUploadedPhotos(urls);
    } catch (error) {
      console.error("Error listing photos:", error);
    }
  };

  return (
    <Layout>
      <nav style={{ marginBottom: "20px" }}>
        <Link href="/dashboard">← Back to Dashboard</Link>
      </nav>
      <h1 className="container">Upload a Photo</h1>
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
      <h2 className="container">Uploaded Photos</h2>
      <div className="grid-container">
        {uploadedPhotos.map((photoUrl, index) => (
          <img key={index} src={photoUrl} alt="Uploaded" className="grid-image" />
        ))}
      </div>
    </Layout>
  );
}