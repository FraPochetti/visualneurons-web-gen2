// amplify/functions/providers/providerFactory.ts
import { IAIProvider } from './IAIProvider';
import { ReplicateProvider } from './replicateProvider';
import { StabilityProvider } from './stabilityProvider';
import { GeminiProvider } from './geminiProvider';
import { RunwayProvider } from './runwayProvider';

export function createProvider(providerName: string): IAIProvider {
    const providers: Record<string, () => IAIProvider> = {
        replicate: () => new ReplicateProvider(),
        stability: () => new StabilityProvider(),
        gemini: () => new GeminiProvider(),
        runway: () => new RunwayProvider(),
    };

    const factory = providers[providerName];
    if (!factory) throw new Error(`Provider ${providerName} not supported`);
    return factory();
}
