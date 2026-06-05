import {
    Document,
    Page,
    Text,
    StyleSheet,
    View,
    Image
} from '@react-pdf/renderer';

/** Drop your exported A3 letterhead PNG in public/plan-letterhead.png */
export const PLAN_LETTERHEAD_PATH = '/receta-fondo-prueba.png';

/**
 * Vertical space reserved for the letterhead (logo, name, divider).
 * Tune this value if content overlaps the header line.
 */
export const PLAN_CONTENT_TOP_PT = 145;

const CONTENT_HORIZONTAL_PT = 48;
const CONTENT_BOTTOM_PT = 48;

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
    bodyText: {
        fontSize: 12,
        fontFamily: 'Helvetica',
        color: '#1a4a7a',
        lineHeight: 1.5
    }
});

type PlanPdfProps = {
    letterheadSrc: string;
};

export function PlanPdf({letterheadSrc}: PlanPdfProps) {
    return (
        <Document>
            <Page size='A3' style={styles.page}>
                <View fixed style={styles.backgroundLayer}>
                    <Image src={letterheadSrc} style={styles.backgroundImage} />
                </View>

                <View style={styles.content}>
                    <Text style={styles.bodyText}>Este es tu plan</Text>
                </View>
            </Page>
        </Document>
    );
}
