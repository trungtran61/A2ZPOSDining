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

export interface OrderItem {
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
    IgnoreTax?: boolean,
    ExtPrice?: number
}

export interface myOption{
    Name: string;
}

export interface Order {
    CheckNumber?: number;
    ServerID?: number;
    TableName?: string;
    Discount?: number;
    TaxExempt?: boolean;
    Gratuity?: number;
    OrderItems?: OrderItem[];
}

export interface FixedOption {
    Name?: string;
    Position?: number;
    Class?: string;    
}