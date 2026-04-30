export type Role = 'ADMIN' | 'NUTRITIONIST' | 'PATIENT';

export type User = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    whatsappNumber: string | null;
    role: Role;
    createdAt: string | Date;
    updatedAt: string | Date;
    lastLoginAt: string | Date | null;
    isActive: boolean;
};
