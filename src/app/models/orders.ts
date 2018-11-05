import { MenuProduct, MenuChoice, Modifier } from "./products";

export interface Countdown {
    ProductFilter?: number;
    Quantity?: number;
    QuantityChange?: number;
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

export interface CheckItem {
    Product?: MenuProduct;
    Qty?: number;
    SeatNumber?: number;
    Price?: number;
    ForcedModifiers?: MenuChoice[]
    Modifiers?: Modifier[],
    Tag?: string,
    Refund?: boolean,
    Voided?: boolean,
    Comped?: boolean
}

export interface Order {
    CheckNumber: number;
    ServerID: number;
    TableName: string;
    Discount: number;
    TaxExempt: boolean;
    CheckItems: CheckItem[];
}
