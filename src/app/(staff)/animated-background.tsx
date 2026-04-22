'use client';

import {motion} from 'framer-motion';

export default function AnimatedBackground() {
    return (
        <motion.div
            className='absolute inset-0 -z-10 opacity-20'
            animate={{
                background: [
                    'radial-gradient(circle at 50% 50%, rgba(120, 41, 190, 0.5) 0%, rgba(53, 71, 125, 0.5) 50%, rgba(0, 0, 0, 0) 100%)',
                    'radial-gradient(circle at 30% 70%, rgba(233, 30, 99, 0.5) 0%, rgba(81, 45, 168, 0.5) 50%, rgba(0, 0, 0, 0) 100%)',
                    'radial-gradient(circle at 70% 30%, rgba(76, 175, 80, 0.5) 0%, rgba(32, 119, 188, 0.5) 50%, rgba(0, 0, 0, 0) 100%)',
                    'radial-gradient(circle at 50% 50%, rgba(120, 41, 190, 0.5) 0%, rgba(53, 71, 125, 0.5) 50%, rgba(0, 0, 0, 0) 100%)'
                ]
            }}
            transition={{
                duration: 30,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'linear'
            }}
        />
    );
}
