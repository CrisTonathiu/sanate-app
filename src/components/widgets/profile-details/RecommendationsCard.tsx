'use client';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Textarea} from '@/components/ui/textarea';
import {motion} from 'framer-motion';
import {Apple, Droplets, Lightbulb, Pill} from 'lucide-react';

export default function RecommendationsCard() {
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
                        defaultValue='1. Consumir comidas en horarios regulares para mantener niveles estables de glucosa
2. Incluir alimentos ricos en fibra en cada comida
3. Limitar alimentos procesados y azucares refinados
4. Practicar alimentacion consciente y control de porciones'
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
                        defaultValue='- Elegir granos enteros en lugar de granos refinados
- Incluir proteina magra en cada comida
- Llenar la mitad del plato con vegetales
- Leer las etiquetas nutricionales con cuidado'
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
                        defaultValue='Beber al menos 8 vasos (2 litros) de agua al dia. Aumentar la ingesta durante ejercicio o clima caluroso. Limitar bebidas azucaradas y cafeina.'
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
                        defaultValue='- Vitamina D: 1000 UI al dia
- Omega-3: 1000 mg al dia con las comidas
- Multivitaminico: 1 tableta al dia'
                    />
                </CardContent>
            </Card>
        </motion.div>
    );
}
