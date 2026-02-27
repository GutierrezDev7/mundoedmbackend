import { prisma } from "./prisma.js";
export async function initDatabase() {
    const socialCount = await prisma.socialLink.count();
    if (socialCount === 0) {
        await prisma.socialLink.createMany({
            data: [
                { id: "soc-1", name: "Instagram", href: "https://www.instagram.com/mundoedmoficial/", platform: "instagram", sortOrder: 1 },
                { id: "soc-2", name: "TikTok", href: "https://www.tiktok.com/@mundoedm", platform: "tiktok", sortOrder: 2 },
                { id: "soc-3", name: "YouTube", href: "https://www.youtube.com/@mundoedmoficial", platform: "youtube", sortOrder: 3 },
                { id: "soc-4", name: "WhatsApp", href: "https://wa.me/?text=Oi!%20Quero%20fazer%20parte%20do%20Mundo%20EDM.", platform: "whatsapp", sortOrder: 4 },
            ],
            skipDuplicates: true,
        });
        console.log("Default social links seeded");
    }
    const userCount = await prisma.adminUser.count();
    if (userCount === 0) {
        const bcrypt = await import("bcryptjs");
        const passwordHash = await bcrypt.hash("04021991", 10);
        await prisma.adminUser.create({
            data: { username: "mundoedm", passwordHash },
        });
        console.log("Admin user seeded (mundoedm)");
    }
}
