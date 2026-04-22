import ClientPage from './client';

export default function PacientesPage() {
    return (
        <div className='relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6'>
            <h1 className='text-2xl font-semibold'>Mis Pacientes</h1>
            <ClientPage />
        </div>
    );
}
