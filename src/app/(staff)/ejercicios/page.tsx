import {fetchExercises} from '@/lib/services/exercise.service';
import ExercisesClient from './client';

export const dynamic = 'force-dynamic';

export default async function ExercisesPage() {
    const exercises = await fetchExercises();

    return <ExercisesClient initialExercises={exercises} />;
}
