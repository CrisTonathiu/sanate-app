export interface PatientVitalDTO {
    weightKg?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    bodyFatPercentage?: number;
    muscleMassKg?: number;
}

export interface PatientConditionDTO {
    id?: string; // optional for new ones
    name: string;
    diagnosedAt?: string;
    notes?: string;
}

export type AllergySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE';

export interface PatientAllergyDTO {
    id?: string;
    allergen: string;
    severity?: AllergySeverity;
    notes?: string;
}

export interface PatientProfileDTO {
    id: string;

    // Static Patient Info
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    initialWeight?: number;
    height?: number;

    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;

    // Latest Vital Snapshot
    vital?: PatientVitalDTO;

    // Editable Arrays
    conditions: PatientConditionDTO[];
    allergies: PatientAllergyDTO[];
}
