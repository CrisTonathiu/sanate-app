import Image from 'next/image';

const WHATSAPP_BUTTON_SRC = '/whatsapp-zanate-button.png';

function ZanateWhatsAppLink({className}: {className?: string}) {
    const href = process.env.NEXT_PUBLIC_ZANATE_WHATSAPP_URL?.trim();
    const image = (
        <Image
            src={WHATSAPP_BUTTON_SRC}
            alt='Zánate Bot. Abre una conversación'
            width={600}
            height={200}
            className='h-16 w-auto max-w-full object-contain'
            priority
        />
    );

    if (!href) {
        return <div className={className}>{image}</div>;
    }

    return (
        <a
            href={href}
            target='_blank'
            rel='noopener noreferrer'
            className={className}
            aria-label='Abrir conversación con Zánate Bot en WhatsApp'>
            {image}
        </a>
    );
}

export function ZanateWhatsAppButton() {
    return (
        <>
            <div className='flex justify-center px-4 pb-6 pt-8 md:hidden'>
                <ZanateWhatsAppLink />
            </div>
            <div className='pointer-events-none fixed bottom-6 right-6 z-40 hidden md:block'>
                <ZanateWhatsAppLink className='pointer-events-auto block drop-shadow-md transition-transform hover:scale-[1.02]' />
            </div>
        </>
    );
}
