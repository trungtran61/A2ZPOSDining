import { Component, OnInit, ViewContainerRef } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { SwipeDirection } from "ui/gestures";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { CategoryCode, Product, CheckItem, Choice, MenuCategory, MenuSubCategory, MenuProduct, MenuChoice, MenuOption, Modifier } from "~/app/models/products";
import { SQLiteService } from "~/app/services/sqlite/sqlite.service";
import { ModalDialogService, ModalDialogOptions } from "nativescript-angular";
import { ModifyCheckItemComponent } from "~/app/home/menu/modify-check-item.component";
import { ForcedModifiersComponent } from "~/app/home/menu/forced-modifiers/forced-modifiers.component";
import { Page } from "tns-core-modules/ui/page/page";

@Component({
    selector: "Menu",
    moduleId: module.id,
    templateUrl: "./menu.component.html",
    styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
    categories: MenuCategory[] = [];
    categoryStyles: string[] = [];

    subCategories: MenuCategory[] = [];
    subCategoryStyles: string[] = [];
    subCategoryCols: number[] = [];
    subCategoryRows: number[] = [];

    products: MenuProduct[] = [];    
    productStyles: string[] = [];
    productCols: number[] = [];
    productRows: number[] = [];

    menuOptions: MenuOption[];
    optionCols: number[] = [];
    optionRows: number[] = [];

    categoryCodes: CategoryCode[] = [];
    checkItems: CheckItem[] = [];
    currentSeatNumber: number = 1;
    checkTotal: number = 0;
    subTotal: number = 0;
    tax: number = 0;
    discount: number = 0;
    tips: number = 0;
    guests: number = 0;
    table: string = '';
    server: string = 'Trung';
    checkNumber: string = 'CK#1';   
    checkTitle: string = '';
    currentSubCategory: string = ''; 
    subCategoriesTitle: string = '';
    mainCategory: string = '';

    showMainCategories: boolean = true;
    showSubCategories: boolean = false;
    showOptions: boolean = false;        
    showProducts: boolean = false;
    showDetails: boolean = true;
    viewDetailsText: string = 'Hide Details';

    fixedOptions: string[] = ['NO','EXTRA','LESS','ADD','OTS','NO MAKE','1/2','TO GO'];
    fixedOptionRows: number[] = [1,2,3,4,5,6,7,8];
    fixedOptionStyles: string[] = [];

    currentCheckItemIndex: number = 0;
    currentFixedOption: string = '';
  
    TAX_RATE: number = .08;
    MAX_GUESTS: number = 6;
    TIPS_PCT: number = .15;

    constructor(private router: RouterExtensions,
        private DBService: SQLiteService,
        private modalService: ModalDialogService,
        private viewContainerRef: ViewContainerRef,
        private page: Page) {
            page.actionBarHidden = true;
        // Use the component constructor to inject providers.

    }

    ngOnInit(): void {
        // Init your component properties here.        
        this.guests = parseInt(localStorage.getItem('guests'));
        this.table = localStorage.getItem('table');
        //this.server = localStorage.getItem('server');
        this.checkTitle = this.checkNumber + ' ' + this.server + ' ' + this.table + ' ' + this.guests;
        //let that = this; // needed to access 'this' from callback
        let that = this;
        if (this.showMainCategories) {
            this.DBService.getLocalMenuCategories().then((categories) => {
                if (categories.length == 0) {
                    dialogs.alert("Main Categories not loaded.").then(() => {
                        console.log("Dialog closed!");
                    });
                }
                else {
                    // activeStyle: string = "color: black;background-image: linear-gradient(darkred, red);";                    
                    this.categories = categories;
                    //console.log(this.menuCategories);
                    this.categories.forEach(function (menuCategory: MenuCategory) {
                        let darkColor: string = menuCategory.ButtonColorHex;
                        let lightColor: string = that.lightenDarkenColor(darkColor, 50);
                        let style: string = "margin-top:15px;width: 500px;height: 120px;color: #" + menuCategory.ButtonForeColorHex + ";background-image: linear-gradient(#" + darkColor + ", #" + lightColor + ");";
                        //console.log(style);
                        that.categoryStyles.push(style);
                    });
                }
            });
        }
        /*
        else {
            this.DBService.getLocalCategoryCodes().then((categoryCodes) => {
                if (categoryCodes.length == 0) {
                    dialogs.alert("Category Codes not loaded.").then(() => {
                        console.log("Dialog closed!");
                    });
                }
                else {
                    this.categoryCodes = categoryCodes;
                    this.categorySelected(this.categoryCodes[0]);
                }
            });
        }
        */
    }

    nextSeat()
    {
        this.currentSeatNumber++;
    }

    displayMainCategories()
    {
        this.showMainCategories = true;
        this.showSubCategories = false;
        this.showOptions = false;
    }

    categorySelected(category: MenuCategory) {
        localStorage.setItem("CategoryID", category.CategoryID.toString());
        //localStorage.setItem("CategoryID", "20");
        this.showMainCategories = false;
        this.showSubCategories = true;     
        this.showOptions = false;           
        let that = this;
        this.subCategoryRows = [];
        this.mainCategory = category.Name;

        this.DBService.getLocalMenuSubCategories(category.CategoryID).then((subCategories) => {
            if (subCategories.length == 0) {
                dialogs.alert("Menu SubCategories not loaded.").then(() => {
                    console.log("Dialog closed!");
                });
            }
            else {
                this.subCategories = subCategories;
                this.loadCategoryStyles(this.subCategories, this.subCategoryStyles);
                this.subCategories.forEach(function (subCategory: MenuSubCategory) {
                    that.subCategoryRows.push(subCategory.Position);                    
                });
                this.subCategorySelected(subCategories[0]);
            }
        });
    }

    loadCategoryStyles(categories: MenuCategory[], categoryStyles: string[]) {
        categories.forEach(function (menuCategory: MenuCategory) {
            let darkColor: string = menuCategory.ButtonColorHex;
            let lightColor: string = darkColor //that.lightenDarkenColor(darkColor, 50);
            let style: string = "color: #" + menuCategory.ButtonForeColorHex + ";background-image: linear-gradient(#" + darkColor + ", #" + lightColor + ");";
            categoryStyles.push(style);
        });
    }

    subCategorySelected(subCategory: MenuSubCategory) {
        // build menu products list
        this.subCategoriesTitle = this.mainCategory + ' - ' + subCategory.Name;
        let that = this;
        let categoryID: number = parseInt(localStorage.getItem("CategoryID"));
        //subCategoryID = 50;
        this.productRows = [];
        this.productCols = [];

        this.DBService.getLocalMenuProducts(categoryID, subCategory.SubCategoryID).then((products) => {
            if (products.length == 0) {
                dialogs.alert("Menu Products not loaded.").then(() => {
                    console.log("Dialog closed!");
                });
            }
            else {
                this.products = products;
                this.products.forEach(function (menuProduct: MenuProduct) {
                    that.productRows.push(Math.floor((menuProduct.Position -1 ) / 4) + 1);
                    that.productCols.push((menuProduct.Position - 1) % 4);
                });
                this.loadProductStyles(this.products, that.productStyles);                
            }
        });
        this.currentSubCategory = subCategory.Name;
        this.showProducts = true;
    }

    loadProductStyles(products: MenuProduct[], productStyles: string[]) {
        products.forEach(function (menuProduct: MenuProduct) {
            let darkColor: string = menuProduct.ButtonColorHex;
            let lightColor: string = darkColor //that.lightenDarkenColor(darkColor, 50);
            let style: string = "border-radius: 0px;color: #" + menuProduct.ButtonForeColorHex + ";background-image: linear-gradient(#" + darkColor + ", #" + lightColor + ");";
            productStyles.push(style);
        });
    }

    shadeColor(color, percent) {
        var f = parseInt(color.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
        return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
    }

    // usage - col = "3F6D2A", amt = 10
    lightenDarkenColor(col, amt) {

        var num = parseInt(col, 16);
        var r = (num >> 16) + amt;
        var b = ((num >> 8) & 0x00FF) + amt;
        var g = (num & 0x0000FF) + amt;
        var newColor = g | (b << 8) | (r << 16);
        return newColor.toString(16);

    }   

    productSelected(product: MenuProduct) {

        if (product.UseForcedModifier) {
            this.showForcedModifierDialog(product, -1, null, true);
        }
        else
        {
            this.addProductToCheck(product); 
        }
        //this.showProducts = false;
    }

    showForcedModifierDialog(product: MenuProduct, checkItemIndex: number, choice, isAdding: boolean) {
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: true,
            context: { productCode: product.ProductCode, currentChoices: checkItemIndex > -1 ? this.checkItems[checkItemIndex].ForcedModifiers : [] }
        };

        this.modalService.showModal(ForcedModifiersComponent, modalOptions).then(
            (selectedChoices) => {
                if (selectedChoices != null) {
                    this.currentSeatNumber++;
                    if (isAdding)
                    {
                        this.addProductToCheck(product);                    
                    }
                    this.checkItems[this.checkItems.length-1].ForcedModifiers = selectedChoices;                    
                }
            });
    }

    changeChoice(product: MenuProduct, checkItemIndex: number, choice: MenuChoice)
    {
        this.showForcedModifierDialog(product, checkItemIndex, choice, false);
    }

    addProductToCheck(product: MenuProduct)
    {
        this.checkItems.push({
            Modifiers: [], Qty: 1, SeatNumber: 1, Price: product.UnitPrice,
            Product: product
        });
        this.totalPrice();
    }   

    showModifyDialog(checkItem: CheckItem, checkItemIndex: number) {
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: false,
            context: { checkItem: checkItem}
        };
       
        this.modalService.showModal(ModifyCheckItemComponent, modalOptions).then(
            (choice: Choice) => {
                console.log(choice.ChangeType);
                switch (choice.ChangeType) {
                    case 'quantity':
                        checkItem.Qty = parseFloat(choice.SelectedNumber);
                        checkItem.Price = checkItem.Product.UnitPrice * parseFloat(choice.SelectedNumber);
                        this.totalPrice();
                        break;
                    case 'seat':
                        checkItem.SeatNumber = parseInt(choice.SelectedNumber);
                        break;
                    case 'delete':
                        this.deleteCheckItem(checkItemIndex);
                        break;
                    case 'repeat':
                        this.checkItems.push({
                            "Product": checkItem.Product,
                            "Modifiers": [], "Qty": 1, "SeatNumber": 1,
                            "Price": checkItem.Product.UnitPrice
                        });
                        this.totalPrice();
                        break;
                    case 'modify':
                        this.getMenuOptions(checkItem.Product, checkItemIndex);                        
                        break;
                }
            });
    }

    resetFixedOptionStyles()
    {
        this.fixedOptionStyles = [];

        for (var i = 0; i < 8; i++)
        {
            this.fixedOptionStyles.push('background-image:linear-gradient(#000, silver);text-align: center; height: 118px;')
        }
    }

    getMenuOptions(product: MenuProduct, itemIndex: number)    
    {
        this.currentCheckItemIndex = itemIndex;
        this.resetFixedOptionStyles();

        let that = this;
        this.DBService.getLocalMenuOptions(product.ProductCode).then((menuOptions) => {
            if (menuOptions.length == 0) {
                dialogs.alert("Missing Menu Options");
            }
            else {
                this.menuOptions = menuOptions; 
                this.menuOptions.forEach(function (menuOption: MenuOption) {
                    that.optionRows.push(Math.floor((menuOption.Position -1 ) / 4) + 1);
                    that.optionCols.push((menuOption.Position - 1) % 3);                    
                });                

                this.showOptions = true;   
                this.showMainCategories = false;
                this.showSubCategories = false;                               
            }
        });
    }

    fixedOptionSelected(option: string, index: number)
    {
        this.resetFixedOptionStyles();

        switch (option)
        {
            case 'NO MAKE':                
            case 'TO GO':
            {
                this.checkItems[this.currentCheckItemIndex].Modifiers.push({ Name:option, Price: 0 });                            
                break;                    
            }    
            default:
            {
                this.currentFixedOption = option;
                this.fixedOptionStyles[index] = 'background-image:linear-gradient(red, black);text-align: center; height: 118px;';
            }
        }        
    }

    optionSelected(option: MenuOption)
    {
        // currentFixedOption
        let modifier: Modifier = { Name: this.currentFixedOption + ' ' + option.Name, 
                Price: option.Name == 'EXTRA' || option.Name == 'ADD' ? option.Charge : 0 };        

        this.checkItems[this.currentCheckItemIndex].Modifiers.push(modifier);                            
    }

    showHideDetails()
    {
        //console.log('whoo');
        this.showDetails = !this.showDetails;
        this.viewDetailsText = this.showDetails? 'Hide Details' : 'View Details';
    }

    doneOption(){
        this.showOptions = false;
        this.showProducts = true;
        this.showSubCategories = true;
    }

    onSwipe(args, checkItemIndex) {
        let direction = args.direction == SwipeDirection.down ? "down" :
            args.direction == SwipeDirection.up ? "up" :
                args.direction == SwipeDirection.left ? "left" : "right";

        if (direction == 'left') {
            this.deleteCheckItem(checkItemIndex);
        }

    }

    deleteCheckItem(checkItemIndex: number) {
        this.checkItems.splice(checkItemIndex, 1);
        this.totalPrice();
    }

    totalPrice() {
        this.subTotal = 0;

        for (var i = 0; i < this.checkItems.length; i++) {
            {
                this.subTotal += (this.checkItems[i].Product.UnitPrice * this.checkItems[i].Qty);
            }
            this.tax = this.subTotal * this.TAX_RATE;
            this.checkTotal = this.subTotal + this.tax;

            if (this.guests >= this.MAX_GUESTS) {
                this.tips = this.subTotal * this.TIPS_PCT;
                this.checkTotal += this.tips;
            }
        }
    }

    showModifierDialog(checkItemIndex: number) {
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: true,
            //context: { options: options, currentOptions: currentOptions}
        };

        this.modalService.showModal(ModifyCheckItemComponent, modalOptions).then(
            (selectedModifiers) => {
                if (this.checkItems[checkItemIndex].Modifiers.length == 0)
                    this.checkItems[checkItemIndex].Modifiers = selectedModifiers;
                else
                    this.checkItems[checkItemIndex].Modifiers = this.checkItems[checkItemIndex].Modifiers.concat(selectedModifiers);
            });
    }
}