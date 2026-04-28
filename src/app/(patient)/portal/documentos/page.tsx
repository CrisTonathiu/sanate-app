import {getCurrentUser} from '@/lib/auth/getCurrentUser';
import {prisma} from '@/lib/prisma';
import PatientDocumentClient from './client';

async function getPatientData() {
    const user = await getCurrentUser();
    if (!user || user.role !== 'PATIENT') {
        return null;
    }

    const patient = await prisma.patient.findUnique({
        where: {userId: user.id},
        select: {id: true}
    });

    return patient;
}

export default async function PatientDocumentPage() {
    const patient = await getPatientData();

    if (!patient) {
        return (
            <div className='flex items-center justify-center min-h-screen'>
                <p>No tienes acceso a esta página</p>
            </div>
        );
    }

    return <PatientDocumentClient patientId={patient.id} />;
}
