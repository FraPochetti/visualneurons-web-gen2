// amplify/functions/providers/IAIProvider.ts
export interface IAIProvider {
    generateImage(prompt: string, promptUpsampling?: boolean): Promise<string>;
    upscaleImage(imageUrl: string): Promise<string>;
    // Later you can add inpaint, outpaint, etc.
}
