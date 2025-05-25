// amplify/functions/providers/providerFactory.ts
import { IAIProvider } from './IAIProvider';
import { ReplicateProvider } from './replicateProvider';
import { StabilityProvider } from './stabilityProvider';
import { GeminiProvider } from './geminiProvider';

export function createProvider(providerName: string): IAIProvider {
    const providers: Record<string, () => IAIProvider> = {
        replicate: () => new ReplicateProvider(),
        stability: () => new StabilityProvider(),
        gemini: () => new GeminiProvider(),
    };

    const factory = providers[providerName];
    if (!factory) throw new Error(`Provider ${providerName} not supported`);
    return factory();
}
