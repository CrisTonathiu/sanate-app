'use server';

import ProtocolDetailClient from './client';

type PageProps = {
    params: Promise<{patientId: string; protocolId: string}>;
};

export default async function ProtocolDetailPage({params}: PageProps) {
    const {patientId, protocolId} = await params;
    return (
        <ProtocolDetailClient patientId={patientId} protocolId={protocolId} />
    );
}
