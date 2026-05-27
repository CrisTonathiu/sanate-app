type AuthEmailProps = {
    title: string;
    body: string;
    confirmUrl: string;
    ctaLabel: string;
    token?: string;
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

const primaryButtonStyle = {
    backgroundColor: '#2f6f57',
    borderRadius: '999px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: 700,
    marginTop: '24px',
    padding: '12px 20px',
    textDecoration: 'none'
};

const footerStyle = {
    color: '#6b7280',
    fontSize: '12px',
    lineHeight: 1.6,
    paddingTop: '24px'
};

const codeStyle = {
    backgroundColor: '#f4f4f4',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    display: 'inline-block',
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '0.2em',
    marginTop: '12px',
    padding: '12px 16px'
};

export function AuthEmail({
    title,
    body,
    confirmUrl,
    ctaLabel,
    token
}: AuthEmailProps) {
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
                            Zanate
                        </p>
                        <h1
                            style={{
                                fontSize: '28px',
                                lineHeight: 1.2,
                                margin: '16px 0 0'
                            }}>
                            {title}
                        </h1>
                    </div>

                    <div style={contentStyle}>
                        <p
                            style={{
                                fontSize: '16px',
                                lineHeight: 1.7,
                                margin: 0
                            }}>
                            {body}
                        </p>

                        <a href={confirmUrl} style={primaryButtonStyle}>
                            {ctaLabel}
                        </a>

                        {token ? (
                            <p
                                style={{
                                    fontSize: '14px',
                                    lineHeight: 1.7,
                                    margin: '24px 0 0'
                                }}>
                                Tambien puedes ingresar este codigo:
                                <br />
                                <span style={codeStyle}>{token}</span>
                            </p>
                        ) : null}

                        <div style={footerStyle}>
                            <p style={{margin: 0}}>
                                Si el boton no funciona, copia y pega este
                                enlace en tu navegador:
                            </p>
                            <p
                                style={{
                                    margin: '8px 0 0',
                                    wordBreak: 'break-all'
                                }}>
                                {confirmUrl}
                            </p>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
