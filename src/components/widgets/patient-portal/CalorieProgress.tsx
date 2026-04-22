'use client';

interface MacroCircleProps {
    value: number;
    label: string;
    color: string;
    max: number;
}

function MacroCircle({value, label, color, max}: MacroCircleProps) {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const strokeDasharray = 2 * Math.PI * 28;
    const strokeDashoffset =
        strokeDasharray - (strokeDasharray * percentage) / 100;

    return (
        <div className='flex flex-col items-center'>
            <div className='relative h-20 w-20'>
                <svg className='h-20 w-20 -rotate-90' viewBox='0 0 64 64'>
                    <circle
                        cx='32'
                        cy='32'
                        r='28'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='4'
                        className='text-muted/30'
                    />
                    <circle
                        cx='32'
                        cy='32'
                        r='28'
                        fill='none'
                        stroke={color}
                        strokeWidth='4'
                        strokeLinecap='round'
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                    />
                </svg>
                <div className='absolute inset-0 flex items-center justify-center'>
                    <span className='text-sm font-semibold text-foreground'>
                        {value}g
                    </span>
                </div>
            </div>
            <span className='mt-2 text-xs text-muted-foreground'>{label}</span>
        </div>
    );
}

interface CalorieProgressProps {
    consumed: number;
    goal: number;
    logs: number;
    protein: {current: number; max: number};
    carbs: {current: number; max: number};
    fat: {current: number; max: number};
}

export function CalorieProgress({
    consumed,
    goal,
    logs,
    protein,
    carbs,
    fat
}: CalorieProgressProps) {
    const left = Math.max(goal - consumed, 0);
    const percentage = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;

    // Arc properties
    const radius = 90;
    const strokeWidth = 12;
    const circumference = Math.PI * radius; // Semi-circle
    const strokeDashoffset = circumference - (circumference * percentage) / 100;

    return (
        <div className='mb-10 rounded-xl border border-border bg-card p-6'>
            <h2 className='mb-6 text-center text-xl font-medium text-foreground'>
                Great job today
            </h2>

            <div className='flex items-center justify-center gap-8'>
                {/* Left stat */}
                <div className='text-center'>
                    <p className='text-2xl font-bold text-foreground'>{left}</p>
                    <p className='text-sm text-muted-foreground'>Left</p>
                </div>

                {/* Main arc */}
                <div className='relative'>
                    <svg
                        width='200'
                        height='120'
                        viewBox='0 0 200 120'
                        className='overflow-visible'>
                        {/* Background arc */}
                        <path
                            d='M 10 110 A 90 90 0 0 1 190 110'
                            fill='none'
                            stroke='hsl(var(--muted))'
                            strokeWidth={strokeWidth}
                            strokeLinecap='round'
                            opacity='0.3'
                        />
                        {/* Gradient definition */}
                        <defs>
                            <linearGradient
                                id='calorieGradient'
                                x1='0%'
                                y1='0%'
                                x2='100%'
                                y2='0%'>
                                <stop offset='0%' stopColor='#f59e0b' />
                                <stop offset='50%' stopColor='#f97316' />
                                <stop offset='100%' stopColor='#ef4444' />
                            </linearGradient>
                        </defs>
                        {/* Progress arc */}
                        <path
                            d='M 10 110 A 90 90 0 0 1 190 110'
                            fill='none'
                            stroke='url(#calorieGradient)'
                            strokeWidth={strokeWidth}
                            strokeLinecap='round'
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                        />
                    </svg>
                    {/* Center text */}
                    <div className='absolute inset-0 flex flex-col items-center justify-center pt-4'>
                        <span className='text-4xl font-bold text-foreground'>
                            {consumed}
                        </span>
                        <span className='text-sm text-muted-foreground'>
                            Calories
                        </span>
                    </div>
                </div>

                {/* Logs stat */}
                <div className='text-center'>
                    <p className='text-2xl font-bold text-foreground'>{logs}</p>
                    <p className='text-sm text-muted-foreground'>Logs</p>
                </div>
            </div>

            {/* Macro circles */}
            <div className='mt-8 flex justify-center gap-10'>
                <MacroCircle
                    value={protein.current}
                    label='Protein'
                    color='#a3a3a3'
                    max={protein.max}
                />
                <MacroCircle
                    value={carbs.current}
                    label='Carbs'
                    color='#f59e0b'
                    max={carbs.max}
                />
                <MacroCircle
                    value={fat.current}
                    label='Fat'
                    color='#a855f7'
                    max={fat.max}
                />
            </div>
        </div>
    );
}
