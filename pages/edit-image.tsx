// pages/edit-image.tsx
import dynamic from "next/dynamic";

const EditImagePage = dynamic(() => import("./edit-image-actual"), {
    ssr: false,
});

export default EditImagePage;
