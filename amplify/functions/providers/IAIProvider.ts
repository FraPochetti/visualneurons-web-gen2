// amplify/functions/providers/IAIProvider.ts
export type AIOperation = 'generateImage' | 'upscaleImage' | 'inpaint' | 'outpaint' | 'recolor';
export interface IAIProvider {
    generateImage(prompt: string, promptUpsampling?: boolean): Promise<string>;
    upscaleImage(imageUrl: string): Promise<string>;
    // Later you can add inpaint, outpaint, etc.
}
