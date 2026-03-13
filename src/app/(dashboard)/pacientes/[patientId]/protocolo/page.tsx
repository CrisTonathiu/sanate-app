'use server';

import PacienteProtocolClient from './client';

type PageProps = {
    params: Promise<{patientId: string}>;
};

export default async function PacienteProtocolPage({params}: PageProps) {
    const {patientId} = await params;
    return <PacienteProtocolClient patientId={patientId} />;
}
