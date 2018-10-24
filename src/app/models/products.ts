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
}

export interface MenuProduct {
    CategoryID: number;
    SubCategoryID: number;
    ProductID: number;
    Name: string;
    Position: number;
    ProductCode: number;   
    ButtonColor: number;
    ButtonColorHex?: string;
    ButtonForeColor: number; 
    ButtonForeColorHex?: string; 
    UnitPrice?: number;
    UseModifier?: boolean;
    UseForcedModifier?: boolean;
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

export interface CheckItem {
    Product?: MenuProduct;
    Qty?: number;
    SeatNumber?: number;
    Price?: number;
    ForcedModifiers?: MenuChoice[]
    Modifiers?: Modifier[]
}

export interface Modifier {
    Name: string;
    Price: number;
}

export interface Choice {
    ChangeType: string;
    SelectedNumber: string;    
}

export interface MenuOption {
    ApplyCharge: boolean;
    Charge: number;
    Name: string;
    Position: number;
    ProductCode?: number;
    ReportProductMix?: boolean;
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

export interface TableDetail {
    Name: string;
    EmployeeID: string;
    EmployeeName: string;
    TableColor: string;  // white, gold, gray ...
    Sent: boolean; // UI will show check mark if this is true
    Hold: boolean; // UI will show hold icon if this is true
    PosX: number;
    PosY: number;
    Height: number;
    Width: number;
    Status: string[];
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
    EmployeeID: string;
    EmployeeName: string;
    Height: number;
    Holds: number;
    Name: string;
    OrderFilter: number;
    OrderTime: Date;
    PosX: number;
    PosY: number;
    Printed: boolean;
    TableColor: string;
    Width: number;
}

export interface Option {
    PriKey: number;
    Name: string;
    Price: number;
    PrintName: string;
    CategoryCode: number;
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
}

export interface ForcedModifier
{
    Charge: number;
    ChoiceID?: number;
    ChoiceName: string;
    Layer: number;
    Name: string;    
}

export interface TableCheck
{
    TableName: string;
    CheckItems: CheckItem[];    
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