import {prisma} from '@/lib/prisma';
import {getCurrentUser} from './getCurrentUser';

export async function getPatientData() {
    const user = await getCurrentUser();
    if (!user || user.role !== 'PATIENT') {
        return null;
    }

    const patient = await prisma.patient.findUnique({
        where: {userId: user.id},
        select: {
            id: true,
            birthDate: true,
            gender: true,
            height: true,
            initialWeight: true,
            createdAt: true,
            updatedAt: true
        }
    });

    return {user, patient};
}
