'use client';

import {User} from '@/lib/types/user-type';
import {useMutation, useQuery} from '@tanstack/react-query';

export function useGetUsers() {
    return useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await fetch('/api/users');
            if (!res.ok) {
                throw new Error('Failed to fetch users');
            }

            const resData = await res.json();
            return resData.data as User[];
        }
    });
}
