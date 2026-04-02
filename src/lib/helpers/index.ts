export function calculateGEB(
    weight: number,
    height: number,
    age: number,
    gender: 'MALE' | 'FEMALE'
): number {
    // Normalize height to cm
    const heightCm = height < 3 ? height * 100 : height;

    if (gender === 'MALE') {
        return 66.5 + 13.75 * weight + 5.003 * heightCm - 6.75 * age;
    }

    if (gender === 'FEMALE') {
        return 655.1 + 9.563 * weight + 1.85 * heightCm - 4.676 * age;
    }

    throw new Error('Invalid gender');
}

export function calculateGEBMifflin(
    weight: number,
    height: number,
    age: number,
    gender: 'MALE' | 'FEMALE'
): number {
    // Normalize height to cm
    const heightCm = height < 3 ? height * 100 : height;

    if (gender === 'MALE') {
        return 10 * weight + 6.25 * heightCm - 5 * age + 5;
    }

    if (gender === 'FEMALE') {
        return 10 * weight + 6.25 * heightCm - 5 * age - 161;
    }

    throw new Error('Invalid gender');
}
