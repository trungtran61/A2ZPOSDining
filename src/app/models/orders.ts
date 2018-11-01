export interface CountDown {
    Activated?: boolean;
    ItemName?: string;
    PriKey?: number;
    Quantity?: number;
    QuantityChange?: number;
    TimeStamp?: number;
}

export enum OrderTypes {
    DineIn = 0,
    Here = 1,
    ToGo = 2,
    TakeOut = 3,
    BarQuickSale = 4,
    BarTab = 5,
    PickUp = 6,
    Delivery = 7,
    FastFood = 8
}
