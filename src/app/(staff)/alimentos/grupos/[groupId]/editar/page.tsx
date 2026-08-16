import ClientPage from './client';

export default async function EditIngredientGroupPage({
    params
}: {
    params: Promise<{groupId: string}>;
}) {
    const {groupId} = await params;

    return (
        <div className='relative mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8 space-y-6'>
            <ClientPage groupId={groupId} />
        </div>
    );
}
