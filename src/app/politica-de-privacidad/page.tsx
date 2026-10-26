import type {Metadata} from 'next';
import {Card, CardContent} from '@/components/ui/card';

export const metadata: Metadata = {
    title: 'Aviso de Privacidad | Zanate',
    description:
        'Aviso de privacidad de Zanate: cómo recabamos, usamos y protegemos tus datos personales, incluyendo el uso de WhatsApp.'
};

const LAST_UPDATED = '17 de septiembre de 2026';

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
            <div className='space-y-3 text-sm leading-relaxed text-muted-foreground'>
                {children}
            </div>
        </section>
    );
}

export default function PrivacyPolicyPage() {
    return (
        <main className='mx-auto max-w-3xl px-4 py-12'>
            <div className='mb-8 space-y-2'>
                <h1 className='text-3xl font-bold text-foreground'>
                    Aviso de Privacidad
                </h1>
                <p className='text-sm text-muted-foreground'>
                    Última actualización: {LAST_UPDATED}
                </p>
            </div>

            <Card>
                <CardContent className='space-y-8 py-6'>
                    <Section title='1. Responsable del tratamiento de datos'>
                        <p>
                            Sánate ("Sánate", "nosotros") es responsable del
                            tratamiento de los datos personales que nos
                            proporcionas a través de nuestra plataforma web,
                            portal de pacientes y nuestro canal de WhatsApp.
                            Puedes contactarnos en{' '}
                            <a
                                className='underline'
                                href='mailto:nutricyndy02@gmail.com'>
                                nutricyndy02@gmail.com
                            </a>{' '}
                            para cualquier duda relacionada con el tratamiento
                            de tus datos personales.
                        </p>
                    </Section>

                    <Section title='2. Datos personales que recabamos'>
                        <p>
                            Dependiendo de cómo interactúas con nosotros,
                            podemos recabar:
                        </p>
                        <ul className='list-disc space-y-1 pl-5'>
                            <li>
                                Datos de identificación y contacto: nombre,
                                correo electrónico y número de teléfono
                                (incluyendo tu número de WhatsApp).
                            </li>
                            <li>
                                Datos de salud y nutrición: alergias,
                                condiciones médicas, planes de alimentación,
                                recetas, macronutrientes y notas de tu
                                nutrióloga. Estos son datos personales sensibles
                                y reciben protección reforzada.
                            </li>
                            <li>
                                Contenido de tus conversaciones por WhatsApp con
                                nuestro asistente automatizado, incluyendo
                                mensajes de texto y fotografías de menús que nos
                                envíes para su análisis.
                            </li>
                            <li>
                                Datos técnicos básicos de acceso a la plataforma
                                (por ejemplo, credenciales de inicio de sesión).
                            </li>
                        </ul>
                    </Section>

                    <Section title='3. Finalidades del tratamiento'>
                        <p>Utilizamos tus datos personales para:</p>
                        <ul className='list-disc space-y-1 pl-5'>
                            <li>
                                Brindarte el servicio de acompañamiento
                                nutricional contratado con tu nutrióloga.
                            </li>
                            <li>
                                Responder tus mensajes por WhatsApp: consultar
                                tu plan del día, macronutrientes, sustituciones
                                de ingredientes y analizar fotos de menús que
                                nos envíes.
                            </li>
                            <li>
                                Administrar tu cuenta y comunicarnos contigo por
                                correo electrónico (por ejemplo, invitaciones y
                                recuperación de contraseña).
                            </li>
                            <li>
                                Dar cumplimiento a obligaciones legales y
                                mejorar la seguridad de la plataforma.
                            </li>
                        </ul>
                        <p>
                            No utilizamos tus datos de salud ni el contenido de
                            tus conversaciones de WhatsApp con fines
                            publicitarios o de mercadotecnia.
                        </p>
                    </Section>

                    <Section title='4. Uso de WhatsApp y terceros encargados'>
                        <p>
                            Nuestro asistente de WhatsApp opera a través de la
                            API de WhatsApp Business de Meta. Al escribirnos por
                            WhatsApp, tus mensajes son procesados por Meta
                            conforme a sus propias políticas de privacidad,
                            además de por Zanate para generar tu respuesta.
                        </p>
                        <p>
                            Para operar la plataforma trabajamos con proveedores
                            que procesan datos en nuestro nombre (encargados),
                            entre ellos:
                        </p>
                        <ul className='list-disc space-y-1 pl-5'>
                            <li>
                                <span className='font-medium'>
                                    Meta / WhatsApp Business Platform
                                </span>{' '}
                                — envío y recepción de mensajes de WhatsApp.
                            </li>
                            <li>
                                <span className='font-medium'>OpenAI</span> —
                                análisis de fotografías de menús que envías por
                                WhatsApp, para ayudarte a comparar tu plan de
                                alimentación.
                            </li>
                            <li>
                                <span className='font-medium'>Supabase</span> —
                                alojamiento de base de datos y autenticación de
                                tu cuenta.
                            </li>
                            <li>
                                <span className='font-medium'>Resend</span> —
                                envío de correos transaccionales (por ejemplo,
                                invitaciones y restablecimiento de contraseña).
                            </li>
                        </ul>
                        <p>No vendemos tus datos personales a terceros.</p>
                    </Section>

                    <Section title='5. Conservación de datos'>
                        <p>
                            Conservamos tus datos personales mientras mantengas
                            una relación activa con tu nutrióloga a través de
                            Zanate, y posteriormente durante el plazo necesario
                            para cumplir con obligaciones legales o resolver
                            cualquier responsabilidad derivada del tratamiento.
                        </p>
                    </Section>

                    <Section title='6. Derechos ARCO'>
                        <p>
                            Tienes derecho a Acceder, Rectificar, Cancelar u
                            Oponerte (derechos ARCO) al tratamiento de tus datos
                            personales, así como a revocar tu consentimiento en
                            cualquier momento. Para ejercer estos derechos,
                            escríbenos a{' '}
                            <a
                                className='underline'
                                href='mailto:nutricyndy02@gmail.com'>
                                nutricyndy02@gmail.com
                            </a>{' '}
                            indicando tu nombre completo y la solicitud
                            específica.
                        </p>
                    </Section>

                    <Section title='7. Seguridad'>
                        <p>
                            Implementamos medidas administrativas, técnicas y
                            físicas razonables para proteger tus datos
                            personales contra daño, pérdida, alteración,
                            destrucción o uso no autorizado.
                        </p>
                    </Section>

                    <Section title='8. Cambios a este aviso de privacidad'>
                        <p>
                            Podemos actualizar este aviso de privacidad en
                            cualquier momento. Publicaremos la versión vigente
                            en esta misma página, indicando la fecha de la
                            última actualización.
                        </p>
                    </Section>

                    <Section title='9. Contacto'>
                        <p>
                            Si tienes dudas sobre este aviso de privacidad o
                            sobre el tratamiento de tus datos personales,
                            contáctanos en{' '}
                            <a
                                className='underline'
                                href='mailto:nutricyndy02@gmail.com'>
                                nutricyndy02@gmail.com
                            </a>
                            .
                        </p>
                    </Section>
                </CardContent>
            </Card>
        </main>
    );
}
