import { Component, OnInit, ViewContainerRef } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { SwipeDirection } from "ui/gestures";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { CategoryCode, Product, MenuCategory, MenuSubCategory, MenuProduct, MenuChoice,  OpenProductItem, MenuTimerTypes, MenuTimer, MenuOption, Choice, Modifier } from "~/app/models/products";
import { SQLiteService } from "~/app/services/sqlite.service";
import { ModalDialogService, ModalDialogOptions } from "nativescript-angular";
import { ModifyCheckItemComponent } from "~/app/home/menu/modify-check-item.component";
import { ForcedModifiersComponent } from "~/app/home/menu/forced-modifiers/forced-modifiers.component";
import { Page } from "tns-core-modules/ui/page/page";
import { OpenProductComponent } from "./open-product/open-product.component";
import { DeprecatedDatePipe } from "@angular/common";
import { OrderTypes, Countdown, CheckItem } from "~/app/models/orders";
import { APIService } from "~/app/services/api.service";
import { count } from "rxjs/operators";
import { forkJoin } from "rxjs";
import { PromptQtyComponent } from "./prompt-qty.component";

@Component({
    selector: "Menu",
    moduleId: module.id,
    templateUrl: "./menu.component.html",
    styleUrls: ['./menu.component.css']
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
    //subCategoryClasses: string[] = [];

    products: MenuProduct[] = [];
    //productStyles: string[] = [];
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
    lockedCategoryId: number = 0;

    showMainCategories: boolean = true;
    showSubCategories: boolean = false;
    showOptions: boolean = false;
    showProducts: boolean = false;
    showDetails: boolean = true;
    showExtraFunctions: boolean = false;
    showProductInfo: boolean = false;
    productInfoClass: string = 'glass btnBottom fa';
    viewDetailsCode: string = String.fromCharCode(0xf06e) + ' View Details'
    hideDetailsCode: string = String.fromCharCode(0xf070) + ' Hide Details'

    viewDetailsText: string = this.hideDetailsCode;

    fixedOptions: string[] = ['NO', 'EXTRA', 'LESS', 'ADD', 'OTS', 'NO MAKE', '1/2', 'TO GO'];
    fixedOptionRows: number[] = [1, 2, 3, 4, 5, 6, 7, 8];
    fixedOptionStyles: string[] = [];

    currentCheckItemIndex: number = 0;
    currentFixedOption: string = '';
    countdowns: Countdown[] = [];
    allTimers: MenuTimer[] = [];

    TAX_RATE: number = .08;
    MAX_GUESTS: number = 6;
    TIPS_PCT: number = .15;

    qtyEntered: number = 1;

    orderType: number = OrderTypes.DineIn;

    constructor(private router: RouterExtensions,
        private DBService: SQLiteService,
        private modalService: ModalDialogService,
        private viewContainerRef: ViewContainerRef,
        private ApiSvc: APIService,
        private page: Page) {
        page.actionBarHidden = true;
        // Use the component constructor to inject providers.

    }

    ngOnInit(): void {
        /*
        this.guests = parseInt(localStorage.getItem('guests'));
        this.table = localStorage.getItem('table');
        this.server = localStorage.getItem('server');
        this.checkTitle = this.checkNumber + ' ' + this.server + ' ' + this.table + ' ' + this.guests;             
        */
        this.ApiSvc.reloadCountdowns().then(result => {
            this.countdowns = <Countdown[]>result;
            if (this.showMainCategories) {
                this.DBService.getLocalMenuCategories().then((categories) => {
                    if (categories.length == 0) {
                        dialogs.alert("Main Categories not loaded.");
                    }
                    else {
                        this.loadCategories(categories);
                    }
                });
            }
        }
        );

        this.getMenuTimers();

    }

    loadCategories(categories: MenuCategory[]) {
        let that = this;
        this.categories = categories;
        this.categories.forEach(function (menuCategory: MenuCategory) {
            let lightColor: string = '#' + menuCategory.ButtonColorHex;
            let darkColor: string = that.colorLuminance(lightColor, -.3);
            let style: string = "color: #" + menuCategory.ButtonForeColorHex + ";background-image: linear-gradient(" + darkColor + "," + lightColor + " 40%," + darkColor + " 95%);";
            that.categoryStyles.push(style);
        });

        // CategoryName is actually CategoryID
        if (this.DBService.systemSettings.AutoCategory) {
            this.categorySelected(this.categories.find(x => x.CategoryID == this.DBService.systemSettings.CategoryName));
        }
    }

    nextSeat() {
        this.currentSeatNumber++;
    }

    displayMainCategories() {
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
                this.subCategoryCurrentPage = 0;
                this.subCategories = subCategories;
                this.totalSubCategoriesPages = Math.ceil(this.subCategories.length / this.subCategoryPageSize);
                this.getSubCategoryPage(true);
                this.subCategorySelected(subCategories[0], 0);
            }
        });
    }

    setActiveSubCategoryClass(currentSubCategory: MenuSubCategory) {
        //this.subCategoryClasses = [];
        let that = this;

        this.pageSubCategories.forEach(function (menuSubCategory: MenuSubCategory) {
            menuSubCategory.Class = 'btnSubCategory'
            //that.subCategoryClasses.push('btnSubCategory');
        });
        currentSubCategory.Class = 'btnSubCategoryActive';
        //this.subCategoryClasses[currentIndex] = 'btnSubCategoryActive';
    }
