import { Component, OnInit, ViewContainerRef } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { SwipeDirection } from "ui/gestures";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { CategoryCode, Product, CheckItem, Choice, MenuCategory, MenuSubCategory, MenuProduct } from "~/app/models/products";
import { SQLiteService } from "~/app/services/sqlite/sqlite.service";
import { ModalDialogService, ModalDialogOptions } from "nativescript-angular";
import { ModifyCheckItemComponent } from "~/app/home/menu/modify-check-item.component";
import { ForcedModifiersComponent } from "~/app/home/menu/forced-modifiers/forced-modifiers.component";

@Component({
    selector: "Menu",
    moduleId: module.id,
    templateUrl: "./menu.component.html",
    styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
    menuCategories: MenuCategory[] = [];    
    menuSubCategoriesOdd: MenuSubCategory[] = []; 
    menuSubCategoriesEven: MenuSubCategory[] = [];  
    menuSubCategoryOddStyles: string[] = [];
    menuSubCategoryEvenStyles: string[] = [];

    menuProducts1: MenuProduct[] = [];
    menuProducts2: MenuProduct[] = [];
    menuProducts3: MenuProduct[] = [];
    menuProduct1Styles: string[] = [];
    menuProduct2Styles: string[] = [];
    menuProduct3Styles: string[] = [];

    categoryCodes: CategoryCode[] = [];
    products: Product[] = [];
    checkItems: CheckItem[] = [];
    currentSeatNumber: 0;
    checkTotal: number = 0;
    subTotal: number = 0;
    tax: number = 0;
    discount: number = 0;
    tips: number = 0;
    guests: number = 0;
    table: string = '';
    server: string = 'Trung';
    checkNumber: string = 'CK#1';

    menuCategoryStyles: string[] = [];
    
    isMainCategories: boolean = true;  
    showProducts: boolean = false;  

    TAX_RATE: number = .08;
    MAX_GUESTS: number = 6;
    TIPS_PCT: number = .15;

    constructor(private router: RouterExtensions,
        private DBService: SQLiteService,
        private modalService: ModalDialogService,
        private viewContainerRef: ViewContainerRef) {
        // Use the component constructor to inject providers.

    }

    ngOnInit(): void {
        // Init your component properties here.
        this.guests = parseInt(localStorage.getItem('guests'));
        this.table = localStorage.getItem('table');
        //this.server = localStorage.getItem('server');
        //let that = this; // needed to access 'this' from callback
let that = this;
        if (this.isMainCategories)
        {
            this.DBService.getLocalMenuCategories().then((menuCategories) => {
                if (menuCategories.length == 0) {
                    dialogs.alert("Main Categories not loaded.").then(() => {
                        console.log("Dialog closed!");
                    });
                }
                else {
                    // activeStyle: string = "color: black;background-image: linear-gradient(darkred, red);";                    
                    this.menuCategories = menuCategories;  
                    //console.log(this.menuCategories);
                    menuCategories.forEach(function (menuCategory: MenuCategory) {
                        let darkColor: string =  menuCategory.ButtonColorHex;
                        let lightColor: string = that.lightenDarkenColor(darkColor, 50);
                        let style: string = "margin-top:15px;width: 500px;height: 120px;color: #" + menuCategory.ButtonForeColorHex + ";background-image: linear-gradient(#" + darkColor + ", #" + lightColor + ");";
                        //console.log(style);
                        that.menuCategoryStyles.push(style);
                    });
                }
            });
        }
        else
        {
        this.DBService.getLocalCategoryCodes().then((categoryCodes) => {
            if (categoryCodes.length == 0) {
                dialogs.alert("Category Codes not loaded.").then(() => {
                    console.log("Dialog closed!");
                });
            }
            else {
                this.categoryCodes = categoryCodes;
                this.categorySelected(this.categoryCodes[0].PriKey);
            }
        });

        }
    }

    menuCategorySelected(categoryID: number)
    {
        localStorage.setItem("CategoryID", categoryID.toString());
        //localStorage.setItem("CategoryID", "20");
        this.isMainCategories = false;
        let that = this;
        this.DBService.getLocalMenuSubCategories(categoryID).then((menuSubCategories) => {
            if (menuSubCategories.length == 0) {
                dialogs.alert("Menu SubCategories not loaded.").then(() => {
                    console.log("Dialog closed!");
                });
            }
            else {              
                this.menuSubCategoriesOdd = menuSubCategories.filter(function (menuSubCategory:MenuSubCategory) {
                    return (menuSubCategory.Position % 2 !== 0);
                });
                this.menuSubCategoriesEven = menuSubCategories.filter(function (menuSubCategory:MenuSubCategory) {
                    return (menuSubCategory.Position % 2 === 0);
                });

                this.loadMenuCategoryStyles(this.menuSubCategoriesOdd, this.menuSubCategoryOddStyles);
                this.loadMenuCategoryStyles(this.menuSubCategoriesEven, this.menuSubCategoryEvenStyles);
                this.menuSubCategorySelected(menuSubCategories[0].SubCategoryID);
            }
        });
    }
    
    loadMenuCategoryStyles(menuCategories: MenuCategory[], menuCategoryStyles: string[])
    {
        menuCategories.forEach(function (menuCategory:MenuCategory) {
            let darkColor: string =  menuCategory.ButtonColorHex;
            let lightColor: string = darkColor //that.lightenDarkenColor(darkColor, 50);
            let style: string = "color: #" + menuCategory.ButtonForeColorHex + ";background-image: linear-gradient(#" + darkColor + ", #" + lightColor + ");";                     
            menuCategoryStyles.push(style);
        });
    }

    menuSubCategorySelected(subCategoryID: number)
    {
        // build menu products list
        let that = this;
        let categoryID:number = parseInt(localStorage.getItem("CategoryID"));
        //subCategoryID = 50;

        this.DBService.getLocalMenuProducts(categoryID, subCategoryID).then((menuProducts) => {
            if (menuProducts.length == 0) {
                dialogs.alert("Menu Products not loaded.").then(() => {
                    console.log("Dialog closed!");
                });
            }
            else {              
                this.menuProducts1 = menuProducts.filter(function (menuProduct:MenuProduct) {
                    return (menuProduct.Position % 2 !== 0);
                });
                this.menuProducts2 = menuProducts.filter(function (menuProduct:MenuProduct) {
                    return (menuProduct.Position % 2 === 0);
                });
                this.menuProducts3 = menuProducts.filter(function (menuProduct:MenuProduct) {
                    return (menuProduct.Position % 3 === 0);
                });
                this.loadMenuProductStyles(this.menuProducts1, that.menuProduct1Styles);
                this.loadMenuProductStyles(this.menuProducts2, that.menuProduct2Styles);
                this.loadMenuProductStyles(this.menuProducts3, that.menuProduct3Styles);                     
            }
        });

        this.showProducts = true;
    }

    loadMenuProductStyles(menuProducts: MenuProduct[], menuProductStyles: string[])
    {
        menuProducts.forEach(function (menuProduct:MenuProduct) {
            let darkColor: string =  menuProduct.ButtonColorHex;
            let lightColor: string = darkColor //that.lightenDarkenColor(darkColor, 50);
            let style: string = "border-radius: 0px;color: #" + menuProduct.ButtonForeColorHex + ";background-image: linear-gradient(#" + darkColor + ", #" + lightColor + ");";                     
            menuProductStyles.push(style);
        });
    }
    
    shadeColor(color, percent) {   
        var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
        return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
    }

    // usage - col = "3F6D2A", amt = 10
    lightenDarkenColor(col,amt) {
        
        var num = parseInt(col,16);
        var r = (num >> 16) + amt;
        var b = ((num >> 8) & 0x00FF) + amt;
        var g = (num & 0x0000FF) + amt;
        var newColor = g | (b << 8) | (r << 16);
        return newColor.toString(16);
        
    }

    categorySelected(categoryCodeKey: number) {
        
        this.DBService.getLocalProducts(categoryCodeKey).then((products) => {
            if (products.length == 0) {
                dialogs.alert("Products not loaded for categoryCode: " + categoryCodeKey).then(() => {
                    console.log("Dialog closed!");
                });
            }
            else {
                this.products = products;
            }
        });
    }

    menuProductSelected(product: MenuProduct) {        

        if (product.UseForcedModifier)
        {
            this.showForcedModifierDialog(product, -1);
        }       
        //this.showProducts = false;
    }

    showForcedModifierDialog(product: MenuProduct, checkItemIndex:number)
    {
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: true,
            context: { productCode: product.ProductCode, currentChoices: checkItemIndex > -1 ? this.checkItems[checkItemIndex].ForcedModifiers : []}
        };

        this.modalService.showModal(ForcedModifiersComponent, modalOptions).then(
            (selectedChoices) => {
                if (selectedChoices != null)
                {
                    this.currentSeatNumber++;
                    this.checkItems.push({
                        "ProductName": product.Name, "UnitPrice": product.UnitPrice,
                        "Modifiers": [], "Qty": 1, "SeatNumber": 1, "Price": product.UnitPrice
                    });
                    this.totalPrice();               
                    this.checkItems[checkItemIndex].ForcedModifiers = selectedChoices;                
                }                
            });
    }

    showModifyDialog(checkItemIndex: number) {
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: false,
            //context: { changeType: changeType, currentOptions: currentOptions}
        };

        this.modalService.showModal(ModifyCheckItemComponent, modalOptions).then(
            (choice: Choice) => {
                console.log(choice.ChangeType);
                switch (choice.ChangeType) {
                    case 'quantity':
                        this.checkItems[checkItemIndex].Qty = parseFloat(choice.SelectedNumber);
                        this.checkItems[checkItemIndex].Price = this.checkItems[checkItemIndex].UnitPrice * parseFloat(choice.SelectedNumber);                        
                        this.totalPrice();
                        break;
                    case 'seat':
                        this.checkItems[checkItemIndex].SeatNumber = parseInt(choice.SelectedNumber);
                        break;
                    case 'delete':
                        this.deleteCheckItem(checkItemIndex);
                        break;
                    case 'repeat':
                        this.checkItems.push({
                            "ProductName": this.checkItems[checkItemIndex].ProductName, "UnitPrice": this.checkItems[checkItemIndex].UnitPrice,
                            "Modifiers": [], "Qty": 1, "SeatNumber": 1, "Price": this.checkItems[checkItemIndex].UnitPrice
                        });
                        this.totalPrice();
                        break;
                }
            });
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
                this.subTotal += (this.checkItems[i].UnitPrice * this.checkItems[i].Qty);
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
