import { MenuProduct, MenuChoice, Modifier } from "./products";
import { Observable } from "rxjs";
import { ObservableArray } from "tns-core-modules/data/observable-array/observable-array";

export interface Countdown {
    ProductFilter?: number;
    Quantity?: number;
    QuantityChange?: number;
}

export enum FunctionType {
    DineIn = 1,    
    BarQuickSale = 2,
    BarTab = 3,
    TakeOut = 4,    
    PhoneIn = 5,
    FastFood = 6,    
    Delivery = 7,    
    WalkIn = 8,
    DriveThru = 9
}

export enum OrderType
    {
        DineIn = 1,
        BarTab = 2,
        BarQuickSale = 3,
        TakeOut = 4,
        Delivery = 5,
        PickUp = 6,
        Here = 7,
        ToGo = 8,
        DriveThru = 9,
        FastFood = 10,
        Waste = 11,
        WalkIn = 12
    }

export enum ItemType {
    Product = 1,   
    Option = 2,
    Choice = 3,
    ForcedChoice = 4,
    SubOption = 5,
    Discount = 6
}

export enum ModifierType
{
    NONE = 0,
    NO = 1,
    EXTRA = 2,
    LESS = 3,
    ADD = 4,
    ONTHESIDE = 5,
    NOMAKE = 6,
    HALF = 7,
    TOGO = 8,
    USERDEFINED = 255,
}

export interface FunctionTypeDetail {
    Name: string,
    FunctionType: FunctionType,
    Row?: number,
    Col?: number,
    Class?: string
}
/*
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
*/
export interface myOption{
    Name: string;
}

export interface OrderUpdate {
    order?: OrderHeader;
    orderdetails?:  OrderDetail[];
}

export interface FixedOption {
    Name?: string;
    Position?: number;
    Class?: string;    
    ModifierType?: ModifierType;
}

export interface OrderHeader {
    OrderFilter?: number;
    Phone?: any;
    Name?: string;
    OrderID?: number;
    TableNumber?: string;
    CheckNumber?: number;
    Total?: number;
    Status?: any;
    Discount?: number;
    Cash?: any;
    CheckTender?: any;
    EmployeeID?: number;
    Charge?: any;
    TotalCash?: number;
    TotalCheck?: number;
    tag?: any;
    Tendered?: any;
    CurrentDate?: Date;
    CurrentTime?: Date;
    Void?: any;
    VoidedBy?: number;
    CashedOut?: any;
    NumberGuests?: number;
    Tax?: number;
    TimeOrder?: Date;
    TimePrint?: any;
    TimeSettle?: any;
    Area?: number;
    TransType?: number;
    CompAmount?: number;
    DiscountID?: number;
    CouponMessage?: any;
    DeliveryZone?: any;
    Delivery?: number;
    PaymentType?: any;
    Extras?: any;
    Credit?: number;
    VoidReason?: any;
    DiscountAmountOriginal?: number;
    DiscountAmountRecall?: number;
    DiscountTypeOriginal?: any;
    DiscountTypeRecall?: any;
    CouponTypeOriginal?: number;
    CouponTypeRecall?: number;
    DiscountIDOriginal?: number;
    DiscountIDRecall?: number;
    DiscountReason?: any;
    CompReason?: any;
    CouponReason?: any;
    DiscountType?: any;
    DiscountType1?: any;
    Gratuity?: number;
    CashedOut1?: any;
    CollectorID?: number;
    OriginalAmount?: number;
    VoidServerID?: number;
    VoidTime?: any;
    DiscountTime?: any;
    DiscountTimeRecall?: any;
    DiscountServerID?: number;
    DiscountServerIDRecall?: number;
    ReopenedTicket?: boolean;
    SendToRegister?: boolean;
    PickUpDate?: any;
    WarningDate?: any;
    Deposit?: number;
    TimeWarning?: any;
    CashoutTime?: any;
    TerminalNumber?: any;
    StoreNumber?: any;
    DeliverID?: number;
    OutTime?: any;
    InTime?: any;
    MessageReceived?: boolean;
    Transmedia?: number;
    ReTender?: boolean;
    ReTenderReason?: any;
    ReOpenReason?: any;
    GratuityManual?: boolean;
    ChangeAmount?: number;
    TenderType?: number;
    Transferred?: boolean;
    TimeClosed?: any;
    TicketNumber?: any;
    ClosedRecorded?: boolean;
    VoidRecorded?: boolean;
    ClientName?: string;
    OrderCreationTime?: Date;
    TaxExempt?: boolean;
    OLOOrderID?: number;
    OLOMessageSent?: boolean;
    InitialOrderTime?: any;
    Delayed?: any;
    DelayTime?: any;
}

export interface OrderDetail {
    PriKey?:number;
    FilterNumber?:number;
    OrderFilter?:number;
    ProductFilter?:number;
    ProductCode?:number;
    IndexData?:number;
    ProductName?:string;
    Quantity?:number;
    UnitPrice?:number;
    ExtPrice?:number;
    PrintCode?:string;
    Printed?:string;
    Tag?:any;
    Voided?:any;
    Taxable?:number;
    CategoryCode?:number;
    ProductGroup?:number;
    Comped?:boolean;
    DeleteID?:any;
    CompID?:any;
    CouponCode?:number;
    Reprint?:number;
    PrintName?:string;
    SubCategory?:any;
    EmployeeID?:number;
    PrintCode1?:string;
    SeatNumber?:string;
    DeleteReason?:any;
    CompTime?:any;
    CompTimeRecall?:any;
    DeleteTime?:any;
    CompIDRecall?:any;
    CompServerID?:any;
    CompServerIDRecall?:any;
    DeleteServerID?:any;
    IndexDataOption?:number;
    Side?:any;
    OptionCode?:number;
    Pizza?:boolean;
    Toppings?:number;
    Refund?:boolean;
    RefundReason?:any;
    CompReason?:any;
    HappyHour?:boolean;
    ItemType?: ItemType;
    PriceLevel?:number;
    OrderTime?:Date;
    ClientName?:string;
    ExcludeFromInventory?:boolean;
    ProductType?:number;
    TaxRate?:number;
    CouponID?:any;
    ItemDiscountID?:any;
    ItemDiscountReason?:any;
    Paid?:boolean;
    PaymentType?:any;
    PaymentLink?:any;
    IgnoreTax?:boolean;
    SplitQuantity?:any;
    IndexDataSub?:number;
    UseModifier?:boolean;
    MarginLeft?:number;
    Class?: string;
    ReportProductMix?: boolean;
    ApplyCharge?: boolean;
}

export interface OrderResponse {
    Order: OrderHeader;
    OrderDetail: OrderDetail[];
    Payments: any[];
}

export interface Reason {
    PriKey?: number;
    Reason?: string;
    Row?: number;
    Col?: number;
    Class?: string;
}