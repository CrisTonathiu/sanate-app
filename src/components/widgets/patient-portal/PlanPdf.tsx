import {
    Document,
    Page,
    Text,
    StyleSheet,
    View,
    Image,
    Svg,
    Path,
    Circle
} from '@react-pdf/renderer';
import type {AffiliateLink} from '@/components/widgets/profile-details/AffiliateLinksCard';
import type {PlanShoppingListItem} from '@/lib/patient-portal/shopping-list.types';
import type {PlanWeekSchedule} from '@/lib/services/patient/patient-plan-menu.service';
import {
    buildShoppingListPdfSections,
    distributeSectionsIntoColumns,
    getShoppingListPdfTypography,
    SHOPPING_LIST_PDF_COLORS
} from '@/lib/patient-portal/shopping-list-pdf-layout';
import {
    EQUIVALENCIAS_PDF_COLORS,
    type EquivalenciasColumn
} from '@/lib/patient-portal/equivalencias';
import {PlanRecipePage, type PlanRecipeData} from './PlanRecipePage';

/** Drop your exported A3 letterhead PNG in public/plan-letterhead.png */
export const PLAN_LETTERHEAD_PATH = '/receta-fondo-prueba.png';
export const PLAN_STATIC_PAGE_PATHS = [
    '/plato-inteligente-omnivoro.png',
    '/plato-inteligente-basado-en-plantas.png'
];

/** Full-page portion guide inserted after the weekly menu table */
export const PLAN_PORTION_GUIDE_PATH = '/guia-raciones.png';

export const PLAN_SECTION_BACKGROUND_PATH = '/recetario-marca-de-agua.png';

export type {PlanMenuSection} from '@/lib/services/patient/patient-plan-menu.service';
export {PLAN_MENU_SECTIONS} from '@/lib/services/patient/patient-plan-menu.service';

