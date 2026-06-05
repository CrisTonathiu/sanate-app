import {
    Document,
    Page,
    Text,
    StyleSheet,
    View,
    Image
} from '@react-pdf/renderer';
import type {AffiliateLink} from '@/components/widgets/profile-details/AffiliateLinksCard';

/** Drop your exported A3 letterhead PNG in public/plan-letterhead.png */
export const PLAN_LETTERHEAD_PATH = '/receta-fondo-prueba.png';

/**
 * Vertical space reserved for the letterhead (logo, name, divider).
 * Tune this value if content overlaps the header line.
 */
export const PLAN_CONTENT_TOP_PT = 145;

const CONTENT_HORIZONTAL_PT = 48;
const CONTENT_BOTTOM_PT = 48;
const BODY_FONT_SIZE = 14;
const LINE_HEIGHT = 1.75;
const SECTION_GAP_LINES = 2;
const SECTION_GAP_PT = BODY_FONT_SIZE * LINE_HEIGHT * SECTION_GAP_LINES;

const styles = StyleSheet.create({
    page: {
        position: 'relative'
    },
    backgroundLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
    },
    backgroundImage: {
        width: '100%',
        height: '100%'
    },
    content: {
        marginTop: PLAN_CONTENT_TOP_PT,
        paddingHorizontal: CONTENT_HORIZONTAL_PT,
        paddingBottom: CONTENT_BOTTOM_PT
    },
    section: {
        marginBottom: SECTION_GAP_PT
    },
    sectionTitle: {
        fontSize: BODY_FONT_SIZE,
        fontFamily: 'Helvetica-Bold',
        color: '#1a4a7a',
        lineHeight: LINE_HEIGHT,
        marginBottom: 4
    },
    bodyText: {
        fontSize: BODY_FONT_SIZE,
        fontFamily: 'Helvetica',
        color: '#333333',
        lineHeight: LINE_HEIGHT
    },
    affiliateLink: {
        marginBottom: 4
    }
});

export type PlanRecommendations = {
    generalRecommendations: string | null;
    tips: string | null;
    hydrationRecommendations: string | null;
    supplementRecommendations: string | null;
    affiliateLinks: AffiliateLink[];
};

type RecommendationSection = {
    title: string;
    content: string;
};

function hasText(value: string | null | undefined): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function buildRecommendationSections(
    recommendations: PlanRecommendations
): RecommendationSection[] {
    const sections: RecommendationSection[] = [];

    if (hasText(recommendations.generalRecommendations)) {
        sections.push({
            title: 'Recomendaciones generales',
            content: recommendations.generalRecommendations.trim()
        });
    }

    if (hasText(recommendations.tips)) {
        sections.push({
            title: 'Consejos de nutricion',
            content: recommendations.tips.trim()
        });
    }

    if (hasText(recommendations.hydrationRecommendations)) {
        sections.push({
            title: 'Recomendaciones de hidratacion',
            content: recommendations.hydrationRecommendations.trim()
        });
    }

    if (hasText(recommendations.supplementRecommendations)) {
        sections.push({
            title: 'Suplementos',
            content: recommendations.supplementRecommendations.trim()
        });
    }

    return sections;
}

function getValidAffiliateLinks(links: AffiliateLink[]): AffiliateLink[] {
    return links.filter(
        link => link.name.trim().length > 0 && link.url.trim().length > 0
    );
}

type PlanPdfProps = {
    letterheadSrc: string;
    recommendations: PlanRecommendations;
};

export function PlanPdf({letterheadSrc, recommendations}: PlanPdfProps) {
    const sections = buildRecommendationSections(recommendations);
    const affiliateLinks = getValidAffiliateLinks(
        recommendations.affiliateLinks
    );
    const hasAffiliateLinks = affiliateLinks.length > 0;

    return (
        <Document>
            <Page size='A3' style={styles.page}>
                <View fixed style={styles.backgroundLayer}>
                    <Image src={letterheadSrc} style={styles.backgroundImage} />
                </View>

                <View style={styles.content}>
                    {sections.map(section => (
                        <View key={section.title} style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                {section.title}
                            </Text>
                            <Text style={styles.bodyText}>
                                {section.content}
                            </Text>
                        </View>
                    ))}

                    {hasAffiliateLinks ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                Link de productos recomendados
                            </Text>
                            {affiliateLinks.map(link => (
                                <View
                                    key={link.id}
                                    style={styles.affiliateLink}>
                                    <Text style={styles.bodyText}>
                                        {link.name.trim()}
                                    </Text>
                                    <Text style={styles.bodyText}>
                                        {link.url.trim()}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : null}
                </View>
            </Page>
        </Document>
    );
}
