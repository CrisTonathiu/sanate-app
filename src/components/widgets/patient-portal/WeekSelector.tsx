'use client';

import {useState} from 'react';

interface DayData {
    dayName: string;
    date: number;
}

interface WeekSelectorProps {
    days?: DayData[];
    initialSelectedIndex?: number;
    onSelect?: (index: number, day: DayData) => void;
}

const defaultDays: DayData[] = [
    {dayName: 'Mon', date: 7},
    {dayName: 'Tue', date: 8},
    {dayName: 'Wed', date: 9},
    {dayName: 'Thu', date: 10},
    {dayName: 'Fri', date: 11},
    {dayName: 'Sat', date: 12},
    {dayName: 'Sun', date: 13}
];

export function WeekSelector({
    days = defaultDays,
    initialSelectedIndex = 3,
    onSelect
}: WeekSelectorProps) {
    const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);

    const handleSelect = (index: number) => {
        setSelectedIndex(index);
        onSelect?.(index, days[index]);
    };

    return (
        <div className='flex items-center justify-between gap-2 rounded-2xl bg-muted/50 px-4 py-4'>
            {days.map((day, index) => {
                const isSelected = index === selectedIndex;
                return (
                    <button
                        key={day.dayName}
                        onClick={() => handleSelect(index)}
                        className='flex flex-col items-center gap-2 focus:outline-none'>
                        <span
                            className={`text-sm font-medium ${
                                isSelected
                                    ? 'text-foreground'
                                    : 'text-muted-foreground'
                            }`}>
                            {day.dayName}
                        </span>
                        <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                                isSelected
                                    ? 'bg-amber-400 text-amber-950'
                                    : 'bg-background text-foreground hover:bg-muted'
                            }`}>
                            {day.date}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
