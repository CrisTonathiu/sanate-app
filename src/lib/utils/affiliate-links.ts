import type {AffiliateLink} from '@/components/widgets/profile-details/AffiliateLinksCard';

/** Reads `Protocol.affiliateLinks` (JSON) and keeps only complete links. */
export function parseAffiliateLinks(value: unknown): AffiliateLink[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter(
        (item): item is AffiliateLink =>
            typeof item === 'object' &&
            item !== null &&
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            typeof item.url === 'string' &&
            item.name.trim().length > 0 &&
            item.url.trim().length > 0
    );
}
