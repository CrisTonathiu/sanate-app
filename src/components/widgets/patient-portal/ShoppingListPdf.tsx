import {
    Circle,
    Document,
    Page,
    StyleSheet,
    Svg,
    Text,
    View
} from '@react-pdf/renderer';
import type {WeeklyShoppingList} from '@/lib/patient-portal/shopping-list.types';
import {
    SHOPPING_LIST_PDF_COLORS,
    buildShoppingListPdfLayout,
    formatShoppingListItemLine
} from '@/lib/patient-portal/shopping-list-pdf-layout';

function Checkbox({size = 7}: {size?: number}) {
    const radius = (size - 1) / 2;

    return (
        <Svg width={size} height={size} style={{marginRight: 4, marginTop: 1}}>
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

export function ShoppingListPdf({week}: {week: WeeklyShoppingList}) {
    const {columns, typography} = buildShoppingListPdfLayout(week);

    const styles = StyleSheet.create({
        page: {
            padding: 14,
            fontFamily: 'Helvetica',
            backgroundColor: '#ffffff'
        },
        frame: {
            flex: 1,
            borderWidth: 2,
            borderColor: SHOPPING_LIST_PDF_COLORS.border,
            paddingHorizontal: 10,
            paddingVertical: 10
        },
        header: {
            alignItems: 'center',
            marginBottom: 8,
            paddingBottom: 6,
            borderBottomWidth: 1,
            borderBottomColor: '#d8e8de'
        },
        title: {
            fontSize: 18,
            fontFamily: 'Helvetica-Bold',
            color: SHOPPING_LIST_PDF_COLORS.title,
            letterSpacing: 2
        },
        subtitle: {
            marginTop: 3,
            fontSize: 8,
            color: SHOPPING_LIST_PDF_COLORS.subtitle
        },
        columnsRow: {
            flexDirection: 'row',
            flex: 1
        },
        column: {
            flex: 1,
            paddingHorizontal: 5,
            borderRightWidth: 1,
            borderRightColor: '#d0d0d0'
        },
        columnLast: {
            borderRightWidth: 0
        },
        section: {
            marginBottom: typography.sectionGap
        },
        categoryTitle: {
            fontSize: typography.titleFontSize,
            fontFamily: 'Helvetica-Bold',
            color: SHOPPING_LIST_PDF_COLORS.category,
            marginBottom: 3,
            letterSpacing: 0.4
        },
        itemRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: typography.itemGap
        },
        itemText: {
            flex: 1,
            fontSize: typography.itemFontSize,
            color: SHOPPING_LIST_PDF_COLORS.text,
            lineHeight: 1.15
        },
        emptyState: {
            fontSize: 9,
            color: SHOPPING_LIST_PDF_COLORS.subtitle,
            textAlign: 'center',
            marginTop: 24
        }
    });

    return (
        <Document>
            <Page size='A4' style={styles.page} wrap={false}>
                <View style={styles.frame}>
                    <View style={styles.header}>
                        <Text style={styles.title}>LISTA DE COMPRAS</Text>
                        <Text style={styles.subtitle}>
                            Semana {week.weekNumber} · {week.dateRange}
                        </Text>
                    </View>

                    {week.items.length === 0 ? (
                        <Text style={styles.emptyState}>
                            No hay ingredientes para esta semana.
                        </Text>
                    ) : (
                        <View style={styles.columnsRow}>
                            {columns.map((column, columnIndex) => (
                                <View
                                    key={`column-${columnIndex}`}
                                    style={[
                                        styles.column,
                                        ...(columnIndex === columns.length - 1
                                            ? [styles.columnLast]
                                            : [])
                                    ]}>
                                    {column.sections.map(section => (
                                        <View
                                            key={section.title}
                                            style={styles.section}>
                                            <Text style={styles.categoryTitle}>
                                                {section.title}
                                            </Text>
                                            {section.items.map(item => (
                                                <View
                                                    key={item.id}
                                                    style={styles.itemRow}>
                                                    <Checkbox
                                                        size={
                                                            typography.itemFontSize +
                                                            2
                                                        }
                                                    />
                                                    <Text
                                                        style={styles.itemText}>
                                                        {formatShoppingListItemLine(
                                                            item
                                                        )}
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
        </Document>
    );
}
