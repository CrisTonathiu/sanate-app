export type ShoppingCategory =
    | 'produce'
    | 'protein'
    | 'dairy'
    | 'grains'
    | 'other';

export type ShoppingItem = {
    id: string;
    name: string;
    quantity: string;
    category: ShoppingCategory;
};

export type WeeklyShoppingList = {
    id: string;
    weekNumber: number;
    dateRange: string;
    items: ShoppingItem[];
    isExpanded: boolean;
};

export type ShoppingListPayload = {
    weeklyLists: WeeklyShoppingList[];
    protocolWeekCount: number;
    activeProtocolWeekIndex: number;
};
