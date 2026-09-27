'use server';

import PacienteProtocolClient from './client';

type PageProps = {
    params: Promise<{patientId: string}>;
    searchParams: Promise<{editar?: string | string[]}>;
};

export default async function PacienteProtocolPage({
    params,
    searchParams
}: PageProps) {
    const {patientId} = await params;
    const {editar} = await searchParams;
    const editProtocolId = typeof editar === 'string' ? editar : null;

    return (
        <PacienteProtocolClient
            patientId={patientId}
            editProtocolId={editProtocolId}
        />
    );
}
