import {
    Document,
    Page,
    Text,
    StyleSheet,
    View,
    Image,
    Svg,
    Path
} from '@react-pdf/renderer';
import type {AffiliateLink} from '@/components/widgets/profile-details/AffiliateLinksCard';
import {PlanRecipePage, type PlanRecipeData} from './PlanRecipePage';

/** Drop your exported A3 letterhead PNG in public/plan-letterhead.png */
export const PLAN_LETTERHEAD_PATH = '/receta-fondo-prueba.png';
export const PLAN_STATIC_PAGE_PATHS = [
    '/plato-inteligente-omnivoro.png',
    '/plato-inteligente-basado-en-plantas.png'
];

export const PLAN_SECTION_BACKGROUND_PATH = '/recetario-marca-de-agua.png';

export type {PlanMenuSection} from '@/lib/services/patient/patient-plan-menu.service';
export {PLAN_MENU_SECTIONS} from '@/lib/services/patient/patient-plan-menu.service';

const SECTION_ACCENT_COLOR = '#1e3a5f';

/**
 * Vertical space reserved for the letterhead (logo, name, divider).
 * Tune this value if content overlaps the header line.
 */
export const PLAN_CONTENT_TOP_PT = 145;

const CONTENT_HORIZONTAL_PT = 48;
const CONTENT_BOTTOM_PT = 48;
const BODY_FONT_SIZE = 16;
const LINE_HEIGHT = 1.5;
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
    fullPageImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
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
    },
    sectionPage: {
        position: 'relative'
    },
    sectionDividerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 420
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: SECTION_ACCENT_COLOR
    },
    dividerIcon: {
        marginHorizontal: 14
    },
    sectionDividerTitle: {
        fontSize: 36,
        fontFamily: 'Helvetica',
        color: SECTION_ACCENT_COLOR,
        letterSpacing: 14,
        textAlign: 'center',
        marginVertical: 28
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

function ToothDividerIcon() {
    return (
        <Svg width={18} height={24} viewBox='0 0 18 24'>
            <Path
                d='M9 1.2C5.8 1.2 3.5 3.8 3.5 7.2c0 2.2 0.9 4.1 1.6 5.9 0.5 1.2 0.9 2.5 1.1 3.8 0.2 1.1 0.4 2.2 0.7 3.1h5.2c0.3-0.9 0.5-2 0.7-3.1 0.2-1.3 0.6-2.6 1.1-3.8 0.7-1.8 1.6-3.7 1.6-5.9 0-3.4-2.3-6-5.5-6z'
                stroke={SECTION_ACCENT_COLOR}
                strokeWidth={0.9}
                fill='none'
            />
            <Path
                d='M9 7.2v2.8M7.2 9.6h3.6'
                stroke={SECTION_ACCENT_COLOR}
                strokeWidth={0.7}
                fill='none'
            />
        </Svg>
    );
}

function DividerWithIcon() {
    return (
        <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerIcon}>
                <ToothDividerIcon />
            </View>
            <View style={styles.dividerLine} />
        </View>
    );
}

type PlanSectionDividerPageProps = {
    title: string;
    backgroundSrc: string;
};

function PlanSectionDividerPage({
    title,
    backgroundSrc
}: PlanSectionDividerPageProps) {
    return (
        <Page size='A3' style={styles.sectionPage}>
            <View fixed style={styles.backgroundLayer}>
                <Image src={backgroundSrc} style={styles.backgroundImage} />
            </View>

            <View style={styles.sectionDividerContent}>
                <DividerWithIcon />
                <Text style={styles.sectionDividerTitle}>{title}</Text>
                <DividerWithIcon />
            </View>
        </Page>
    );
}

type PlanMenuSectionGroup = {
    section: string;
    recipes: PlanRecipeData[];
};

type PlanPdfProps = {
    letterheadSrc: string;
    recommendations: PlanRecommendations;
    staticPageSrcs: string[];
    sectionBackgroundSrc: string;
    recipeBackgroundSrc: string;
    menuSections: PlanMenuSectionGroup[];
};

export function PlanPdf({
    letterheadSrc,
    recommendations,
    staticPageSrcs,
    sectionBackgroundSrc,
    recipeBackgroundSrc,
    menuSections
}: PlanPdfProps) {
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

            {staticPageSrcs.map(src => (
                <Page size='A3'>
                    <Image src={src} style={styles.fullPageImage} />
                </Page>
            ))}

            {menuSections.flatMap(({section, recipes}) => [
                <PlanSectionDividerPage
                    key={`section-${section}`}
                    title={section}
                    backgroundSrc={sectionBackgroundSrc}
                />,
                ...recipes.map(recipe => (
                    <PlanRecipePage
                        key={`${section}-${recipe.id}`}
                        recipe={recipe}
                        backgroundSrc={recipeBackgroundSrc}
                    />
                ))
            ])}
        </Document>
    );
}
