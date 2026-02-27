import { prisma } from "./prisma.js";
const DEFAULT_TTL_HOURS = 6;
export async function getCached(key) {
    const row = await prisma.ytCache.findFirst({
        where: {
            cacheKey: key,
            expiresAt: { gt: new Date() },
        },
        select: { data: true },
    });
    if (!row)
        return null;
    return row.data;
}
export async function setCache(key, data, ttlHours = DEFAULT_TTL_HOURS) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
    await prisma.ytCache.upsert({
        where: { cacheKey: key },
        create: { cacheKey: key, data: data, fetchedAt: now, expiresAt },
        update: { data: data, fetchedAt: now, expiresAt },
    });
}
export async function clearCache(keyPattern) {
    if (keyPattern) {
        const result = await prisma.ytCache.deleteMany({
            where: { cacheKey: { contains: keyPattern } },
        });
        return result.count;
    }
    const result = await prisma.ytCache.deleteMany({});
    return result.count;
}
export async function cleanExpiredCache() {
    const result = await prisma.ytCache.deleteMany({
        where: { expiresAt: { lte: new Date() } },
    });
    return result.count;
}
