import ClientPage from './client';

export default async function UserPage() {
    return (
        <div className='space-y-4'>
            <h1 className='text-2xl font-semibold'>Mis Usuarios</h1>
            <ClientPage />
        </div>
    );
}
