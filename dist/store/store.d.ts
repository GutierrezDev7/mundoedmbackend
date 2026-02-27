import type { SocialLink } from "../types.js";
export declare function getSelectedIds(section: string): Promise<string[]>;
export declare function saveSelectedIds(section: string, videoIds: string[]): Promise<void>;
export declare function getSocialLinks(): Promise<SocialLink[]>;
export declare function addSocialLink(item: Omit<SocialLink, "id">): Promise<SocialLink>;
export declare function updateSocialLink(id: string, patch: Partial<SocialLink>): Promise<SocialLink | null>;
export declare function deleteSocialLink(id: string): Promise<boolean>;
