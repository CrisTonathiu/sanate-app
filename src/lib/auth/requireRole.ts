import {Role} from '../types/user-type';
import {getCurrentUser} from './getCurrentUser';

export async function requireRole(requiredRole: Role) {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    if (user.role !== requiredRole) {
        throw new Error('Forbidden');
    }

    return user;
}
