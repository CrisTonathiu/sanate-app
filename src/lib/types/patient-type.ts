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

export type Patient = User & PatientProfile;

// --- Types ---
type CreateModeStep = 1 | 2 | 3 | 4 | 5;
type EditModeStep = 1 | 2 | 3;
export type StepKey = CreateModeStep | EditModeStep;
