import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getUserFullName(firstName: string, lastName: string) {
    return `${firstName} ${lastName}`.trim();
}

export function getUserInitials(firstName: string, lastName: string) {
    const first = firstName.trim().charAt(0);
    const last = lastName.trim().charAt(0);
    const initials = `${first}${last}`.toUpperCase();

    return initials || '?';
}

export function getAgeFromDateString(
    dateString: string | null | undefined
): number | null {
    if (!dateString) return null;

    const dateParts = dateString.split(/[-T\s]/);
    const birthYear = parseInt(dateParts[0]);
    const birthMonth = parseInt(dateParts[1]) - 1;
    const birthDay = parseInt(dateParts[2]);

    if (
        Number.isNaN(birthYear) ||
        Number.isNaN(birthMonth) ||
        Number.isNaN(birthDay)
    ) {
        return null;
    }

    const today = new Date();
    let age = today.getFullYear() - birthYear;

    if (
        today.getMonth() < birthMonth ||
        (today.getMonth() === birthMonth && today.getDate() < birthDay)
    ) {
        age--;
    }

    return age;
}
