'use client';

import {RecipeForm} from '@/components/widgets/recipe/RecipeForm';
import {RecipeFormData} from '@/lib/types/recipe-type';
import {useRouter} from 'next/navigation';

export default function ClientPage() {
    const router = useRouter();
    const handleSave = async (data: RecipeFormData) => {
        const response = await fetch('/api/recipes', {
            method: 'POST',
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
                errorBody?.message || 'No se pudo crear la receta.'
            );
        }

        router.push('/recetas');
        router.refresh();
    };

    const handleCancel = () => {
        // Navigate back to recipes list
        window.history.back();
    };

    return (
        <RecipeForm mode='create' onSave={handleSave} onCancel={handleCancel} />
    );
}
