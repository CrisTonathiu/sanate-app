'use client';

import {RecipeForm} from '@/components/widgets/recipe/RecipeForm';
import {RecipeFormData} from '@/lib/types/recipe-type';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';

interface EditRecipeClientProps {
    recipeId: string;
}

interface RecipeApiResponse {
    success: boolean;
    message?: string;
    data?: {
        id: string;
        title: string;
        imageUrl?: string | null;
        mealType: string;
        ingredients: Array<{
            quantity?: number;
            unit?: 'GRAM' | 'PIECE' | 'CUP' | 'TBSP' | 'TSP' | 'ML' | 'OZ';
            grams?: number;
            ingredient: {
                foodId?: string | null;
                name: string;
                food?: {
                    id: string;
                } | null;
            };
        }>;
        extraIngredients: Array<{
            name: string;
        }>;
        steps: Array<{
            instruction: string;
        }>;
    };
}

export default function EditRecipeClient({recipeId}: EditRecipeClientProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [recipeData, setRecipeData] = useState<RecipeFormData | null>(null);
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        async function loadRecipe() {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/recipes/${recipeId}`, {
                    credentials: 'include'
                });
                const body = (await response.json()) as RecipeApiResponse;

                if (!response.ok || !body.success || !body.data) {
                    throw new Error(
                        body.message || 'No se pudo cargar la receta.'
                    );
                }

                if (!isMounted) {
                    return;
                }

                setRecipeData({
                    id: body.data.id,
                    title: body.data.title,
                    imageUrl: body.data.imageUrl ?? null,
                    mealType: body.data.mealType,
                    ingredients: body.data.ingredients.map(item => ({
                        foodId:
                            item.ingredient.food?.id ||
                            item.ingredient.foodId ||
                            item.ingredient.name,
                        quantity: item.quantity,
                        unit: item.unit,
                        grams: item.grams
                    })),
                    extraIngredients: body.data.extraIngredients.map(item => ({
                        name: item.name
                    })),
                    steps: body.data.steps.map(item => ({
                        instruction: item.instruction
                    }))
                });
            } catch (error) {
                alert(
                    error instanceof Error
                        ? error.message
                        : 'Error inesperado al cargar la receta.'
                );
                router.push('/recetas');
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadRecipe();

        return () => {
            isMounted = false;
        };
    }, [recipeId, router]);

    const handleSave = async (data: RecipeFormData) => {
        const response = await fetch(`/api/recipes/${recipeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: data.title.trim(),
                imageUrl: data.imageUrl ?? undefined,
                mealType: data.mealType,
                ingredients: data.ingredients,
                extraIngredients: data.extraIngredients,
                steps: data.steps
            })
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(
                errorBody?.message || 'No se pudo actualizar la receta.'
            );
        }

        router.push('/recetas');
        router.refresh();
    };

    const handleDelete = async () => {
        const response = await fetch(`/api/recipes/${recipeId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(
                errorBody?.message || 'No se pudo eliminar la receta.'
            );
        }

        router.push('/recetas');
        router.refresh();
    };

    const handleCancel = () => {
        router.push('/recetas');
    };

    return (
        <RecipeForm
            mode='edit'
            initialData={recipeData}
            isLoading={isLoading}
            onSave={handleSave}
            onDelete={handleDelete}
            onCancel={handleCancel}
        />
    );
}
