import {Document, Page, Text, View, StyleSheet} from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {padding: 24, fontSize: 12, fontFamily: 'Helvetica'},
    header: {marginBottom: 12, fontSize: 18, fontWeight: 'bold'},
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6
    },
    itemName: {fontWeight: '500'},
    itemQty: {color: '#555'}
});

export function ShoppingListPdf({week}: {week: any}) {
    return (
        <Document>
            <Page size='A4' style={styles.page}>
                <Text style={styles.header}>
                    Lista de Compras - Semana {week.weekNumber}
                </Text>
                <Text>{week.dateRange}</Text>
                <View style={{marginTop: 16}}>
                    {week.items.map((item: any) => (
                        <View key={item.id} style={styles.itemRow}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemQty}>{item.quantity}</Text>
                        </View>
                    ))}
                </View>
            </Page>
        </Document>
    );
}
