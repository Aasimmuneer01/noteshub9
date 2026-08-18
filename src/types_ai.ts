export interface AIAssistantConfig {
    id?: string;
    name: string;
    apiKey: string;
    provider: string;
    model: string;
    enabled: boolean;
    description: string;
    createdAt?: any;
}
