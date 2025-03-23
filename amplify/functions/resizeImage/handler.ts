import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import sharp from 'sharp';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        // Parse incoming JSON to extract the base64 image string.
        const { imageBase64 } = JSON.parse(event.body || '{}');
        if (!imageBase64) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing 'imageBase64' in request body" }) };
        }

        // Convert base64 to Buffer.
        const inputBuffer = Buffer.from(imageBase64, 'base64');

        // Use sharp to get the image metadata.
        const imageSharp = sharp(inputBuffer);
        const metadata = await imageSharp.metadata();
        if (!metadata.width || !metadata.height) {
            throw new Error("Unable to determine image dimensions.");
        }

        console.log(`Original image size: ${metadata.width} x ${metadata.height}`);

        // Determine new dimensions such that the smallest edge becomes 512px.
        let newWidth = metadata.width;
        let newHeight = metadata.height;
        if (metadata.width <= metadata.height && metadata.width !== 512) {
            newWidth = 512;
            newHeight = Math.round((512 * metadata.height) / metadata.width);
        } else if (metadata.height < metadata.width && metadata.height !== 512) {
            newHeight = 512;
            newWidth = Math.round((512 * metadata.width) / metadata.height);
        }

        console.log(`Resized image size: ${newWidth} x ${newHeight}`);

        // Resize the image.
        const resizedBuffer = await imageSharp
            .resize(newWidth, newHeight)
            .png()  // output as PNG
            .toBuffer();

        // Convert the resized image to a base64 string.
        const resizedBase64 = resizedBuffer.toString('base64');

        return {
            statusCode: 200,
            body: JSON.stringify({ imageBase64: resizedBase64 }),
        };
    } catch (error: any) {
        console.error('Resize error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