const SECTION_ACCENT_COLOR = '#1e3a5f';
const TABLE_BORDER_COLOR = '#c5d0dc';
const TABLE_HEADER_BG = '#1e3a5f';
const TABLE_ROW_ALT_BG = '#f3f6f9';

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
    },
    weekMenuContent: {
        marginTop: PLAN_CONTENT_TOP_PT,
        paddingHorizontal: 28,
        paddingBottom: CONTENT_BOTTOM_PT,
        flex: 1
    },
    weekMenuTitle: {
        fontSize: 22,
        fontFamily: 'Helvetica-Bold',
        color: SECTION_ACCENT_COLOR,
        marginBottom: 18,
        textAlign: 'center'
    },
    weekMenuTable: {
        borderWidth: 1,
        borderColor: TABLE_BORDER_COLOR,
        flexGrow: 1
    },
    weekMenuHeaderRow: {
        flexDirection: 'row',
        backgroundColor: TABLE_HEADER_BG
    },
    weekMenuRow: {
        flexDirection: 'row',
        flexGrow: 1,
        borderTopWidth: 1,
        borderTopColor: TABLE_BORDER_COLOR
    },
    weekMenuRowAlt: {
        backgroundColor: TABLE_ROW_ALT_BG
    },
    weekMenuCornerCell: {
        width: '14%',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRightWidth: 1,
        borderRightColor: TABLE_BORDER_COLOR,
        justifyContent: 'center'
    },
    weekMenuDayCell: {
        width: '12.2857%',
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderRightWidth: 1,
        borderRightColor: TABLE_BORDER_COLOR,
        justifyContent: 'center',
        alignItems: 'center'
    },
    weekMenuDayCellLast: {
        borderRightWidth: 0
    },
    weekMenuMealCell: {
        width: '14%',
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRightWidth: 1,
        borderRightColor: TABLE_BORDER_COLOR,
        justifyContent: 'center'
    },
    weekMenuMealNameCell: {
        width: '12.2857%',
        paddingVertical: 8,
        paddingHorizontal: 5,
        borderRightWidth: 1,
        borderRightColor: TABLE_BORDER_COLOR,
        justifyContent: 'center',
        alignItems: 'center'
    },
    weekMenuHeaderText: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#ffffff',
        textAlign: 'center'
    },
    weekMenuMealTypeText: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: SECTION_ACCENT_COLOR
    },
    weekMenuMealNameText: {
        fontSize: 8,
        fontFamily: 'Helvetica',
        color: '#333333',
        textAlign: 'center',
        lineHeight: 1.25
    },
    shoppingListContent: {
        marginTop: PLAN_CONTENT_TOP_PT,
        paddingHorizontal: 36,
        paddingBottom: CONTENT_BOTTOM_PT,
        flex: 1
    },
    shoppingListTitle: {
        fontSize: 22,
        fontFamily: 'Helvetica-Bold',
        color: SECTION_ACCENT_COLOR,
        marginBottom: 18,
        textAlign: 'center'
    },
    shoppingListColumns: {
        flexDirection: 'row',
        flex: 1
    },
    shoppingListColumn: {
        flex: 1,
        paddingHorizontal: 10,
        borderRightWidth: 1,
        borderRightColor: '#d0d0d0'
    },
    shoppingListColumnLast: {
        borderRightWidth: 0
    },
    shoppingListCategory: {
        fontFamily: 'Helvetica-Bold',
        color: SHOPPING_LIST_PDF_COLORS.category,
        marginBottom: 4,
        letterSpacing: 0.4
    },
    shoppingListItemRow: {
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    shoppingListItemText: {
        flex: 1,
        fontFamily: 'Helvetica',
        color: SHOPPING_LIST_PDF_COLORS.text,
        lineHeight: 1.2
    },
    shoppingListEmpty: {
        fontSize: 12,
        color: SHOPPING_LIST_PDF_COLORS.subtitle,
        textAlign: 'center',
        marginTop: 24
    },
    equivalenciasContent: {
        marginTop: PLAN_CONTENT_TOP_PT,
        paddingHorizontal: 28,
        paddingBottom: CONTENT_BOTTOM_PT,
        flex: 1
    },
    equivalenciasTitle: {
        fontSize: 26,
        fontFamily: 'Helvetica-Bold',
        color: EQUIVALENCIAS_PDF_COLORS.title,
        marginBottom: 14,
        textAlign: 'center',
        letterSpacing: 1
    },
    equivalenciasTable: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: EQUIVALENCIAS_PDF_COLORS.bodyBg,
        borderWidth: 1,
        borderColor: EQUIVALENCIAS_PDF_COLORS.border,
        borderRadius: 4,
        overflow: 'hidden'
    },
    equivalenciasColumn: {
        flex: 1,
        borderRightWidth: 1,
        borderRightColor: EQUIVALENCIAS_PDF_COLORS.border
    },
    equivalenciasColumnLast: {
        borderRightWidth: 0
    },
    equivalenciasColumnHeader: {
        backgroundColor: EQUIVALENCIAS_PDF_COLORS.headerBg,
        paddingVertical: 8,
        paddingHorizontal: 6,
        minHeight: 42,
        justifyContent: 'center'
    },
    equivalenciasColumnHeaderText: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: EQUIVALENCIAS_PDF_COLORS.headerText,
        textAlign: 'center',
        lineHeight: 1.2
    },
    equivalenciasColumnBody: {
        paddingVertical: 8,
        paddingHorizontal: 7
    },
    equivalenciasNote: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: EQUIVALENCIAS_PDF_COLORS.note,
        marginBottom: 4,
        lineHeight: 1.2
    },
    equivalenciasSubheader: {
        fontSize: 7.5,
        fontFamily: 'Helvetica-Bold',
        color: EQUIVALENCIAS_PDF_COLORS.title,
        marginTop: 6,
        marginBottom: 3,
        letterSpacing: 0.3
    },
    equivalenciasItem: {
        fontSize: 7.5,
        fontFamily: 'Helvetica',
        color: EQUIVALENCIAS_PDF_COLORS.text,
        marginBottom: 2.5,
        lineHeight: 1.2
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

type PlanWeekMenuPageProps = {
    schedule: PlanWeekSchedule;
    letterheadSrc: string;
    showWeekNumber: boolean;
};

function PlanWeekMenuPage({
    schedule,
    letterheadSrc,
    showWeekNumber
}: PlanWeekMenuPageProps) {
    const title = showWeekNumber
        ? `Menú semanal — Semana ${schedule.weekNumber}`
        : 'Menú semanal';

    return (
        <Page size='A3' style={styles.page}>
            <View fixed style={styles.backgroundLayer}>
                <Image src={letterheadSrc} style={styles.backgroundImage} />
            </View>

            <View style={styles.weekMenuContent}>
                <Text style={styles.weekMenuTitle}>{title}</Text>

                <View style={styles.weekMenuTable}>
                    <View style={styles.weekMenuHeaderRow}>
                        <View style={styles.weekMenuCornerCell}>
                            <Text style={styles.weekMenuHeaderText}>
                                Tiempo
                            </Text>
                        </View>
                        {schedule.dayLabels.map((dayLabel, index) => (
                            <View
                                key={dayLabel}
                                style={
                                    index === schedule.dayLabels.length - 1
                                        ? [
                                              styles.weekMenuDayCell,
                                              styles.weekMenuDayCellLast
                                          ]
                                        : styles.weekMenuDayCell
                                }>
                                <Text style={styles.weekMenuHeaderText}>
                                    {dayLabel}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {schedule.rows.map((row, rowIndex) => (
                        <View
                            key={row.mealType}
                            style={
                                rowIndex % 2 === 1
                                    ? [styles.weekMenuRow, styles.weekMenuRowAlt]
                                    : styles.weekMenuRow
                            }>
                            <View style={styles.weekMenuMealCell}>
                                <Text style={styles.weekMenuMealTypeText}>
                                    {row.mealTypeLabel}
                                </Text>
                            </View>
                            {row.mealsByDay.map((mealName, dayIndex) => (
                                <View
                                    key={`${row.mealType}-${dayIndex}`}
                                    style={
                                        dayIndex === row.mealsByDay.length - 1
                                            ? [
                                                  styles.weekMenuMealNameCell,
                                                  styles.weekMenuDayCellLast
                                              ]
                                            : styles.weekMenuMealNameCell
                                    }>
                                    <Text style={styles.weekMenuMealNameText}>
                                        {mealName || '—'}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>
            </View>
        </Page>
    );
}

function ShoppingListCheckbox({size = 8}: {size?: number}) {
    const radius = (size - 1) / 2;

    return (
        <Svg width={size} height={size} style={{marginRight: 5, marginTop: 1}}>
            <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={SHOPPING_LIST_PDF_COLORS.checkbox}
                strokeWidth={0.8}
                fill='none'
            />
        </Svg>
    );
}

type PlanShoppingListPageProps = {
    items: PlanShoppingListItem[];
    letterheadSrc: string;
};

function PlanShoppingListPage({
    items,
    letterheadSrc
}: PlanShoppingListPageProps) {
    const sections = buildShoppingListPdfSections(
        items.map(item => ({...item, quantity: ''}))
    );
    const columns = distributeSectionsIntoColumns(sections, 3);
    const baseTypography = getShoppingListPdfTypography(items.length);
    const typography = {
        itemFontSize: baseTypography.itemFontSize + 3,
        titleFontSize: baseTypography.titleFontSize + 3,
        sectionGap: baseTypography.sectionGap + 4,
        itemGap: baseTypography.itemGap + 1.5
    };

    return (
        <Page size='A3' style={styles.page}>
            <View fixed style={styles.backgroundLayer}>
                <Image src={letterheadSrc} style={styles.backgroundImage} />
            </View>

            <View style={styles.shoppingListContent}>
                <Text style={styles.shoppingListTitle}>Lista de compras</Text>

                {items.length === 0 ? (
                    <Text style={styles.shoppingListEmpty}>
                        No hay alimentos para la lista de compras.
                    </Text>
                ) : (
                    <View style={styles.shoppingListColumns}>
                        {columns.map((column, columnIndex) => (
                            <View
                                key={`shopping-column-${columnIndex}`}
                                style={
                                    columnIndex === columns.length - 1
                                        ? [
                                              styles.shoppingListColumn,
                                              styles.shoppingListColumnLast
                                          ]
                                        : styles.shoppingListColumn
                                }>
                                {column.sections.map(section => (
                                    <View
                                        key={section.title}
                                        style={{
                                            marginBottom: typography.sectionGap
                                        }}>
                                        <Text
                                            style={[
                                                styles.shoppingListCategory,
                                                {fontSize: typography.titleFontSize}
                                            ]}>
                                            {section.title}
                                        </Text>
                                        {section.items.map(item => (
                                            <View
                                                key={item.id}
                                                style={[
                                                    styles.shoppingListItemRow,
                                                    {
                                                        marginBottom:
                                                            typography.itemGap
                                                    }
                                                ]}>
                                                <ShoppingListCheckbox
                                                    size={
                                                        typography.itemFontSize +
                                                        3
                                                    }
                                                />
                                                <Text
                                                    style={[
                                                        styles.shoppingListItemText,
                                                        {
                                                            fontSize:
                                                                typography.itemFontSize
                                                        }
                                                    ]}>
                                                    {item.name}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </Page>
    );
}

function PlanEquivalenciasPage({
    columns,
    letterheadSrc
}: {
    columns: EquivalenciasColumn[];
    letterheadSrc: string;
}) {
    if (columns.length === 0) {
        return null;
    }

    return (
        <Page size='A3' style={styles.page}>
            <View fixed style={styles.backgroundLayer}>
                <Image src={letterheadSrc} style={styles.backgroundImage} />
            </View>

            <View style={styles.equivalenciasContent}>
                <Text style={styles.equivalenciasTitle}>Equivalencias</Text>

                <View style={styles.equivalenciasTable}>
                    {columns.map((column, columnIndex) => (
                        <View
                            key={column.key}
                            style={
                                columnIndex === columns.length - 1
                                    ? [
                                          styles.equivalenciasColumn,
                                          styles.equivalenciasColumnLast
                                      ]
                                    : styles.equivalenciasColumn
                            }>
                            <View style={styles.equivalenciasColumnHeader}>
                                <Text style={styles.equivalenciasColumnHeaderText}>
                                    {column.title}
                                </Text>
                            </View>
                            <View style={styles.equivalenciasColumnBody}>
                                {column.lines.map((line, lineIndex) => {
                                    if (line.kind === 'note') {
                                        return (
                                            <Text
                                                key={`${column.key}-note-${lineIndex}`}
                                                style={styles.equivalenciasNote}>
                                                {line.text}
                                            </Text>
                                        );
                                    }

                                    if (line.kind === 'subheader') {
                                        return (
                                            <Text
                                                key={`${column.key}-sub-${lineIndex}`}
                                                style={
                                                    styles.equivalenciasSubheader
                                                }>
                                                {line.text}
                                            </Text>
                                        );
                                    }

                                    return (
                                        <Text
                                            key={`${column.key}-item-${lineIndex}`}
                                            style={styles.equivalenciasItem}>
                                            {line.text}
                                        </Text>
                                    );
                                })}
                            </View>
                        </View>
                    ))}
                </View>
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
    portionGuideSrc?: string;
    sectionBackgroundSrc: string;
    recipeBackgroundSrc: string;
    menuSections: PlanMenuSectionGroup[];
    weekSchedules: PlanWeekSchedule[];
    shoppingList: PlanShoppingListItem[];
    equivalencias?: EquivalenciasColumn[];
};

export function PlanPdf({
    letterheadSrc,
    recommendations,
    staticPageSrcs,
    portionGuideSrc,
    sectionBackgroundSrc,
    recipeBackgroundSrc,
    menuSections,
    weekSchedules,
    shoppingList,
    equivalencias = []
}: PlanPdfProps) {
    const sections = buildRecommendationSections(recommendations);
    const affiliateLinks = getValidAffiliateLinks(
        recommendations.affiliateLinks
    );
    const hasAffiliateLinks = affiliateLinks.length > 0;
    const showWeekNumber = weekSchedules.length > 1;

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
                <Page key={src} size='A3'>
                    <Image src={src} style={styles.fullPageImage} />
                </Page>
            ))}

            {weekSchedules.map(schedule => (
                <PlanWeekMenuPage
                    key={`week-schedule-${schedule.weekNumber}`}
                    schedule={schedule}
                    letterheadSrc={letterheadSrc}
                    showWeekNumber={showWeekNumber}
                />
            ))}

            {equivalencias.length > 0 ? (
                <PlanEquivalenciasPage
                    columns={equivalencias}
                    letterheadSrc={letterheadSrc}
                />
            ) : null}

            {portionGuideSrc ? (
                <Page size='A3'>
                    <Image src={portionGuideSrc} style={styles.fullPageImage} />
                </Page>
            ) : null}

            {shoppingList.length > 0 ? (
                <PlanShoppingListPage
                    items={shoppingList}
                    letterheadSrc={letterheadSrc}
                />
            ) : null}

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
