export declare function getCached<T>(key: string): Promise<T | null>;
export declare function setCache<T>(key: string, data: T, ttlHours?: number): Promise<void>;
export declare function clearCache(keyPattern?: string): Promise<number>;
export declare function cleanExpiredCache(): Promise<number>;
