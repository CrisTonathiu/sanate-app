export type Role = 'ADMIN' | 'NUTRITIONIST' | 'PATIENT';

export type User = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    whatsappNumber: string | null;
    role: Role;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
    isActive: boolean;
};
