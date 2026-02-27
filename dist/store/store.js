import { prisma } from "../db/prisma.js";
// ── Selections (timeline, legends, memories, playlists) ──
export async function getSelectedIds(section) {
    const rows = await prisma.selection.findMany({
        where: { section },
        orderBy: { createdAt: "asc" },
        select: { videoId: true },
    });
    return rows.map((r) => r.videoId);
}
export async function saveSelectedIds(section, videoIds) {
    await prisma.$transaction(async (tx) => {
        await tx.selection.deleteMany({ where: { section } });
        if (videoIds.length > 0) {
            await tx.selection.createMany({
                data: videoIds.map((videoId) => ({ section, videoId })),
                skipDuplicates: true,
            });
        }
    });
}
// ── Social Links ──
function mapToSocialLink(row) {
    return {
        id: row.id,
        name: row.name,
        href: row.href,
        platform: row.platform,
    };
}
export async function getSocialLinks() {
    const rows = await prisma.socialLink.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, name: true, href: true, platform: true },
    });
    return rows.map(mapToSocialLink);
}
export async function addSocialLink(item) {
    const id = `soc-${Date.now()}`;
    const created = await prisma.socialLink.create({
        data: {
            id,
            name: item.name,
            href: item.href,
            platform: item.platform,
        },
    });
    return mapToSocialLink(created);
}
export async function updateSocialLink(id, patch) {
    const data = {};
    if (patch.name !== undefined)
        data.name = patch.name;
    if (patch.href !== undefined)
        data.href = patch.href;
    if (patch.platform !== undefined)
        data.platform = patch.platform;
    if (Object.keys(data).length === 0)
        return null;
    const updated = await prisma.socialLink.update({
        where: { id },
        data,
    }).catch(() => null);
    return updated ? mapToSocialLink(updated) : null;
}
export async function deleteSocialLink(id) {
    const result = await prisma.socialLink.deleteMany({ where: { id } });
    return result.count > 0;
}
