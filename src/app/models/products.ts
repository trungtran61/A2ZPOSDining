export interface MenuCategory {
    CategoryID: number;
    Name: string;
    Position: number;
    ButtonColor: number;
    ButtonColorHex: string;
    ButtonForeColor: number;
    ButtonForeColorHex: string;
}

export interface MenuSubCategory {
    CategoryID: number;
    SubCategoryID: number;
    Name: string;
    Position: number;
    ButtonColor: number;
    ButtonColorHex: string;
    ButtonForeColor: number;
    ButtonForeColorHex: string;
    Class?: string;
    Row?: number;
    Col?: number;
}

export interface MenuProduct {
    CategoryID?: number;
    SubCategoryID?: number;
    ProductID?: number;
    Name: string;
    Position?: number;
    ProductCode?: number;
    ButtonColor?: number;
    ButtonColorHex?: string;
    ButtonForeColor?: number;
    ButtonForeColorHex?: string;
    UnitPrice?: number;
    UseModifier?: boolean;
    UseForcedModifier?: boolean;
    CountdownActivated?: boolean;
    QtyAvailable?: number;
    QtyAllocated?: number;
    TaxRate?: number;
    ProductType?: number;
    Taxable?: number;
    IgnoreTax?: boolean;
    PromptQty?: boolean;
    Disabled?: boolean;
    QtyClass?: string;
    Style?: string;
    Row?: number;
    Col?: number;
}

export interface CategoryCode {
    PriKey: number;
    CategoryCode1?: string;
    Description: string;
    PrintGroup?: number;
}

export interface Product {
    ProductCode?: number;
    ProductFilter?: number;
    ProductName?: string;
    UnitPrice?: number;
    PrintCode?: string;
    Taxable?: number;
    CategoryCode?: number;
    ProductGroup?: number;
    PrintCode1?: string;
    CouponCode?: any;
    GeneralCode?: any;
    Description?: any;
    AutoOption?: boolean;
    PrintName?: string;
    ForcedModifier?: boolean;
    UseForcedModifier?: boolean;
    ShowAutoOption?: boolean;
    UseUnitPrice2?: boolean;
    UnitPrice2?: number;
    Toppings?: number;
    Pizza?: boolean;
    ProductType?: number;
    TaxRate?: number;
    PromptQuantity?: boolean;
    ModifierIgnoreQuantity?: boolean;
    FractionalQuantity?: boolean;
}

export interface ProductCategory {
    PriKey: number;
    ProductFilter: number;
    Category: number;
    SubCategory: number;
    Position: number;
    ButtonColor: string;
    ButtonForeColor: string;
}

export interface Area {
    AreaID: number;
    Name: string;
    Position?: string;
    ImageURL?: string;
    OccupiedTables?: number;
}

export interface OccupiedCount {
    AreaID: number;
    Count: number;
}

export interface Table {
    AreaID: number;
    Name: string;
    Height: number;
    Width: number;
    PosX: number;
    PosY: number;
    TableType?: number;
}



export interface ForcedModifier {
    ProductCode: number;
    OptionCode: number;
    Charge: number;
    Layer: number;
    Position: number;
    ForcedOption: boolean;
    OptionFilter: number;
    ChoiceName: string;
    ReportProductMix: boolean;
}

export interface TableDetail {
    Checks: number;
    Covers: number;
    EmployeeID: number;
    EmployeeName: string;
    Height: number;
    Holds: boolean;
    Name: string;
    OrderFilter: number;
    OrderTime: string;
    PosX: number;
    PosY: number;
    Printed: boolean;
    Status: string[];
    TableColor: number;
    Width: number;
    Class?: string;
    ElapsedTime?: string;
    Opacity?: string;
}

export interface Option {
    PriKey: number;
    Name: string;
    Price: number;
    PrintName: string;
    CategoryCode: number;
}

export interface ChoiceLayer {
    Layer?: number;
    Name?: string;
    Choice?: MenuChoice;
    Class?: string;  
}

export interface MenuChoice {
    Charge?: number;
    ChoiceID?: number;
    ChoiceName?: string;
    ForcedChoice?: boolean;
    Layer?: number;
    Name?: string;
    Position?: number;
    ProductCode?: number;
    ReportProductMix?: boolean;
    SubOptions?: MenuSubOption[];
    Row?: number;
    Col?: number;  
    Class?: string;  
}

export interface OptionCategory {
    PriKey: number;
    Name: string;
}

export interface MenuSubOption {
    ApplyCharge: boolean;
    Charge: number;
    ChoiceID?: number;
    Layer: number;
    Name: string;
    Position: number;
    ReportProductMix: boolean;
    Row?: number;
    Col?: number;
    Selected?: boolean;
}

export interface ForcedModifier {
    Charge: number;
    ChoiceID?: number;
    ChoiceName: string;
    Layer: number;
    Name: string;
}

export interface ProductGroup {
    PriKey: number;
    Code: string;
    Description: string;
    TipShare?: boolean;
    TipSharePercentage: number;
    Printer: string;
    OpenProduct: boolean;
    ProductType: number;
    TaxRate: number;
    Taxable: boolean;
}

export interface OpenProductItem {
    ProductGroupId: number;
    ProductName: string;
    Quantity: number;
    UnitPrice: number;
}

export interface Memo {
    Memo: string;
    Price: number;
}

export enum MenuTimerTypes {
    Undefined = 0,
    Price = 1,
    Locked = 2,
    Default = 3,
}

export interface MenuTimer {
    PriKey?: number;
    Name?: string;
    Enabled?: boolean;
    HappyHourType?: number;
    PriceLevel?: number;
    StartTime?: string;
    EndTime?: string;
    CategoryToLock?: number;
    OverRideCategoryBar?: boolean;
    OverRideCategoryDineIn?: boolean;
    Mon?: boolean;
    Tue?: boolean;
    Wed?: boolean;
    Thu?: boolean;
    Fri?: boolean;
    Sat?: boolean;
    Sun?: boolean;
    TableService?: boolean;
    WalkIn?: boolean;
    TakeOut?: boolean;
    Bar?: boolean;
    PhoneIn?: boolean;
    QuickSale?: boolean;
    DefaultCategory?: any;
}

export interface Modifier {
    Name?: string;
    Price?: number;
    DisplayPrice?: number;
    SubOptions?: Modifier[];
}

export interface UserModifier {
    PriKey?: number;
    Position?: number;
    Modifier?: string;
    ApplyCharge?: boolean;
    Price?: number;
    ButtonFunction?: number;
    StampPrice?: boolean;
    TextPosition?: number;
    FontSize?: number;
    ItemName?: string;
    Class?: string;
}

export interface Choice {
    ChangeType: string;
    SelectedNumber: string;
}

export interface MenuOption {
    ApplyCharge?: boolean;
    Charge?: number;
    Name?: string;
    Position?: number;
    ProductCode?: number;
    ReportProductMix?: boolean;
    Row?: number;
    Col?: number;
}

export interface MenuSubOption {
    ApplyCharge: boolean;
    Charge: number;
    ChoiceID?: number;
    Layer: number;
    Name: string;
    Position: number;
    ReportProductMix: boolean;
}

export interface TaxRate {
    TaxID?: number;
    Name?: string;
    RateType?: number;
    EffectiveRate?: number;
    Disabled?: boolean;
    DateEntered?: string;
}
