import {PatientField} from '@/lib/interface/patient-field-interface';
import DataField from './DataField';

export default function DataGrid({
    fields,
    delay = 0
}: {
    fields: PatientField[];
    delay?: number;
}) {
    return (
        <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'>
            {fields.map((field, i) => (
                <DataField
                    key={field.label}
                    field={field}
                    index={i}
                    delay={delay}
                />
            ))}
        </div>
    );
}
