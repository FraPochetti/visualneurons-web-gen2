import { Schema } from "../../data/resource";
import Replicate from "replicate";
import { promises as fs } from "fs";
import path from "path";

export const handler: Schema["upscaleImage"]["functionHandler"] = async (event) => {
    console.log("=== Starting upscaleImage handler ===");
    console.log("REPLICATE_API_TOKEN exists:", !!process.env.REPLICATE_API_TOKEN);
    console.log("Received event arguments:", JSON.stringify(event.arguments));

    const { imageUrl } = event.arguments;
    if (!imageUrl) {
        console.error("Error: Missing imageUrl in event arguments.");
        throw new Error("Missing imageUrl for upscaling");
    }

    console.log("Initializing Replicate client.");
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    // Your chosen upscaling model
    const model = "philz1337x/clarity-upscaler:dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e";
    console.log("Using upscaling model:", model);

    try {
        console.log("Fetching image data from URL:", imageUrl);
        const response = await fetch(imageUrl);
        console.log("Fetch response status:", response.status);
        if (!response.ok) {
            console.error("Failed to fetch image data. Status:", response.status);
            throw new Error(`Failed to fetch image, status: ${response.status}`);
        }

        console.log("Reading response into arrayBuffer.");
        const arrayBuffer = await response.arrayBuffer();
        console.log("ArrayBuffer length:", arrayBuffer.byteLength);

        const imageBuffer = Buffer.from(arrayBuffer);
        console.log("Image Buffer length:", imageBuffer.length);

        // Write the file to ephemeral storage
        const tmpFilePath = path.join("/tmp", "uploaded.png");
        console.log("Writing image to ephemeral storage at:", tmpFilePath);
        await fs.writeFile(tmpFilePath, imageBuffer);
        console.log("File written to ephemeral storage.");

        // Read the file back from ephemeral storage
        const fileBuffer = await fs.readFile(tmpFilePath);
        console.log("Read file from ephemeral storage, length:", fileBuffer.length);

        console.log("Creating prediction with Replicate using file Buffer.");
        const prediction = await replicate.predictions.create({
            model,
            input: { image: fileBuffer }
        });
        console.log("Prediction created with ID:", prediction.id);

        let completed = null;
        // Poll for the result
        for (let i = 0; i < 15; i++) {
            const latest = await replicate.predictions.get(prediction.id);
            if (latest.status !== "starting" && latest.status !== "processing") {
                completed = latest;
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        if (!completed) {
            throw new Error("Upscale prediction timed out");
        }
        if (completed.status === "failed") {
            throw new Error(`Upscale prediction failed: ${completed.error}`);
        }

        // Handle the output – assuming it's a URL string
        if (typeof completed.output === 'string') {
            return completed.output;
        } else if (Array.isArray(completed.output) && completed.output.length > 0) {
            return completed.output[0];
        } else {
            throw new Error(`Unexpected output format: ${JSON.stringify(completed.output)}`);
        }
    } catch (error) {
        console.error("Replicate upscale API call failed:", error);
        throw error;
    }
};
