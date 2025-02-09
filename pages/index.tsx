import { useState } from "react";
import { uploadData, list, getUrl } from "aws-amplify/storage";
import { fetchAuthSession } from "aws-amplify/auth";

export default function PhotoUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setFileName(file.name);

      // Create a preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const session = await fetchAuthSession();
      const identityId = session.identityId;
      const path = `photos/${identityId}/${selectedFile.name}`;

      // Optimistically update UI with preview URL
      const localPreviewUrl = URL.createObjectURL(selectedFile);
      setUploadedPhotos((prev) => [localPreviewUrl, ...prev]);

      await uploadData({
        path,
        data: selectedFile,
      });

      // Cleanup preview
      URL.revokeObjectURL(previewUrl!);
      setPreviewUrl(null);
      setSelectedFile(null);
      setFileName("");

      // Fetch latest images from S3 after upload
      setTimeout(fetchUploadedPhotos, 1500); // Delay to allow S3 sync
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };


  const fetchUploadedPhotos = async () => {
    try {
      const session = await fetchAuthSession();
      const identityId = session.identityId;
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
    <main style={{ textAlign: "center", padding: "20px" }}>
      <h1>Upload a Photo</h1>

      {/* Modern file input */}
      <label
        style={{
          display: "inline-block",
          padding: "10px 15px",
          backgroundColor: "#000",
          color: "#fff",
          borderRadius: "5px",
          cursor: "pointer",
          fontWeight: "bold",
          marginRight: "10px"
        }}
      >
        Choose File
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </label>
      <span style={{ fontSize: "16px", fontWeight: "bold", color: "#555" }}>
        {fileName || "No file chosen"}
      </span>

      {previewUrl && (
        <div style={{ margin: "20px 0" }}>
          <h3>Preview</h3>
          <img
            src={previewUrl}
            alt="Preview"
            style={{
              width: "200px",
              height: "200px",
              objectFit: "cover",
              borderRadius: "10px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.2)"
            }}
          />
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile}
        style={{
          padding: "10px 20px",
          backgroundColor: "#000",
          color: "#fff",
          borderRadius: "5px",
          cursor: "pointer",
          fontWeight: "bold",
          border: "none",
          marginTop: "10px"
        }}
      >
        Upload Photo
      </button>

      <h2>Uploaded Photos</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)", // Default to 2 columns
          gap: "15px",
          justifyContent: "center",
          marginTop: "20px",
        }}
      >
        {uploadedPhotos.map((photoUrl, index) => (
          <img
            key={index}
            src={photoUrl}
            alt="Uploaded"
            style={{
              width: "100%",
              height: "200px",
              objectFit: "cover",
              borderRadius: "10px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
            }}
          />
        ))}
      </div>

      <style>
        {`
    @media (max-width: 600px) {
      div[style*="grid-template-columns"] {
        grid-template-columns: repeat(1, 1fr) !important;
      }
    }
  `}
      </style>

    </main>
  );
}
