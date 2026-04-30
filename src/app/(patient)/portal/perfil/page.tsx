import {getPatientData} from '@/lib/auth/patient-access';
import {PatientProfileClient} from './client';

export default async function PatientProfilePage() {
    const patientData = await getPatientData();

    if (!patientData?.patient) {
        return (
            <div className='flex items-center justify-center min-h-screen'>
                <p>No tienes acceso a esta página</p>
            </div>
        );
    }

    const patientProfile = {
        patientId: patientData.patient.id,
        userId: patientData.user.id,
        birthDate: patientData.patient.birthDate,
        gender: patientData.patient.gender,
        height: patientData.patient.height,
        initialWeight: patientData.patient.initialWeight,
        createdAt: patientData.patient.createdAt,
        updatedAt: patientData.patient.updatedAt,
        firstName: patientData.user.firstName,
        lastName: patientData.user.lastName,
        email: patientData.user.email,
        phone: patientData.user.phone,
        isActive: patientData.user.isActive,
        avatarUrl: patientData.user.avatarUrl
    };

    return <PatientProfileClient profileData={patientProfile} />;
}
