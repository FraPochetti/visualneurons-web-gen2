import { useState, useEffect } from "react";
import { uploadData, list, getUrl } from "aws-amplify/storage";
import { fetchAuthSession, getCurrentUser, signOut, fetchUserAttributes } from "aws-amplify/auth";
import { CSSProperties } from "react";
import Link from "next/link";

export default function PhotoUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
    fetchUploadedPhotos();
  }, []);

  const fetchUserData = async () => {
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      setUserEmail(attributes.email || "User");
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.reload(); // Refresh the page to reflect logout
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

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

      // Upload file to S3
      await uploadData({ path, data: selectedFile });

      // Cleanup file input
      setPreviewUrl(null);
      setSelectedFile(null);
      setFileName("");

      // Wait 1.5s to ensure S3 has processed the file, then fetch updated images
      setTimeout(fetchUploadedPhotos, 1500);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const fetchUploadedPhotos = async () => {
    try {
      const session = await fetchAuthSession();
      const identityId = session.identityId;

      // Delay fetching to ensure S3 upload completion
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
    <main style={styles.container}>
      <div style={{
        padding: "1rem",
        maxWidth: "900px",
        margin: "0 auto",
        width: "100%"
      }}>
        {/* Header with user info */}
        <header style={styles.header}>
          <h1 style={styles.title}>Upload a Photo</h1>
          {userEmail && (
            <div style={styles.userSection}>
              <span style={styles.userText}>Hi, {userEmail}</span>
              <button onClick={handleLogout} style={styles.logoutButton}>
                🚪 Logout
              </button>
            </div>
          )}
        </header>
        <div style={styles.fileInputWrapper}>

          {/* Add a link to /images */}
          <nav style={{ marginTop: "20px" }}>
            <Link href="/images">
              Go to My Images
            </Link>
          </nav>

          {/* File Input */}
          <label style={styles.fileInputLabel}>
            Choose File
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
          </label>
          <span style={styles.fileName}>{fileName || "No file chosen"}</span>

          {previewUrl && (
            <div style={styles.previewContainer}>
              <h3>Preview</h3>
              <img src={previewUrl} alt="Preview" style={styles.previewImage} />
            </div>
          )}

          <button onClick={handleUpload} disabled={!selectedFile} className="button">
            Upload Photo
          </button>
        </div>
        <h2>Uploaded Photos</h2>
        <div style={styles.gridContainer}>
          {uploadedPhotos.map((photoUrl, index) => (
            <img key={index} src={photoUrl} alt="Uploaded" style={styles.gridImage} />
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
      </div>
    </main>
  );
}

const styles: { [key: string]: CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "20px",
    minHeight: "100vh"
  },
  fileInputWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    gap: "10px"
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    background: "rgba(0, 0, 0, 0.7)",
    color: "#fff",
    padding: "10px",
    gap: "15px"
  },
  title: { margin: 0, fontSize: "24px" },
  userSection: { display: "flex", alignItems: "center", gap: "10px" },
  logoutButton: {
    padding: "5px 10px",
    backgroundColor: "#ff4d4d",
    color: "#fff",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    border: "none",
  },
  fileInputLabel: {
    display: "inline-block",
    padding: "10px 15px",
    backgroundColor: "#000",
    color: "#fff",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    marginRight: "10px",
    marginTop: "50px",
  },
  fileName: { fontSize: "16px", fontWeight: "bold", color: "#555" },
  previewContainer: { margin: "20px 0" },
  previewImage: {
    width: "200px",
    height: "200px",
    objectFit: "cover" as "cover", // Fix TypeScript error here
    borderRadius: "10px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
    justifyContent: "center",
    alignItems: "center",
    maxWidth: "600px",
    margin: "20px auto",
  },
  gridImage: {
    width: "100%",
    height: "200px",
    objectFit: "cover" as "cover", // Fix TypeScript error here
    borderRadius: "10px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
  },
};
