import {Page, Text, StyleSheet, View, Image} from '@react-pdf/renderer';

export const PLAN_RECIPE_BACKGROUND_PATH = '/receta-plantilla.png';

const ACCENT_COLOR = '#1e3a5f';
const BODY_COLOR = '#333333';

/** Positions tuned for A3 over receta-marca-de-agua.png */
const LAYOUT = {
    titleTop: 170,
    titleLeft: 70,
    titleWidth: 700,
    imageTop: 258,
    imageLeft: 70,
    imageWidth: 360,
    imageHeight: 340,
    columnsTop: 700,
    leftColumnLeft: 70,
    leftColumnWidth: 340,
    rightColumnLeft: 430,
    rightColumnWidth: 340,
    pagePaddingBottom: 96
};

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
    recipeTitle: {
        position: 'absolute',
        top: LAYOUT.titleTop,
        left: LAYOUT.titleLeft,
        width: LAYOUT.titleWidth,
        fontSize: 28,
        fontFamily: 'Helvetica-Bold',
        color: ACCENT_COLOR,
        lineHeight: 1.2,
        textTransform: 'uppercase'
    },
    recipeImage: {
        position: 'absolute',
        top: LAYOUT.imageTop,
        left: LAYOUT.imageLeft,
        width: LAYOUT.imageWidth,
        height: LAYOUT.imageHeight,
        borderRadius: 16,
        objectFit: 'cover'
    },
    ingredientsColumn: {
        position: 'absolute',
        top: LAYOUT.columnsTop,
        left: LAYOUT.leftColumnLeft,
        width: LAYOUT.leftColumnWidth,
        paddingBottom: LAYOUT.pagePaddingBottom
    },
    instructionsColumn: {
        position: 'absolute',
        top: LAYOUT.columnsTop,
        left: LAYOUT.rightColumnLeft,
        width: LAYOUT.rightColumnWidth,
        paddingBottom: LAYOUT.pagePaddingBottom
    },
    ingredientRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: ACCENT_COLOR,
        marginTop: 5,
        marginRight: 10
    },
    ingredientText: {
        flex: 1,
        fontSize: 11,
        fontFamily: 'Helvetica',
        color: BODY_COLOR,
        lineHeight: 1.45
    },
    instructionRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10
    },
    stepNumber: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: ACCENT_COLOR,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        marginTop: 1
    },
    stepNumberText: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: ACCENT_COLOR
    },
    instructionText: {
        flex: 1,
        fontSize: 11,
        fontFamily: 'Helvetica',
        color: BODY_COLOR,
        lineHeight: 1.45
    }
});

export type PlanRecipeData = {
    id: string;
    title: string;
    imageSrc: string;
    ingredients: string[];
    instructions: string[];
};

type PlanRecipePageProps = {
    recipe: PlanRecipeData;
    backgroundSrc: string;
};

export function PlanRecipePage({recipe, backgroundSrc}: PlanRecipePageProps) {
    return (
        <Page size='A3' style={styles.page}>
            <View fixed style={styles.backgroundLayer}>
                <Image src={backgroundSrc} style={styles.backgroundImage} />
            </View>

            <Text style={styles.recipeTitle}>{recipe.title.toUpperCase()}</Text>

            <Image src={recipe.imageSrc} style={styles.recipeImage} />

            <View style={styles.ingredientsColumn}>
                {recipe.ingredients.map(ingredient => (
                    <View key={ingredient} style={styles.ingredientRow}>
                        <View style={styles.bullet} />
                        <Text style={styles.ingredientText}>{ingredient}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.instructionsColumn}>
                {recipe.instructions.map((instruction, index) => (
                    <View key={instruction} style={styles.instructionRow}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>
                                {index + 1}
                            </Text>
                        </View>
                        <Text style={styles.instructionText}>
                            {instruction}
                        </Text>
                    </View>
                ))}
            </View>
        </Page>
    );
}
