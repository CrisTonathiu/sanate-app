import ClientPage from './client';

export default async function EditRecipePage({
    params
}: {
    params: Promise<{recipeId: string}>;
}) {
    const {recipeId} = await params;

    return (
        <div className='space-y-4'>
            <ClientPage recipeId={recipeId} />
        </div>
    );
}
