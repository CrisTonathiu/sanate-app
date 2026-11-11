import type {Metadata} from 'next';
import Image from 'next/image';
import {BUSINESS} from '@/lib/legal';

export const metadata: Metadata = {
    title: 'Política de Privacidad | Zanate',
    description:
        'Aviso y política de privacidad de Zanate, plataforma de gestión nutricional.'
};

const LAST_UPDATED = '11 de noviembre de 2026';

function Section({
    title,
    children
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className='space-y-3'>
            <h2 className='text-xl font-semibold text-foreground'>{title}</h2>
            <div className='space-y-3 text-muted-foreground leading-relaxed'>
                {children}
            </div>
        </section>
    );
}

export default function PrivacyPolicyPage() {
    return (
        <main className='min-h-screen bg-background px-4 py-12'>
            <article className='mx-auto max-w-3xl space-y-10'>
                <header className='space-y-4 text-center'>
                    <Image
                        src='/zanate-logo.png'
                        alt='Zanate'
                        width={160}
                        height={160}
                        className='mx-auto h-20 w-auto object-contain'
                        priority
                    />
                    <h1 className='text-3xl font-bold text-foreground'>
                        Política de Privacidad
                    </h1>
                    <p className='text-sm text-muted-foreground'>
                        Última actualización: {LAST_UPDATED}
                    </p>
                </header>

                <Section title='1. Responsable del tratamiento de datos'>
                    <p>
                        <strong className='text-foreground'>
                            {BUSINESS.legalName}
                        </strong>{' '}
                        (en adelante, &quot;{BUSINESS.tradeName}&quot;), con
                        domicilio en {BUSINESS.address}, es responsable del
                        uso y protección de sus datos personales, conforme a
                        la Ley Federal de Protección de Datos Personales en
                        Posesión de los Particulares y demás normativa
                        aplicable en México.
                    </p>
                    <dl className='grid gap-2 rounded-lg border bg-card p-4 text-sm sm:grid-cols-[max-content_1fr] sm:gap-x-6'>
                        <dt className='font-medium text-foreground'>
                            Razón social
                        </dt>
                        <dd>{BUSINESS.legalName}</dd>
                        <dt className='font-medium text-foreground'>
                            Domicilio
                        </dt>
                        <dd>{BUSINESS.address}</dd>
                        <dt className='font-medium text-foreground'>
                            Teléfono de contacto
                        </dt>
                        <dd>
                            <a
                                href={`tel:+52${BUSINESS.phone}`}
                                className='underline underline-offset-4 hover:text-foreground'>
                                {BUSINESS.phoneDisplay}
                            </a>
                        </dd>
                    </dl>
                </Section>

                <Section title='2. Datos personales que recabamos'>
                    <p>
                        Para brindarle nuestros servicios de asesoría y
                        seguimiento nutricional podemos recabar las siguientes
                        categorías de datos:
                    </p>
                    <ul className='list-disc space-y-1 pl-6'>
                        <li>
                            Datos de identificación y contacto: nombre, correo
                            electrónico y número de teléfono (incluido su
                            número de WhatsApp).
                        </li>
                        <li>
                            Datos de salud y hábitos: medidas corporales,
                            signos vitales, condiciones médicas, alergias,
                            preferencias y restricciones alimentarias, así como
                            notas de consulta.
                        </li>
                        <li>
                            Contenido que usted nos comparte, como mensajes,
                            imágenes o documentos enviados a través de la
                            plataforma o de WhatsApp.
                        </li>
                        <li>
                            Datos técnicos de uso de la plataforma necesarios
                            para su funcionamiento y seguridad.
                        </li>
                    </ul>
                    <p>
                        Los datos de salud se consideran datos personales
                        sensibles y serán tratados con medidas de seguridad
                        reforzadas y únicamente con su consentimiento.
                    </p>
                </Section>

                <Section title='3. Finalidades del tratamiento'>
                    <ul className='list-disc space-y-1 pl-6'>
                        <li>
                            Crear y administrar su cuenta en la plataforma.
                        </li>
                        <li>
                            Elaborar planes de alimentación, recetas y
                            recomendaciones personalizadas.
                        </li>
                        <li>
                            Dar seguimiento a su progreso y a sus consultas
                            nutricionales.
                        </li>
                        <li>
                            Comunicarnos con usted por correo electrónico o
                            WhatsApp para enviarle información relacionada con
                            su plan, recordatorios y respuestas a sus
                            solicitudes.
                        </li>
                        <li>
                            Mantener la seguridad y mejorar el funcionamiento
                            de nuestros servicios.
                        </li>
                    </ul>
                </Section>

                <Section title='4. Uso de WhatsApp y servicios de terceros'>
                    <p>
                        Cuando usted nos contacta por WhatsApp, los mensajes se
                        procesan a través de la plataforma de WhatsApp Business
                        de Meta y de proveedores de mensajería autorizados.
                        Utilizamos su número de teléfono únicamente para
                        identificar su cuenta y responder a sus mensajes. No
                        enviamos publicidad no solicitada.
                    </p>
                    <p>
                        Para operar la plataforma nos apoyamos en proveedores
                        de servicios tecnológicos (alojamiento, base de datos,
                        envío de correos, mensajería y procesamiento de
                        información) que tratan los datos por cuenta nuestra y
                        bajo obligaciones de confidencialidad.
                    </p>
                </Section>

                <Section title='5. Transferencia de datos'>
                    <p>
                        No vendemos, alquilamos ni compartimos sus datos
                        personales con terceros para fines comerciales. Sus
                        datos solo podrán ser compartidos con los proveedores
                        mencionados para la prestación del servicio o cuando
                        lo requiera una autoridad competente conforme a la
                        ley.
                    </p>
                </Section>

                <Section title='6. Derechos ARCO y revocación del consentimiento'>
                    <p>
                        Usted tiene derecho a Acceder, Rectificar, Cancelar u
                        Oponerse (derechos ARCO) al tratamiento de sus datos
                        personales, así como a revocar su consentimiento en
                        cualquier momento. También puede solicitar la
                        eliminación de su cuenta y de sus datos.
                    </p>
                    <p>
                        Para ejercer cualquiera de estos derechos, comuníquese
                        al teléfono{' '}
                        <a
                            href={`tel:+52${BUSINESS.phone}`}
                            className='underline underline-offset-4 hover:text-foreground'>
                            {BUSINESS.phoneDisplay}
                        </a>{' '}
                        o acuda a nuestro domicilio. Atenderemos su solicitud
                        en un plazo máximo de 20 días hábiles.
                    </p>
                </Section>

                <Section title='7. Seguridad y conservación'>
                    <p>
                        Implementamos medidas de seguridad administrativas,
                        técnicas y físicas para proteger sus datos contra
                        daño, pérdida, alteración o acceso no autorizado.
                        Conservamos sus datos únicamente durante el tiempo
                        necesario para cumplir con las finalidades descritas y
                        con las obligaciones legales aplicables.
                    </p>
                </Section>

                <Section title='8. Cambios a esta política'>
                    <p>
                        Podemos actualizar esta política de privacidad. Cualquier
                        cambio será publicado en esta misma página, indicando la
                        fecha de la última actualización.
                    </p>
                </Section>

                <footer className='border-t pt-6 text-center text-sm text-muted-foreground'>
                    © {new Date().getFullYear()} {BUSINESS.legalName}. Todos
                    los derechos reservados.
                </footer>
            </article>
        </main>
    );
}
