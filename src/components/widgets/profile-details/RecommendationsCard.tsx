'use client';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Textarea} from '@/components/ui/textarea';
import {motion} from 'framer-motion';
import {Apple, Droplets, Lightbulb, Pill} from 'lucide-react';
import {AffiliateLinksCard} from './AffiliateLinksCard';
import {useState} from 'react';

interface AffiliateLink {
    id: string;
    name: string;
    url: string;
}

export default function RecommendationsCard() {
    const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);

    return (
        <motion.div
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            className='space-y-4'>
            <Card>
                <CardHeader className='pb-3'>
                    <CardTitle className='text-base flex items-center gap-2'>
                        <Lightbulb className='h-5 w-5 text-primary' />
                        Recomendaciones generales
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder='Ingresa recomendaciones dieteticas generales para el paciente...'
                        className='min-h-[120px] resize-none'
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader className='pb-3'>
                    <CardTitle className='text-base flex items-center gap-2'>
                        <Apple className='h-5 w-5 text-primary' />
                        Consejos de nutricion
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder='Ingresa consejos especificos de nutricion...'
                        className='min-h-[100px] resize-none'
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader className='pb-3'>
                    <CardTitle className='text-base flex items-center gap-2'>
                        <Droplets className='h-5 w-5 text-primary' />
                        Recomendaciones de hidratacion
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder='Ingresa pautas de hidratacion...'
                        className='min-h-[80px] resize-none'
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader className='pb-3'>
                    <CardTitle className='text-base flex items-center gap-2'>
                        <Pill className='h-5 w-5 text-primary' />
                        Suplementos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder='Ingresa recomendaciones de suplementos...'
                        className='min-h-[80px] resize-none'
                    />
                </CardContent>
            </Card>

            <AffiliateLinksCard
                links={affiliateLinks}
                setLinks={setAffiliateLinks}
            />
        </motion.div>
    );
}
