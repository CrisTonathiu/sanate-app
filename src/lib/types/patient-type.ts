import {User} from './user-type';

export type PatientProfile = {
    patientId: string;
    birthDate: string | null;
    gender: string | null;
    height: number | null;
    weight: number | null;
    createdAt: string;
    updatedAt: string;
};

export type PatientProfileData = {
    patientId: string;
    userId: string;
    avatarUrl: string | null;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    birthDate: string | Date | null;
    gender: string | null;
    height: number | null;
    initialWeight: number | null;
    createdAt: string | Date;
    updatedAt: string | Date;
};

export type Patient = User & PatientProfile;
export type PatientData = User & PatientProfile;

// --- Types ---
type CreateModeStep = 1 | 2 | 3 | 4 | 5 | 6;
type EditModeStep = 1 | 2 | 3;
export type StepKey = CreateModeStep | EditModeStep;
