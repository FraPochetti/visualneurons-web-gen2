import { useState } from "react";
import { uploadData, list, getUrl } from "aws-amplify/storage";
import { fetchAuthSession } from "aws-amplify/auth";

export default function PhotoUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const session = await fetchAuthSession();
      const identityId = session.identityId;

      console.log("Cognito Identity ID:", identityId); // Debugging

      const path = `photos/${identityId}/${selectedFile.name}`;
      console.log("Uploading to:", path); // Debugging

      await uploadData({
        path,
        data: selectedFile,
      });
      fetchUploadedPhotos();
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
    <main>
      <h1>Upload a Photo</h1>

      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!selectedFile}>
        Upload Photo
      </button>

      <h2>Uploaded Photos</h2>
      <div>
        {uploadedPhotos.map((photoUrl, index) => (
          <img key={index} src={photoUrl} alt="Uploaded" width={200} />
        ))}
      </div>
    </main>
  );
}
