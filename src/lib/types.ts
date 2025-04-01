export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    created_at: string;
    updated_at: string;
}

export interface Item {
    id: string;
    name: string;
    User: string;
    created_at: string;
    updated_at: string;
}

export interface Price {
    id: string;
    item: string;
    price: number;
    created_at: string;
    updated_at?: string;
}

export interface PriceWithStats {
    min: number;
    max: number;
    average: number;
    count: number;
    prices: Price[];
} 