import { IAIProvider } from './IAIProvider';
import { ReplicateProvider } from './replicateProvider';
import { StabilityProvider } from './stabilityProvider';

export function createProvider(providerName: string): IAIProvider {
    const providers: Record<string, () => IAIProvider> = {
        replicate: () => new ReplicateProvider(),
        stability: () => new StabilityProvider(),
    };

    const factory = providers[providerName];
    if (!factory) throw new Error(`Provider ${providerName} not supported`);
    return factory();
}