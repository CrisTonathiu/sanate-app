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

/** Names-only shopping list item for the full protocol PDF (no quantities). */
export type PlanShoppingListItem = {
    id: string;
    name: string;
    category: ShoppingCategory;
};

/** Names-only shopping list for a single protocol week in the full plan PDF. */
export type PlanWeeklyShoppingList = {
    weekNumber: number;
    items: PlanShoppingListItem[];
};
