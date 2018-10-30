import { Component, OnInit, ViewContainerRef } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { SwipeDirection } from "ui/gestures";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { CategoryCode, Product, CheckItem, Choice, MenuCategory, MenuSubCategory, MenuProduct, MenuChoice, MenuOption, Modifier, OpenProductItem } from "~/app/models/products";
import { SQLiteService } from "~/app/services/sqlite/sqlite.service";
import { ModalDialogService, ModalDialogOptions } from "nativescript-angular";
import { ModifyCheckItemComponent } from "~/app/home/menu/modify-check-item.component";
import { ForcedModifiersComponent } from "~/app/home/menu/forced-modifiers/forced-modifiers.component";
import { Page } from "tns-core-modules/ui/page/page";
import { OpenProductComponent } from "./open-product/open-product.component";

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
    pageSubCategories: MenuCategory[] = [];
    totalSubCategoriesPages: number = 0;
    subCategoryCurrentPage: number = 1;
    subCategoryPageSize: number = 5;

    products: MenuProduct[] = [];    
    productStyles: string[] = [];
    productCols: number[] = [];
    productRows: number[] = [];
    pageProducts: MenuProduct[] = [];
    totalProductsPages: number = 0;
    productCurrentPage: number = 1;
    productPageSize: number = 20;

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
    showExtraFunctions: boolean = false;
    showProductInfo: boolean = false;
    productInfoClass: string = 'glass btnBottom';

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
                        let style: string = "color: #" + menuCategory.ButtonForeColorHex + ";background-image: linear-gradient(#" + darkColor + ", #" + lightColor + ");";
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
                this.subCategoryCurrentPage = 1;
                this.subCategories = subCategories;
        //        let startRecord: number = (pageNumber * pageSize) - pageSize + 1;
        //let endRecord: number = startRecord + pageSize - 1;
                this.totalSubCategoriesPages = Math.ceil(this.subCategories.length / this.subCategoryPageSize);

                this.pageSubCategories = this.subCategories.slice(0, 
                    this.subCategories.length >= this.subCategoryPageSize ? this.subCategoryPageSize :  this.subCategories.length - 1)
                this.loadCategoryStyles(this.pageSubCategories, this.subCategoryStyles);                

                this.pageSubCategories.forEach(function (subCategory: MenuSubCategory) {                   
                        that.subCategoryRows.push(subCategory.Position);                                        
                });
                this.subCategorySelected(subCategories[0]);
            }
        });
    }

    loadCategoryStyles(categories: MenuCategory[], categoryStyles: string[]) {
        categoryStyles = [];
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

                this.totalProductsPages = Math.ceil(this.products.length / this.productPageSize);

                this.pageProducts = this.products.slice(0, 
                    this.products.length >= this.productPageSize ? this.productPageSize :  this.products.length - 1)

                this.pageProducts.forEach(function (menuProduct: MenuProduct) {
                    that.productRows.push(Math.floor((menuProduct.Position -1 ) / 4) + 1);
                    that.productCols.push((menuProduct.Position - 1) % 4);
                });
                this.loadProductStyles(this.pageProducts, that.productStyles);                
            }
        });
        this.currentSubCategory = subCategory.Name;
        this.showProducts = true;
    }

    loadProductStyles(products: MenuProduct[], productStyles: string[]) {
        products.forEach(function (menuProduct: MenuProduct) {
            let darkColor: string = menuProduct.ButtonColorHex;
            let lightColor: string = darkColor //that.lightenDarkenColor(darkColor, 50);
            let style: string = "color: #" + menuProduct.ButtonForeColorHex + ";background-image: linear-gradient(#" + darkColor + ", #" + lightColor + ");";
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

        if (this.showProductInfo)
        {
            dialogs.alert({
                title: product.Name,
                message: "Good, healthy ingredients only!",
                okButtonText: "Close"
            })
            //this.showProductInfo = false;
            this.productInfo();
            return;
        }

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

    productInfo()
    {
        this.showProductInfo = !this.showProductInfo;
        if (this.showProductInfo)        
            this.productInfoClass = 'glass btnBottom btnOK';
        else
            this.productInfoClass = 'glass btnBottom';    
    }

    changeGuestsNumber()
    {
        this.router.navigate(['/home/tableguests/'+ this.table]);    
    }

    changeChoice(product: MenuProduct, checkItemIndex: number, choice: MenuChoice)
    {
        this.showForcedModifierDialog(product, checkItemIndex, choice, false);
    }

    addProductToCheck(product: MenuProduct)
    {
        this.checkItems.push({
            Modifiers: [], Qty: 1, SeatNumber: this.currentSeatNumber, Price: product.UnitPrice,
            Product: product
        });
        this.totalPrice();
    }   

    showOpenProduct()
    {
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: true,
            //context: { options: options, currentOptions: currentOptions}
        };

        this.modalService.showModal(OpenProductComponent, modalOptions).then(            
            (openProductItem : OpenProductItem) => {    
                this.showExtraFunctions = false;
                if (openProductItem != null)           
                    {
                        this.checkItems.push({
                            Modifiers: [], Qty: openProductItem.Quantity, SeatNumber: this.currentSeatNumber, 
                                Price: openProductItem.UnitPrice * openProductItem.Quantity,                                 
                                Product: {
                                    Name : openProductItem.ProductName,
                                    UnitPrice: openProductItem.UnitPrice,
                                    UseModifier: false,
                                    UseForcedModifier: false                                    
                                }
                        });
                        this.totalPrice();
                    }
            });
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

    extraFunctions()
    {
        this.showExtraFunctions = true;
    }

    closeExtraFunctions()
    {
        this.showExtraFunctions = false;
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

    cancelOrder()
    {       
        dialogs.confirm({
            title: "Cancel Order",
            message: "Cancel this order?",
            okButtonText: "Yes, cancel order",
            cancelButtonText: "No"
        }).then(isCanceling => {
            if (isCanceling)
                this.router.back();            
        });
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

    onSubCategorySwipe(args)
    {
        if (this.totalSubCategoriesPages <= 1 )
            return;
       
        // at last page, can only swipe down
        if (this.subCategoryCurrentPage == this.totalSubCategoriesPages)
        {
            if (args.direction == SwipeDirection.down ) {
                this.getSubCategoryPage(false);                          
            }
        }
        // at first page, can only swipe up
        else
        if (this.subCategoryCurrentPage == 1)
        {
            if (args.direction == SwipeDirection.up ) {
                this.getSubCategoryPage(true);                       
            }
        }
        // else, can swipe up or down
        else            
        if (this.subCategoryCurrentPage >= 1)
        {
            // go to next page            
            if (args.direction == SwipeDirection.up ) {                  
                this.getSubCategoryPage(true);                
            }
            else
            // go to previous page
            if (args.direction == SwipeDirection.down ) {
                this.getSubCategoryPage(false);                        
            }
        }

    }
    
    getSubCategoryPage(nextPage: boolean)
    {
        if (nextPage)
            this.subCategoryCurrentPage++;
        else
            this.subCategoryCurrentPage--;

        let startRecord: number = (this.subCategoryCurrentPage * this.subCategoryPageSize) - this.subCategoryPageSize;
        let endRecord: number = startRecord + this.subCategoryPageSize;
        
        if (endRecord > this.subCategories.length)       
            endRecord =  this.subCategories.length;
        
        this.pageSubCategories = this.subCategories.slice(startRecord, endRecord);
    }

    onProductSwipe(args)
    {
        if (this.totalProductsPages <= 1 )
            return;
       
        // at last page, can only swipe down
        if (this.productCurrentPage == this.totalProductsPages)
        {
            if (args.direction == SwipeDirection.right ) {
                this.getProductPage(false);                          
            }
        }
        // at first page, can only swipe up
        else
        if (this.productCurrentPage == 1)
        {
            if (args.direction == SwipeDirection.left ) {
                this.getProductPage(true);                       
            }
        }
        // else, can swipe up or down
        else            
        if (this.productCurrentPage >= 1)
        {
            // go to next page            
            if (args.direction == SwipeDirection.left ) {                  
                this.getProductPage(true);                
            }
            else
            // go to previous page
            if (args.direction == SwipeDirection.right ) {
                this.getProductPage(false);                        
            }
        }

    }
    
    getProductPage(nextPage: boolean)
    {
        if (nextPage)
            this.productCurrentPage++;
        else
            this.productCurrentPage--;

        let startRecord: number = (this.productCurrentPage * this.productPageSize) - this.productPageSize;
        let endRecord: number = startRecord + this.productPageSize;
        
        if (endRecord > this.products.length)       
            endRecord =  this.products.length;
        
        this.pageProducts = this.products.slice(startRecord, endRecord);
    }


    onCheckItemSwipe(args, checkItemIndex) {
        if (args.direction == SwipeDirection.left ) {
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