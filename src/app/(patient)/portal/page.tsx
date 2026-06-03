import {User, FileText, ShoppingBag, Video} from 'lucide-react';
import {getCurrentUser} from '@/lib/auth/getCurrentUser';
import {PortalDailyMeals} from '@/components/widgets/patient-portal/PortalDailyMeals';
import Link from 'next/link';
import PortalHeader from '@/components/widgets/patient-portal/PortalHeader';
import {loadWeekProtocolMeals} from '@/lib/services/patient/patient-meal-by-type.service';
import {AffiliateProducts} from '@/components/widgets/patient-portal/AffiliateProducts';
import type {AffiliateLink} from '@/components/widgets/profile-details/AffiliateLinksCard';
import {prisma} from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DAY_SHORT_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function parseAffiliateLinks(value: unknown): AffiliateLink[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter(
        (item): item is AffiliateLink =>
            typeof item === 'object' &&
            item !== null &&
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            typeof item.url === 'string' &&
            item.name.trim().length > 0 &&
            item.url.trim().length > 0
    );
}

function getMondayOfCurrentWeek(now: Date) {
    const start = new Date(now);
    const mondayIndex = (now.getDay() + 6) % 7;
    start.setDate(now.getDate() - mondayIndex);
    return start;
}

async function getPortalData() {
    const user = await getCurrentUser();
    if (!user || user.role !== 'PATIENT') {
        return null;
    }

    const patient = await prisma.patient.findUnique({
        where: {userId: user.id},
        select: {
            id: true,
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatarUrl: true
                }
            }
        }
    });

    if (!patient) {
        return null;
    }

    const protocol = await prisma.protocol.findFirst({
        where: {
            patientId: patient.id,
            status: 'ACTIVE'
        },
        orderBy: {createdAt: 'desc'},
        select: {
            affiliateLinks: true
        }
    });

    if (!protocol) {
        return null;
    }

    const {weekPlan, protocolWeekCount, activeProtocolWeekIndex} =
        await loadWeekProtocolMeals(user.id);

    if (weekPlan.length === 0) {
        return null;
    }

    const monday = getMondayOfCurrentWeek(new Date());
    const weekDays = Array.from({length: 7}, (_, dayIndex) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + dayIndex);

        return {
            dayName: DAY_SHORT_NAMES[dayIndex] || `Dia ${dayIndex + 1}`,
            date: date.getDate()
        };
    });

    const todayIndex = (new Date().getDay() + 6) % 7;
    const affiliateLinks = parseAffiliateLinks(protocol.affiliateLinks);

    return {
        patient,
        weekPlan,
        weekDays,
        todayIndex,
        affiliateLinks,
        protocolWeekCount,
        activeProtocolWeekIndex
    };
}

const portalCards = [
    {
        title: 'Informacion personal',
        description: 'Consulta y actualiza los detalles de tu perfil',
        icon: User,
        path: '/portal/perfil'
    },
    {
        title: 'Videos',
        description: 'Accede a videos educativos sobre nutricion y bienestar',
        icon: Video,
        path: '/portal/videos'
    },
    {
        title: 'Documentos',
        description: 'Accede a tus expedientes y reportes medicos',
        icon: FileText,
        path: '/portal/documentos'
    },
    {
        title: 'Lista de compras',
        description: 'Lista de compras basada en tu plan de comidas',
        icon: ShoppingBag,
        path: '/portal/compras'
    }
];

export default async function PatientPortal() {
    const data = await getPortalData();

    const patientName = data
        ? `${data.patient.user.firstName} ${data.patient.user.lastName}`.trim()
        : 'Paciente';

    return (
        <main className='min-h-screen bg-background'>
            <div className='mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8'>
                <PortalHeader
                    avatarUrl={data?.patient.user.avatarUrl ?? ''}
                    name={patientName}
                />

                {data ? (
                    <>
                        {data.protocolWeekCount > 1 ? (
                            <p className='mb-4 text-sm text-muted-foreground'>
                                Semana {data.activeProtocolWeekIndex + 1} de{' '}
                                {data.protocolWeekCount} de tu plan
                            </p>
                        ) : null}
                        <PortalDailyMeals
                            weekPlan={data.weekPlan}
                            weekDays={data.weekDays}
                            initialDayIndex={data.todayIndex || 0}
                        />
                    </>
                ) : null}

                <AffiliateProducts
                    affiliateLinks={data?.affiliateLinks ?? []}
                />

                <section className='mt-8'>
                    <div className='mb-4 flex items-center justify-between'>
                        <div>
                            <h2 className='text-lg font-semibold text-foreground'>
                                Productos recomendados
                            </h2>
                            <p className='text-sm text-muted-foreground'></p>
                        </div>
                    </div>

                    <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                        {portalCards.map(card => (
                            <Link
                                href={card.path}
                                key={card.title}
                                className='group cursor-pointer rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md'>
                                <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10'>
                                    <card.icon className='h-6 w-6 text-primary' />
                                </div>
                                <h2 className='text-lg font-medium text-card-foreground'>
                                    {card.title}
                                </h2>
                                <p className='mt-1 text-sm text-muted-foreground'>
                                    {card.description}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
