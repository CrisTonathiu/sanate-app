export interface PatientField {
    label: string;
    value: string;
    icon?: React.ReactNode;
}

export interface PatientEditData {
    firstName: string;
    lastName: string;
    age: string;
    gender: string;
    email: string;
    phone: string;
    address: string;
    birthday: string;
    weight: string;
    height: string;
    bloodPressureSystolic: string;
    bloodPressureDiastolic: string;
    particularSickness: string;
    allergic: string;
    note: string;
}

export interface Document {
    id: string;
    name: string;
    type: 'pdf' | 'image';
    size: string | number;
    uploadedAt: string;
    storagePath?: string;
    publicUrl?: string;
}
