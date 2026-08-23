import {z} from 'zod';

const optionalMacro = z
    .union([z.number().min(0), z.null()])
    .optional()
    .transform(value => (value === undefined ? undefined : value));

const optionalPositive = z
    .union([z.number().positive(), z.null()])
    .optional()
    .transform(value => (value === undefined ? undefined : value));

export const foodPortionUnitSchema = z.enum([
    'GRAM',
    'PIECE',
    'CUP',
    'TBSP',
    'TSP',
    'ML',
    'OZ'
]);

const optionalPortionUnit = z
    .union([foodPortionUnitSchema, z.null()])
    .optional()
    .transform(value => (value === undefined ? undefined : value));

export const createFoodSchema = z
    .object({
        name: z.string().trim().min(1, 'El nombre es obligatorio'),
        groupId: z.string().trim().cuid('Grupo inválido'),
        proteinPer100g: optionalMacro,
        carbsPer100g: optionalMacro,
        fatPer100g: optionalMacro,
        caloriesPer100g: optionalMacro,
        density: z
            .union([
                z.number().positive('La densidad debe ser mayor a 0'),
                z.null()
            ])
            .optional()
            .transform(value => (value === undefined ? undefined : value)),
        isDiscrete: z.boolean().optional(),
        gramsPerPiece: z
            .union([
                z.number().positive(
                    'Los gramos por pieza deben ser mayores a 0'
                ),
                z.null()
            ])
            .optional()
            .transform(value => (value === undefined ? undefined : value)),
        minPortionQuantity: optionalPositive,
        minPortionUnit: optionalPortionUnit,
        maxPortionQuantity: optionalPositive,
        maxPortionUnit: optionalPortionUnit,
        maxPortionGrams: optionalPositive,
        gramsPerEquivalent: optionalPositive,
        equivalentDisplayText: z
            .union([z.string().trim().min(1), z.literal(''), z.null()])
            .optional()
            .transform(value => {
                if (value === undefined) return undefined;
                if (value === null || value === '') return null;
                return value;
            }),
        isFreePortion: z.boolean().optional()
    })
    .superRefine((data, ctx) => {
        if (data.isDiscrete && (data.gramsPerPiece == null || data.gramsPerPiece <= 0)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['gramsPerPiece'],
                message:
                    'Los gramos por pieza son obligatorios si el alimento se cuenta en piezas'
            });
        }

        if (data.minPortionQuantity != null && data.minPortionUnit == null) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['minPortionUnit'],
                message: 'Indica la unidad de la porción mínima'
            });
        }

        if (data.maxPortionQuantity != null && data.maxPortionUnit == null) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['maxPortionUnit'],
                message: 'Indica la unidad de la porción máxima'
            });
        }

        const pieceUnit =
            data.minPortionUnit === 'PIECE' || data.maxPortionUnit === 'PIECE';
        if (
            pieceUnit &&
            (data.gramsPerPiece == null || data.gramsPerPiece <= 0)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['gramsPerPiece'],
                message:
                    'Los gramos por pieza son necesarios para un tope en pz'
            });
        }
    });


export type CreateFoodInput = z.infer<typeof createFoodSchema>;

export const updateFoodSchema = createFoodSchema;

export type UpdateFoodInput = z.infer<typeof updateFoodSchema>;

export const foodIdSchema = z.string().trim().cuid('ID de alimento inválido');

export type FoodIdInput = z.infer<typeof foodIdSchema>;
