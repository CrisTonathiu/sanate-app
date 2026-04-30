import PatientDocumentClient from './client';
import {getPatientData} from '@/lib/auth/patient-access';

export default async function PatientDocumentPage() {
    const patientData = await getPatientData();

    if (!patientData?.patient) {
        return (
            <div className='flex items-center justify-center min-h-screen'>
                <p>No tienes acceso a esta página</p>
            </div>
        );
    }

    return <PatientDocumentClient patientId={patientData.patient.id} />;
}