/*
    loadCategoryStyles(categories: MenuCategory[], categoryStyles: string[]) {
        categoryStyles = [];
        categories.forEach(function (menuCategory: MenuCategory) {
            let darkColor: string = menuCategory.ButtonColorHex;
            let lightColor: string = this.colorLuminance(darkColor, 0.5);
            let style: string = "color: #" + menuCategory.ButtonForeColorHex + ";background-image: linear-gradient(#" + darkColor + ", #" + lightColor + ");";
            categoryStyles.push(style);
        });
    }
*/ 
    subCategorySelected(subCategory: MenuSubCategory, currentIndex: number) {
        // build menu products list        
        this.subCategoriesTitle = this.mainCategory + ' - ' + subCategory.Name;
        let that = this;
        let categoryID: number = parseInt(localStorage.getItem("CategoryID"));
        //subCategoryID = 50;
        this.productRows = [];
        this.productCols = [];
        /*
                Promise.all([
                    this.ApiSvc.reloadCountdowns(),
                    this.DBService.getLocalMenuProductsX(categoryID, subCategory.SubCategoryID)
                ]).then(value =>
                {   
                    //let countdowns: Countdown[] = <Countdown[]>value[0];     
                    this.products = <MenuProduct[]>value[1];
                    //let result = products.map(p => {
                    //    return Object.assign({}, p, countdowns.filter(cd => cd.PriKey === p.ProductID)[0]);
                    //});
                    console.log(value[0]);   
                    
                    //this.products = products;     
                    this.totalProductsPages = Math.ceil(this.products[that.products.length - 1].Position / this.productPageSize);
                    this.productCurrentPage = 0;
                    this.getProductPage(true);
                    
                    this.loadProductStyles(this.pageProducts, that.productStyles);
                    this.currentSubCategory = subCategory.Name;
                    this.showProducts = true;
                    this.setActiveSubCategoryClass(currentIndex);    
                    
                });
        */
        this.DBService.getLocalMenuProducts(categoryID, subCategory.SubCategoryID).then((products) => {
            if (products.length == 0) {
                dialogs.alert("Menu Products not loaded.")
            }
            else {
                this.products = products;
                this.totalProductsPages = Math.ceil(this.products[that.products.length - 1].Position / this.productPageSize);
                this.productCurrentPage = 0;
                this.getProductPage(true);
                this.setProductAttributes(this.pageProducts);
                this.currentSubCategory = subCategory.Name;
                this.showProducts = true;
                this.setActiveSubCategoryClass(subCategory);
            }
        });
    }

    setProductAttributes(products: MenuProduct[]) {
        let that = this;

        products.forEach(function (product: MenuProduct) {
            let lightColor: string = '#' + product.ButtonColorHex;
            //let lightColor: string = darkColor //that.lightenDarkenColor(darkColor, 50);
            let darkColor: string = that.colorLuminance(lightColor, -0.2);
            let style: string = "color: #" + product.ButtonForeColorHex + ";background-image: linear-gradient(" + darkColor + "," + lightColor + " 40%," + darkColor + " 95%);";
            product.Style = style;

            product.QtyClass = '';
            product.Disabled = false;
            product.CountdownActivated = false;

            let countdown = that.countdowns.find(p => p.ProductFilter == product.ProductID);

            if (countdown != null) {
                product.CountdownActivated = true; // countdown.Activated;
                product.QtyAvailable = countdown.Quantity;
                product.QtyAllocated = countdown.QuantityChange;

                if (product.QtyAvailable <= product.QtyAllocated)
                    product.QtyClass = 'qtyLow';
                else
                    product.QtyClass = 'qtyAvailable';    
                
                    product.Disabled = product.QtyAvailable == 0;
            }
        });
    }

     /*
    ColorLuminance("#69c", 0);		// returns "#6699cc"
    ColorLuminance("6699CC", 0.2);	// "#7ab8f5" - 20% lighter
    ColorLuminance("69C", -0.5);	// "#334d66" - 50% darker
    */

   colorLuminance(hex, lum) {

    // validate hex string
    hex = String(hex).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    lum = lum || 0;

    // convert to decimal and change luminosity
    var rgb = "#", c, i;
    for (i = 0; i < 3; i++) {
        c = parseInt(hex.substr(i * 2, 2), 16);
        c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
        rgb += ("00" + c).substr(c.length);
    }

    return rgb;
}
 
    productSelected(product: MenuProduct) {

        if (this.showProductInfo) {
            dialogs.alert({
                title: product.Name,
                message: "Good, healthy ingredients only!",
                okButtonText: "Close"
            })
            //this.showProductInfo = false;
            this.productInfo();
            return;
        }

        if (!product.PromptQty) {
            this.showPromptQty(product);
        }
        else
            if (product.UseForcedModifier) {
                this.showForcedModifierDialog(product, -1, null, true);
            }
            else {
                this.addProductToCheck(product);
            }
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
                    if (isAdding) {
                        this.addProductToCheck(product);
                    }
                    this.checkItems[this.checkItems.length - 1].ForcedModifiers = selectedChoices;
                }
            });
    }

    productInfo() {
        this.showProductInfo = !this.showProductInfo;
        if (this.showProductInfo)
            this.productInfoClass = 'glass btnBottom btnOK fa';
        else
            this.productInfoClass = 'glass btnBottom fa';
    }

    changeGuestsNumber() {
        this.router.navigate(['/home/tableguests/' + this.table]);
    }

    changeChoice(product: MenuProduct, checkItemIndex: number, choice: MenuChoice) {
        this.showForcedModifierDialog(product, checkItemIndex, choice, false);
    }

    addProductToCheck(product: MenuProduct) {
        this.checkItems.push({
            Modifiers: [], Qty: this.qtyEntered, SeatNumber: this.currentSeatNumber, Price: product.UnitPrice * this.qtyEntered,
            Product: product
        });
        this.totalPrice();
    }

    showOpenProduct() {
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: true,
            //context: { options: options, currentOptions: currentOptions}
        };

        this.modalService.showModal(OpenProductComponent, modalOptions).then(
            (openProductItem: OpenProductItem) => {
                this.showExtraFunctions = false;
                if (openProductItem != null) {
                    this.checkItems.push({
                        Modifiers: [], Qty: openProductItem.Quantity, SeatNumber: this.currentSeatNumber,
                        Price: openProductItem.UnitPrice * openProductItem.Quantity,
                        Product: {
                            Name: openProductItem.ProductName,
                            UnitPrice: openProductItem.UnitPrice,
                            UseModifier: false,
                            UseForcedModifier: false
                        }
                    });
                    this.totalPrice();
                }
            });
    }

    showPromptQty(product: MenuProduct) {
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: false,
            context: { product: product }
        };

        this.modalService.showModal(PromptQtyComponent, modalOptions).then(
            (qtyEntered: number) => {
                console.log(qtyEntered);
                if (qtyEntered != null) {
                    this.qtyEntered = qtyEntered;
                }
                if (product.UseForcedModifier) {
                    this.showForcedModifierDialog(product, -1, null, true);
                }
                else {
                    this.addProductToCheck(product);
                }
            });
    }

    showModifyDialog(checkItem: CheckItem, checkItemIndex: number) {
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: false,
            context: { checkItem: checkItem }
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

    resetFixedOptionStyles() {
        this.fixedOptionStyles = [];

        for (var i = 0; i < 8; i++) {
            this.fixedOptionStyles.push('background-image:linear-gradient(#000, silver);text-align: center; height: 118px;')
        }
    }

    extraFunctions() {
        this.showExtraFunctions = true;
    }

    closeExtraFunctions() {
        this.showExtraFunctions = false;
    }

    getMenuOptions(product: MenuProduct, itemIndex: number) {
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
                    that.optionRows.push(Math.floor((menuOption.Position - 1) / 4) + 1);
                    that.optionCols.push((menuOption.Position - 1) % 3);
                });

                this.showOptions = true;
                this.showMainCategories = false;
                this.showSubCategories = false;
            }
        });
    }

    fixedOptionSelected(option: string, index: number) {
        this.resetFixedOptionStyles();

        switch (option) {
            case 'NO MAKE':
            case 'TO GO':
                {
                    this.checkItems[this.currentCheckItemIndex].Modifiers.push({ Name: option, Price: 0 });
                    break;
                }
            default:
                {
                    this.currentFixedOption = option;
                    this.fixedOptionStyles[index] = 'background-image:linear-gradient(red, black);text-align: center; height: 118px;';
                }
        }
    }

    cancelOrder() {
        if (this.checkItems.length > 0) {
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
        else {
            this.router.back();
        }
    }

    optionSelected(option: MenuOption) {
        // currentFixedOption
        let modifier: Modifier = {
            Name: this.currentFixedOption + ' ' + option.Name,
            Price: option.Name == 'EXTRA' || option.Name == 'ADD' ? option.Charge : 0
        };

        this.checkItems[this.currentCheckItemIndex].Modifiers.push(modifier);
    }

    showHideDetails() {
        //console.log('whoo');
        this.showDetails = !this.showDetails;
        this.viewDetailsText = this.showDetails ? this.hideDetailsCode : this.viewDetailsCode;
    }

    doneOption() {
        this.showOptions = false;
        this.showProducts = true;
        this.showSubCategories = true;
    }

    onSubCategorySwipe(args) {
        if (this.totalSubCategoriesPages <= 1)
            return;

        // at last page, can only swipe down
        if (this.subCategoryCurrentPage == this.totalSubCategoriesPages) {
            if (args.direction == SwipeDirection.down) {
                this.getSubCategoryPage(false);
            }
        }
        // at first page, can only swipe up
        else
            if (this.subCategoryCurrentPage == 1) {
                if (args.direction == SwipeDirection.up) {
                    this.getSubCategoryPage(true);
                }
            }
            // else, can swipe up or down
            else
                if (this.subCategoryCurrentPage >= 1) {
                    // go to next page            
                    if (args.direction == SwipeDirection.up) {
                        this.getSubCategoryPage(true);
                    }
                    else
                        // go to previous page
                        if (args.direction == SwipeDirection.down) {
                            this.getSubCategoryPage(false);
                        }
                }

    }

    getSubCategoryPage(nextPage: boolean) {
        if (nextPage)
            this.subCategoryCurrentPage++;
        else
            this.subCategoryCurrentPage--;

        let startRecord: number = (this.subCategoryCurrentPage * this.subCategoryPageSize) - this.subCategoryPageSize;
        let endRecord: number = startRecord + this.subCategoryPageSize;

        if (endRecord > this.subCategories.length)
            endRecord = this.subCategories.length;

        this.pageSubCategories = this.subCategories.slice(startRecord, endRecord);

        let that = this;
        this.pageSubCategories.forEach(function (subCategory: MenuSubCategory) {
            that.subCategoryRows.push(subCategory.Position);
        });
    }

    onProductSwipe(args) {
        if (this.totalProductsPages <= 1)
            return;

        // at last page, can only swipe right
        if (this.productCurrentPage == this.totalProductsPages) {
            if (args.direction == SwipeDirection.right) {
                this.getProductPage(false);
            }
        }
        // at first page, can only swipe left
        else
            if (this.productCurrentPage == 1) {
                if (args.direction == SwipeDirection.left) {
                    this.getProductPage(true);
                }
            }
            // else, can swipe left or right
            else
                if (this.productCurrentPage >= 1) {
                    // go to next page            
                    if (args.direction == SwipeDirection.left) {
                        this.getProductPage(true);
                    }
                    else
                        // go to previous page
                        if (args.direction == SwipeDirection.right) {
                            this.getProductPage(false);
                        }
                }

    }

    getProductPage(nextPage: boolean) {
        if (nextPage)
            this.productCurrentPage++;
        else
            this.productCurrentPage--;

        let startPosition: number = (this.productCurrentPage * this.productPageSize) - this.productPageSize;
        let endPosition: number = startPosition + this.productPageSize;

        if (endPosition > this.products[this.products.length - 1].Position)
            endPosition = this.products[this.products.length - 1].Position;

        //this.pageProducts = this.products.slice(startRecord, endRecord);

        this.pageProducts = this.products.filter(
            product => product.Position >= startPosition && product.Position <= endPosition);

        let that = this;
        this.pageProducts.forEach(function (menuProduct: MenuProduct) {
            that.productRows.push(Math.floor((menuProduct.Position - 1) / 4) + 1);
            that.productCols.push((menuProduct.Position - 1) % 4);
        });
    }

    onCheckItemSwipe(args, checkItemIndex) {
        if (args.direction == SwipeDirection.left) {
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

    getMenuTimers() {
        let timers: MenuTimer[] = [];

        let that = this;
        this.DBService.getLocalMenuTimers().then((menuTimers) => {
            if (menuTimers.length == 0) {
                dialogs.alert("Missing Menu Timers");
            }
            else {
                this.allTimers = menuTimers;
            }
        });
    }

    convertToDate(date: string, time: string) {
        return new Date(date + ' ' + time);
    }

    addDays(date: Date, daysToAdd: number) {
        return new Date(date.getTime() + (daysToAdd * (1000 * 60 * 60 * 24)));
    }

    checkMenuTimer(timerType: MenuTimerTypes, overrideType: number, priceLevel: number, checkLocked: boolean): boolean {
        let checkMenuTimer: boolean = false;
        priceLevel = 0;
        let totalCategory: number = 0;
        let timers: MenuTimer[] = [];
        let _category = this.lockedCategoryId;

        if (timerType == MenuTimerTypes.Undefined) {
            timers = this.allTimers.filter(x => x.Enabled == true);

        }
        else if (timerType == MenuTimerTypes.Locked) {
            if (!checkLocked)
                timers = this.allTimers.filter(x => x.HappyHourType == timerType && x.Enabled == true);
            else {
                timers = this.allTimers.filter(x => x.CategoryToLock == _category && x.HappyHourType == timerType && x.Enabled == true)
                totalCategory = timers.length;
            }
        }
        else
            timers = this.allTimers.filter(x => x.HappyHourType == timerType && x.Enabled == true)

        if (timers.length == 0) {
            if (checkLocked == true)
                return true;
        }

        let today: Date = new Date();
        switch (today.getDay()) {
            case 1:
                timers = timers.filter(x => x.Mon == true);
                break;
            case 2:
                timers = timers.filter(x => x.Tue == true);
                break;
            case 3:
                timers = timers.filter(x => x.Wed == true);
                break;
            case 4:
                timers = timers.filter(x => x.Thu == true)
                break;
            case 5:
                timers = timers.filter(x => x.Fri == true)
                break;
            case 6:
                timers = timers.filter(x => x.Sat == true)
                break;
            case 0:
                timers = timers.filter(x => x.Sun == true)
                break;
        }

        //timers.forEach(function (timer: MenuTimer) {});
        timers.forEach(function (timer: MenuTimer) {
            // start time is later than end time 
            let date1: Date = new Date();
            let date2: Date = new Date();
            let now: Date = new Date();

            if (parseInt(timer.StartTime) > parseInt(timer.EndTime)) {
                if (now.getHours() <= parseInt(timer.EndTime.substr(0, 2))) {
                    date1 = this.convertToDate(this.AddDays(now, -1).toDateString(), timer.StartTime);
                    date2 = this.convertToDate(now.toDateString(), timer.EndTime);
                }
                else {
                    date1 = this.convertToDate(now.toDateString(), timer.StartTime);
                    date2 = this.convertToDate(this.AddDays(now, 1).toDateString(), timer.EndTime);
                }
            }
            else {
                date1 = this.convertToDate(now.toDateString(), timer.StartTime);
                date2 = this.convertToDate(now.toDateString(), timer.EndTime);
            }

            if (now > date1 && now <= date2) {
                switch (timerType) {
                    case MenuTimerTypes.Price:
                        priceLevel = timer.PriceLevel;
                        checkMenuTimer = true;
                        break;
                    case MenuTimerTypes.Locked:
                        if (!checkLocked) {
                            switch (overrideType) {
                                case 1:
                                    if (!timer.OverRideCategoryBar)
                                        checkMenuTimer = false;
                                    else {
                                        this.lockedCategoryId = timer.CategoryToLock;
                                        checkMenuTimer = true;
                                    }

                                    break;
                                case 2:
                                    if (!timer.OverRideCategoryDineIn)
                                        checkMenuTimer = false;
                                    else {
                                        this.lockedCategoryId = timer.CategoryToLock;
                                        checkMenuTimer = true;
                                    }

                                    break;
                            }
                            break;
                        }
                        else
                            return true;
                    case MenuTimerTypes.Default:
                        this.lockedCategoryId = timer.DefaultCategory;
                        switch (this.orderType) {
                            case OrderTypes.DineIn:
                                if (!timer.TableService)
                                    checkMenuTimer = false;
                                break;
                            case OrderTypes.Here:
                            case OrderTypes.ToGo:
                                if (!timer.WalkIn)
                                    checkMenuTimer = false;
                                break;
                            case OrderTypes.TakeOut:
                                if (!timer.TakeOut)
                                    checkMenuTimer = false;
                                break;
                            case OrderTypes.BarQuickSale:
                            case OrderTypes.BarTab:
                                if (!timer.Bar)
                                    checkMenuTimer = false;
                                break;
                            case OrderTypes.PickUp:
                            case OrderTypes.Delivery:
                                if (!timer.PhoneIn)
                                    checkMenuTimer = false;
                                break;
                            case OrderTypes.FastFood:
                                if (!timer.QuickSale)
                                    checkMenuTimer = false;
                                break;
                        }
                        return checkMenuTimer;
                }
            }
            else {
                if (timerType == MenuTimerTypes.Locked) {
                    if (checkLocked) {
                        if (this.lockedCategoryId != timer.CategoryToLock)
                            checkMenuTimer = true;
                        else {
                            checkMenuTimer = false;
                            if (totalCategory == 1)
                                return checkMenuTimer;
                        }
                    }
                }
            }
        });

        return checkMenuTimer;
    }

}