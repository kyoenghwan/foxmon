export interface AdItem {
    id: string;
    company: string;
    title: string;
    location: string;
    pay: string;
    image?: string;
    color?: string;
    time?: string;
    is_big: boolean;
    tier: 'PREMIUM' | 'SPECIAL' | 'GENERAL';
    weight: number;
    exposure_count: number;
    last_exposed_at: string;
    created_at?: string;
}
