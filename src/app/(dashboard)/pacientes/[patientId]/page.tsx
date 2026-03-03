import ClientPage from './client';

type PageProps = {
    params: Promise<{patientId: string}>;
};

export default async function PacientePage({params}: PageProps) {
    const {patientId} = await params;

    return (
        <div className='space-y-4'>
            <ClientPage patientId={patientId} />
        </div>
    );
}
