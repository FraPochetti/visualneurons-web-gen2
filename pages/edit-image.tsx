// pages/edit-image.tsx
import { useRouter } from "next/router";
import Layout from "@/components/Layout";

export default function EditImagePage() {
    const router = useRouter();
    // Pull out the `url` param from the query string
    const { url } = router.query;

    if (!url || typeof url !== "string") {
        return (
            <Layout>
                <p>No image URL provided.</p>
            </Layout>
        );
    }

    return (
        <Layout>
            <h1>Image Editor</h1>
            <div style={{ maxWidth: "600px", margin: "20px auto" }}>
                <img
                    src={url}
                    alt="Selected"
                    style={{ maxWidth: "100%", borderRadius: "8px" }}
                />
            </div>
            {/* Future AI-editing features will go here */}
        </Layout>
    );
}
