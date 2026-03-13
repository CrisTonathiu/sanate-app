'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {motion, AnimatePresence} from 'framer-motion';
import {Cog, MoreVertical, Pencil, Trash2} from 'lucide-react';
import {useGetPatientProfile} from '@/hooks/use-patients';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import PatientInfoTab from '@/components/widgets/profile-details/PatientInfoTab';
import AppointmentHistoryTab from '@/components/widgets/profile-details/AppointmentHistoryTab';
import MedicalRecordsTab from '@/components/widgets/profile-details/MedicalRecordsTab';
import ProfileDetailsLoader from '@/components/loaders/ProfileDetailsLoader';
import {PatientEditForm} from '@/components/forms/PatientEditForm';
import DeletePatientDialog from '@/components/widgets/DeletePatientDialog';
import PatientBreadcrumb from '@/components/widgets/profile-details/PatientBreadcrumb';
import {PatientProfileDTO} from '@/lib/dto/PatientDTO';

interface ClientPageProps {
    patientId: string;
}
// --- Types ---
type TabKey = 'info' | 'appointments' | 'treatments' | 'records';

// --- Static data ---
const TABS: {key: TabKey; label: string}[] = [
    {key: 'info', label: 'Información del paciente'},
    {key: 'appointments', label: 'Historial de consultas'},
    // {key: 'treatments', label: 'Próximo tratamiento'},
    {key: 'records', label: 'Historial médico'}
];

export default function ClientPage({patientId}: ClientPageProps) {
    const router = useRouter();
    const {data: patient, isPending} = useGetPatientProfile(patientId);

    const [activeTab, setActiveTab] = useState<TabKey>('info');
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

    if (isPending) {
        return <ProfileDetailsLoader />;
    }

    if (!patient) {
        return (
            <div className='flex items-center justify-center min-h-screen'>
                <div className='text-center'>
                    <h1 className='text-2xl font-bold tracking-tight text-foreground'>
                        Paciente no encontrado
                    </h1>
                    <p className='text-muted-foreground mt-2'>
                        El paciente que buscas no existe o ha sido eliminado.
                    </p>
                    <Button
                        onClick={() => router.push('/pacientes')}
                        className='mt-4 bg-gradient-to-r from-[hsl(262,80%,60%)] to-[hsl(220,70%,55%)]'>
                        Volver a la lista
                    </Button>
                </div>
            </div>
        );
    }

    if (isEditing) {
        return (
            <PatientEditForm
                patientProfile={patient as Partial<PatientProfileDTO>}
                onBack={() => setIsEditing(false)}
            />
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'info':
                return <PatientInfoTab patient={patient} />;
            case 'appointments':
                return <AppointmentHistoryTab />;
            // case 'treatments':
            //     return <NextTreatmentTab />;
            case 'records':
                return <MedicalRecordsTab />;
        }
    };

    return (
        <div className='relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8'>
            {/* Patient Breadcrumb */}
            <PatientBreadcrumb patientId={patientId} />

            {/* Patient Header */}
            <motion.div
                initial={{opacity: 0, y: 15}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5, delay: 0.1}}
                className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-4'>
                    <div className='relative'>
                        <Avatar className='h-16 w-16 border-2 border-border'>
                            <AvatarImage
                                src='/images/patient-avatar.jpg'
                                alt='Willie Jennie'
                            />
                            <AvatarFallback className='bg-gradient-to-br from-[hsl(262,80%,60%)] to-[hsl(220,70%,55%)] text-lg font-semibold text-primary-foreground'>
                                {patient.firstName.charAt(0).toUpperCase()}
                                {patient.lastName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className='absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background bg-[hsl(150,60%,50%)]' />
                    </div>
                    <div className='flex flex-col gap-1'>
                        <h1 className='text-xl font-bold tracking-tight text-foreground sm:text-2xl'>
                            {patient?.firstName} {patient?.lastName}
                        </h1>
                        <div className='flex items-center gap-2'>
                            <div className='flex items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-2.5 py-1'>
                                <Cog className='h-3.5 w-3.5 text-muted-foreground' />

                                <button
                                    onClick={() => setIsEditing(true)}
                                    className='ml-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80 cursor-pointer'>
                                    Editar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className='flex items-center gap-2'>
                    <Button
                        onClick={() =>
                            router.push(`/pacientes/${patientId}/protocolo`)
                        }
                        className='h-10 rounded-xl bg-gradient-to-r from-[hsl(262,80%,60%)] to-[hsl(220,70%,55%)] px-5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:shadow-lg hover:shadow-[hsl(262,80%,60%)/0.25]'>
                        <Pencil className='mr-2 h-4 w-4' />
                        Crear Protocolo
                    </Button>
                    {/* <Button className='h-10 rounded-xl bg-gradient-to-r from-[hsl(262,80%,60%)] to-[hsl(220,70%,55%)] px-5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:shadow-lg hover:shadow-[hsl(262,80%,60%)/0.25]'>
                        <Pencil className='mr-2 h-4 w-4' />
                        Agendar Consulta
                    </Button> */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant='outline'
                                size='icon'
                                className='h-10 w-10 rounded-xl border-border bg-secondary/30 text-foreground hover:bg-secondary/60'>
                                <MoreVertical className='h-4 w-4' />
                                <span className='sr-only'>Más opciones</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align='end'
                            className='w-48 rounded-xl border-border bg-popover'>
                            <DropdownMenuItem
                                onClick={() => setDeleteDialogOpen(true)}
                                className='cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950/50 dark:focus:text-red-300'>
                                <Trash2 className='mr-2 h-4 w-4' />
                                Eliminar Paciente
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </motion.div>

            {/* Tabs */}
            <motion.div
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.4, delay: 0.2}}
                className='mb-8'>
                <div className='flex gap-1 overflow-x-auto border-b border-border pb-px scrollbar-none'>
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                                activeTab === tab.key
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}>
                            {tab.label}
                            {activeTab === tab.key && (
                                <motion.div
                                    layoutId='active-tab-indicator'
                                    className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[hsl(262,80%,60%)] to-[hsl(220,70%,55%)]'
                                    transition={{
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 30
                                    }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Tab content */}
            <AnimatePresence mode='wait'>{renderTabContent()}</AnimatePresence>

            {/* Delete Patient Dialog */}
            <DeletePatientDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                patientId={patientId}
                patientName={`${patient.firstName} ${patient.lastName}`}
            />
        </div>
    );
}
