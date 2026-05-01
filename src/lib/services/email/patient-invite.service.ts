import {createElement} from 'react';
import {PatientInviteEmail} from '@/emails/templates/patient-invite';
import {resend} from '@/lib/config/resend';

type SendPatientInviteEmailInput = {
    patientId: string;
    patientEmail: string;
    firstName?: string | null;
};

function getAppUrl() {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

function getFromEmail() {
    return process.env.RESEND_FROM_EMAIL || 'Sanate <onboarding@resend.dev>';
}

function resolveUrl(template: string, patientId: string) {
    return template.replace('{{patientId}}', patientId);
}

function getCreateAccountUrl(email: string) {
    return (
        process.env.PATIENT_ACCOUNT_SETUP_URL ||
        `${getAppUrl()}/registro?email=${encodeURIComponent(email)}`
    );
}

function getProfileUrl(patientId: string) {
    const template =
        process.env.PATIENT_PROFILE_URL ||
        `${getAppUrl()}/pacientes/{{patientId}}`;

    return resolveUrl(template, patientId);
}

export async function sendPatientInviteEmail({
    patientId,
    patientEmail,
    firstName
}: SendPatientInviteEmailInput) {
    return resend.emails.send({
        from: getFromEmail(),
        to: patientEmail,
        subject: 'Tu cuenta en Sanate',
        react: createElement(PatientInviteEmail, {
            firstName,
            createAccountUrl: getCreateAccountUrl(patientEmail),
            profileUrl: getProfileUrl(patientId)
        })
    });
}
