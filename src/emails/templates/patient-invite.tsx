type PatientInviteEmailProps = {
    firstName?: string | null;
    createAccountUrl: string;
    profileUrl: string;
};

const containerStyle = {
    backgroundColor: '#f4f1ea',
    fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
    margin: 0,
    padding: '32px 16px',
    width: '100%'
};

const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    margin: '0 auto',
    maxWidth: '560px',
    overflow: 'hidden'
};

const contentStyle = {
    color: '#1f2937',
    padding: '40px 32px 32px'
};

const buttonRowStyle = {
    paddingTop: '24px'
};

const primaryButtonStyle = {
    backgroundColor: '#2f6f57',
    borderRadius: '999px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: 700,
    marginRight: '12px',
    padding: '12px 20px',
    textDecoration: 'none'
};

const secondaryButtonStyle = {
    border: '1px solid #d1d5db',
    borderRadius: '999px',
    color: '#1f2937',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: 700,
    marginTop: '12px',
    padding: '12px 20px',
    textDecoration: 'none'
};

const footerStyle = {
    color: '#6b7280',
    fontSize: '12px',
    lineHeight: 1.6,
    paddingTop: '24px'
};

export function PatientInviteEmail({
    firstName,
    createAccountUrl,
    profileUrl
}: PatientInviteEmailProps) {
    const greetingName = firstName?.trim() || 'Hola';

    return (
        <html>
            <body style={containerStyle}>
                <div style={cardStyle}>
                    <div
                        style={{
                            background:
                                'linear-gradient(135deg, #2f6f57 0%, #6fa88b 100%)',
                            color: '#ffffff',
                            padding: '32px'
                        }}>
                        <p
                            style={{
                                fontSize: '12px',
                                letterSpacing: '0.14em',
                                margin: 0,
                                textTransform: 'uppercase'
                            }}>
                            Sanate
                        </p>
                        <h1
                            style={{
                                fontSize: '30px',
                                lineHeight: 1.2,
                                margin: '16px 0 0'
                            }}>
                            Tu acceso ya esta listo
                        </h1>
                    </div>

                    <div style={contentStyle}>
                        <p
                            style={{
                                fontSize: '16px',
                                lineHeight: 1.7,
                                margin: 0
                            }}>
                            {greetingName}, tu solicitud de ingreso fue
                            aceptada. Ya puedes crear tu cuenta para entrar a
                            Sanate y revisar tu perfil.
                        </p>

                        <div style={buttonRowStyle}>
                            <a
                                href={createAccountUrl}
                                style={primaryButtonStyle}>
                                Crear cuenta
                            </a>
                            <a href={profileUrl} style={secondaryButtonStyle}>
                                Ver perfil
                            </a>
                        </div>

                        <p
                            style={{
                                fontSize: '14px',
                                lineHeight: 1.7,
                                margin: '24px 0 0'
                            }}>
                            Si ya tienes acceso, puedes iniciar sesion con tu
                            correo y continuar desde tu perfil.
                        </p>

                        <div style={footerStyle}>
                            <p style={{margin: 0}}>
                                Si los botones no funcionan, copia y pega estos
                                enlaces en tu navegador:
                            </p>
                            <p style={{margin: '8px 0 0'}}>
                                {createAccountUrl}
                            </p>
                            <p style={{margin: '4px 0 0'}}>{profileUrl}</p>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
