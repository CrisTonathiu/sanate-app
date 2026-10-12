import {fetchExercises} from '@/lib/services/exercise.service';
import PatientExercisesClient from './client';

export const dynamic = 'force-dynamic';

export default async function PatientExercisesPage() {
    const exercises = await fetchExercises();

    return <PatientExercisesClient exercises={exercises} />;
}
