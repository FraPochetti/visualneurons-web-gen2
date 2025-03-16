// New file: providerFactory.ts
import { IAIProvider } from './IAIProvider';
import { ReplicateProvider } from './replicateProvider';
import { StabilityProvider } from './stabilityProvider';
import { ClipDropProvider } from './clipdropProvider';

export function createProvider(providerName: string): IAIProvider {
    const providers: Record<string, () => IAIProvider> = {
        replicate: () => new ReplicateProvider(),
        stability: () => new StabilityProvider(),
        clipdrop: () => new ClipDropProvider(),
    };

    const factory = providers[providerName];
    if (!factory) throw new Error(`Provider ${providerName} not supported`);
    return factory();
}