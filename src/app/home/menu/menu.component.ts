import { Component, OnInit, ViewContainerRef, ViewChild } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { SwipeDirection } from "ui/gestures";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { CategoryCode, Product, MenuCategory, MenuSubCategory, MenuProduct, MenuChoice, OpenProductItem, MenuTimerTypes, MenuTimer, MenuOption, Choice, Modifier, TaxRate, UserModifier, Memo, ForcedModifier } from "~/app/models/products";
import { SQLiteService } from "~/app/services/sqlite.service";
import { ModalDialogService, ModalDialogOptions, ListViewComponent } from "nativescript-angular";
import { ModifyOrderItemComponent } from "~/app/home/menu/modify-order-item.component";
import { ForcedModifiersComponent } from "~/app/home/menu/forced-modifiers/forced-modifiers.component";
import { Page } from "tns-core-modules/ui/page/page";
import { OpenProductComponent } from "./open-product/open-product.component";
import { DeprecatedDatePipe } from "@angular/common";
import { OrderTypes, Countdown, OrderItem, Order, FixedOption } from "~/app/models/orders";
import { APIService } from "~/app/services/api.service";
import { count } from "rxjs/operators";
import { forkJoin, from } from "rxjs";
import { PromptQtyComponent } from "./prompt-qty.component";
import { on } from "tns-core-modules/application/application";
import { nullSafeIsEquivalent } from "@angular/compiler/src/output/output_ast";
import { MemoComponent } from "./memo.component";
import { NullTemplateVisitor } from "@angular/compiler";
import { ListView } from "tns-core-modules/ui/list-view/list-view";
import { UtilityService } from "~/app/services/utility.service";
import { ObservableArray } from "tns-core-modules/data/observable-array/observable-array";

@Component({
    selector: "Menu",
    moduleId: module.id,
    templateUrl: "./menu.component.html",
    styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
    categories: MenuCategory[] = [];
    categoryStyles: string[] = [];

    subCategories: MenuSubCategory[] = [];
    subCategoryStyles: string[] = [];
    pageSubCategories: MenuSubCategory[] = [];
    totalSubCategoriesPages: number = 0;
    subCategoryCurrentPage: number = 1;
    subCategoryPageSize: number = 5;
    //subCategoryClasses: string[] = [];

    products: MenuProduct[] = [];
    pageProducts: MenuProduct[] = [];

    totalProductPages: number = 0;
    productCurrentPage: number = 1;
    productPageSize: number = 20;

    menuOptions: MenuOption[];
    pageOptions: MenuOption[];
    totalOptionPages: number = 0;
    optionCurrentPage: number = 1;
    optionPageSize: number = 20;
    userModifiers: UserModifier[]; // bottom row user defined options

    categoryCodes: CategoryCode[] = [];
    order: Order = null;
    //orderItems: OrderItem[] = [];
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
    currentProduct: MenuProduct;


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

    fixedOptions: FixedOption[] = [{ Name: 'NO', Class: 'glass btnOption', Position: 1 }, { Name: 'EXTRA', Class: 'glass btnOption', Position: 2 }, { Name: 'LESS', Class: 'glass btnOption', Position: 3 }, { Name: 'ADD', Class: 'glass btnOption', Position: 4 },
    { Name: 'OTS', Class: 'glass btnOption', Position: 5 }, { Name: 'NO MAKE', Class: 'glass btnOption', Position: 5 }, { Name: '1/2', Class: 'glass btnOption', Position: 6 }, { Name: 'TO GO', Class: 'glass btnOption', Position: 7 }];
    fixedOptionRows: number[] = [1, 2, 3, 4, 5, 6, 7, 8];

    currentOrderItem: OrderItem = null;
    currentFixedOption: FixedOption;
    currentUserModifier: UserModifier;
    userModifierActive: boolean = false;

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
        private utilSvc: UtilityService,
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
        this.getUserModifiers();
        this.order = { TaxExempt: this.DBService.systemSettings.TaxExempt, OrderItems: [], Gratuity: 0, Discount: 0 };
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

                this.subCategories.forEach(function (subCategory: MenuSubCategory) {
                    subCategory.Row = ((subCategory.Position - 1) % 5) + 1;
                    subCategory.Col = 0;
                });

                this.totalSubCategoriesPages = Math.ceil(this.subCategories[this.subCategories.length - 1].Position / this.subCategoryPageSize);
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

    subCategorySelected(subCategory: MenuSubCategory, currentIndex: number) {
        // build menu products list        
        this.subCategoriesTitle = this.mainCategory + ' - ' + subCategory.Name;
        let that = this;
        let categoryID: number = parseInt(localStorage.getItem("CategoryID"));

        this.DBService.getLocalMenuProducts(categoryID, subCategory.SubCategoryID).then((products) => {
            if (products.length == 0) {
                dialogs.alert("Menu Products not loaded.")
            }
            else {
                this.products = products;
                this.setProductAttributes();
                this.totalProductPages = Math.ceil(this.products[that.products.length - 1].Position / this.productPageSize);
                this.productCurrentPage = 0;
                this.getProductPage(true);
                //this.setProductAttributes(this.pageProducts);
                this.currentSubCategory = subCategory.Name;
                this.showProducts = true;
                this.setActiveSubCategoryClass(subCategory);
            }
        });
    }

    //setProductAttributes(products: MenuProduct[]) {
    setProductAttributes() {
        let that = this;

        // account for current system pagesize difference 32 - 20 = 12    
        let displacement: number = (this.productCurrentPage - 1) * 12;

        this.products.forEach(function (product: MenuProduct) {
            product.Row = ((Math.floor((product.Position - 1) / 4)) % 5) + 1;
            product.Col = (product.Position - 1) % 4;
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
        this.currentProduct = product;

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

        if (product.PromptQty) {
            this.showPromptQty(product);
        }
        else
            if (product.UseForcedModifier) {
                this.showForcedModifierDialog(product, -1, null, true);
            }
            else {
                this.addProductToOrder(product);
            }
    }

    showForcedModifierDialog(product: MenuProduct, orderItemIndex: number, choice, isAdding: boolean) {
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: true,
            context: { productCode: product.ProductCode, currentChoices: orderItemIndex > -1 ? this.order.OrderItems[orderItemIndex].ForcedModifiers : [] }
        };

        this.modalService.showModal(ForcedModifiersComponent, modalOptions).then(
            (selectedChoices) => {
                if (selectedChoices != null) {
                    this.currentSeatNumber++;
                    if (isAdding) {
                        this.addProductToOrder(product);
                    }
                    this.order.OrderItems[this.order.OrderItems.length - 1].ForcedModifiers = selectedChoices;
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

    changeChoice(product: MenuProduct, orderItemIndex: number, choice: MenuChoice) {
        this.showForcedModifierDialog(product, orderItemIndex, choice, false);
    }

    addProductToOrder(product: MenuProduct) {

        this.order.OrderItems.push({
            Modifiers: [],
            ForcedModifiers: [],
            Qty: this.qtyEntered,
            SeatNumber: this.currentSeatNumber,
            Price: product.UnitPrice * this.qtyEntered,
            Product: product,
            IgnoreTax: false
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
                    this.order.OrderItems.push({
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
                    this.addProductToOrder(product);
                }
            });
    }

    showModifyDialog(orderItem: OrderItem, modifier: Modifier, forcedModifier: ForcedModifier) {

        this.currentOrderItem = orderItem;

        let context = { orderItem: orderItem, forcedModifier: null };

        if (forcedModifier != null)
            context = { orderItem: orderItem, forcedModifier: forcedModifier }

        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: false,
            context: context
        };

        this.modalService.showModal(ModifyOrderItemComponent, modalOptions).then(
            (choice: Choice) => {
                console.log(choice.ChangeType);
                switch (choice.ChangeType) {
                    case 'quantity':
                        orderItem.Qty = parseFloat(choice.SelectedNumber);
                        orderItem.Price = orderItem.Product.UnitPrice * parseFloat(choice.SelectedNumber);
                        this.totalPrice();
                        break;
                    case 'seat':
                        orderItem.SeatNumber = parseInt(choice.SelectedNumber);
                        break;
                    case 'delete':
                        if (modifier == null)
                            this.deleteOrderItem(orderItem);
                        else
                            this.deleteModifier(orderItem, modifier);
                        break;
                    case 'repeat':
                        this.order.OrderItems.push({
                            "Product": orderItem.Product,
                            "Modifiers": [], "Qty": 1, "SeatNumber": 1,
                            "Price": orderItem.Product.UnitPrice
                        });
                        this.totalPrice();
                        break;
                    case 'modify':
                        this.getMenuOptions(orderItem.Product);
                        this.totalOptionPages = Math.ceil(this.menuOptions[this.menuOptions.length - 1].Position / this.optionPageSize);
                        this.optionCurrentPage = 0;
                        this.getOptionPage(true);
                        break;
                    case 'changechoice':
                        this.showForcedModifierDialog(orderItem.Product, -1, null, false);
                        break;
                }
            });
    }

    onOptionSwipe(args) {
        if (this.totalOptionPages <= 1)
            return;

        // at last page, can only swipe right
        if (this.optionCurrentPage == this.totalOptionPages) {
            if (args.direction == SwipeDirection.down) {
                this.getOptionPage(false);
            }
        }
        // at first page, can only swipe left
        else
            if (this.optionCurrentPage == 1) {
                if (args.direction == SwipeDirection.up) {
                    this.getOptionPage(true);
                }
            }
            // else, can swipe left or right
            else
                if (this.optionCurrentPage >= 1) {
                    // go to next page            
                    if (args.direction == SwipeDirection.up) {
                        this.getOptionPage(true);
                    }
                    else
                        // go to previous page
                        if (args.direction == SwipeDirection.down) {
                            this.getOptionPage(false);
                        }
                }

    }

    getOptionPage(nextPage: boolean) {
        if (nextPage)
            this.optionCurrentPage++;
        else
            this.optionCurrentPage--;

        let startPosition: number = (this.optionCurrentPage * this.optionPageSize) - this.optionPageSize + 1;
        let endPosition: number = startPosition + this.optionPageSize;

        if (endPosition > this.menuOptions[this.menuOptions.length - 1].Position)
            endPosition = this.menuOptions[this.menuOptions.length - 1].Position;

        this.pageOptions = this.menuOptions.filter(
            o => o.Position >= startPosition && o.Position <= endPosition);

    }

    resetFixedOptionClasses() {
        this.fixedOptions.forEach(function (fixedOption: FixedOption) {
            fixedOption.Class = 'glass btnOption';
        });
    }

    extraFunctions() {
        this.showExtraFunctions = true;
    }

    closeExtraFunctions() {
        this.showExtraFunctions = false;
    }

    getMenuOptions(product: MenuProduct) {
        this.resetFixedOptionClasses();
        this.resetUserModifierClasses();

        let that = this;
        this.DBService.getLocalMenuOptions(product.ProductCode).then((menuOptions) => {
            if (menuOptions.length == 0) {
                dialogs.alert("Missing Menu Options");
            }
            else {
                this.menuOptions = menuOptions;
                this.menuOptions.forEach(function (menuOption: MenuOption) {
                    menuOption.Row = Math.floor((menuOption.Position - 1) / 4) + 1;
                    menuOption.Col = (menuOption.Position - 1) % 3;
                });

                this.showOptions = true;
                this.showMainCategories = false;
                this.showSubCategories = false;
            }
        });
    }

    getUserModifiers() {
        let that = this;
        this.DBService.getLocalUserModifiers().then((userModifiers) => {
            if (userModifiers.length == 0) {
                dialogs.alert("Missing UserModifiers");
            }
            else {
                this.userModifiers = userModifiers;
            }
        });
    }

    fixedOptionSelected(fixedOption: FixedOption) {

        this.resetFixedOptionClasses();
        this.resetUserModifierClasses();
        this.userModifierActive = false;

        switch (fixedOption.Name) {
            case 'NO MAKE':
            case 'TO GO':
                let product: MenuProduct = Object.assign({}, this.currentProduct);
                product.Name = fixedOption.Name;
                this.currentOrderItem.Modifiers.push({ Name: fixedOption.Name, Price: 0, DisplayPrice: null });
                //this.currentOrderItem.oModifiers.push({ Name: fixedOption.Name, Price: 0, DisplayPrice: null });
                this.refreshList();
                break;

            default:
                {
                    this.currentFixedOption = fixedOption;
                    fixedOption.Class = 'glass btnOptionActive';
                }
        }
    }

    cancelOrder() {
        if (this.order.OrderItems.length > 0) {
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

        let name: string = '';
        let price: number = 0;

        if (this.userModifierActive) {
            name = this.currentUserModifier.ItemName + ' ' + option.Name;
            price = this.currentUserModifier.StampPrice ? this.currentUserModifier.Price : option.Charge;
        }
        else {
            name = this.currentFixedOption.Name + ' ' + option.Name;
            price = option.Name == 'EXTRA' || option.Name == 'ADD' ? option.Charge : 0;
        }

        let modifier: Modifier = {
            Name: name,
            Price: price,
            DisplayPrice: price > 0 ? price : null,
        };

        //this.currentOrderItem.Modifiers[0] = modifier;        
        this.currentOrderItem.Modifiers.push(modifier);
        this.refreshList();
    }

    userModifierSelected(userModifier: UserModifier) {
        if (userModifier.ButtonFunction == 1) {
            this.currentOrderItem.Modifiers.push({ Name: userModifier.ItemName, Price: 0, DisplayPrice: null });
            this.refreshList();
            return;
        }

        this.resetUserModifierClasses();
        this.resetFixedOptionClasses();
        this.currentUserModifier = userModifier;
        userModifier.Class = 'glass btnOptionActive';
        this.userModifierActive = true;
    }

    refreshList() {
        let listView: ListView = <ListView>this.page.getViewById("lvItems");
        listView.refresh();
    }

    resetUserModifierClasses() {
        this.userModifiers.forEach(function (userModifier: UserModifier) {
            userModifier.Class = 'glass btnOption';
        });
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

        let startPosition: number = (this.subCategoryCurrentPage * this.subCategoryPageSize) - this.subCategoryPageSize + 1;

        // find the first sub category on the next page      
        if (this.subCategoryCurrentPage > 1)
            startPosition = this.subCategories.find(sc => sc.Position > this.pageSubCategories[this.pageSubCategories.length - 1].Position).Position;

        let endPosition: number = startPosition + this.subCategoryPageSize - 1;

        if (endPosition > this.subCategories[this.subCategories.length - 1].Position)
            endPosition = this.subCategories[this.subCategories.length - 1].Position;

        //this.pageSubCategories = this.subCategories.slice(startRecord, endRecord);              

        this.pageSubCategories = this.subCategories.filter(
            sc => sc.Position >= startPosition && sc.Position <= endPosition);

        // if first item is in last row - page has only 1 row    
        if (this.pageSubCategories[0].Row >= this.subCategoryPageSize)
            this.pageSubCategories = this.pageSubCategories.slice(0, 1);

        this.subCategorySelected(this.pageSubCategories[0], 0);
    }

    onProductSwipe(args) {
        if (this.totalProductPages <= 1)
            return;

        // at last page, can only swipe right
        if (this.productCurrentPage == this.totalProductPages) {
            if (args.direction == SwipeDirection.down) {
                this.getProductPage(false);
            }
        }
        // at first page, can only swipe left
        else
            if (this.productCurrentPage == 1) {
                if (args.direction == SwipeDirection.up) {
                    this.getProductPage(true);
                }
            }
            // else, can swipe left or right
            else
                if (this.productCurrentPage >= 1) {
                    // go to next page            
                    if (args.direction == SwipeDirection.up) {
                        this.getProductPage(true);
                    }
                    else
                        // go to previous page
                        if (args.direction == SwipeDirection.down) {
                            this.getProductPage(false);
                        }
                }

    }

    getProductPage(nextPage: boolean) {
        if (nextPage)
            this.productCurrentPage++;
        else
            this.productCurrentPage--;

        let startPosition: number = (this.productCurrentPage * this.productPageSize) - this.productPageSize + 1;
        let endPosition: number = startPosition + this.productPageSize;

        if (endPosition > this.products[this.products.length - 1].Position)
            endPosition = this.products[this.products.length - 1].Position;

        //this.pageProducts = this.products.slice(startRecord, endRecord);
        //let startTime:number  = new Date().getTime();
        this.pageProducts = this.products.filter(
            product => product.Position >= startPosition && product.Position <= endPosition);
        //console.log('elapsed: ' + (new Date().getTime() - startTime).toString());    
        /*
               this.pageProducts.forEach(function (menuProduct: MenuProduct) {
                   menuProduct.Row = Math.floor((menuProduct.Position - 1) / 4) + 1;
                   menuProduct.Col = (menuProduct.Position - 1) % 4;
               });
               */
    }

    changeModifier(modifier: Modifier) {
        console.log(modifier);
    }

    onOrderItemSwipe(args, orderItem: OrderItem) {
        if (args.direction == SwipeDirection.left) {
            this.deleteOrderItem(orderItem);
        }
    }

    onModifierSwipe(args, orderItem: OrderItem, modifier: Modifier) {
        if (args.direction == SwipeDirection.left) {
            this.deleteModifier(orderItem, modifier);
        }
    }

    tapped(args) {
        console.log(args);
        //this.refreshList();
    }

    deleteOrderItem(orderItem: OrderItem) {
        this.order.OrderItems = this.order.OrderItems.filter(obj => obj !== orderItem);

        if (orderItem.Price > 0)
            this.totalPrice();
    }

    deleteModifier(orderItem: OrderItem, modifier: Modifier) {

        orderItem.Modifiers = orderItem.Modifiers.filter(obj => obj !== modifier);
        this.refreshList();

        if (modifier.Price > 0)
            this.totalPrice();
    }

    totalPrice() {
        this.subTotal = 0;

        for (var i = 0; i < this.order.OrderItems.length; i++) {
            {
                this.subTotal += (this.order.OrderItems[i].Product.UnitPrice * this.order.OrderItems[i].Qty);
            }
            this.tax = this.utilSvc.getTaxTotal(this.order);
            this.checkTotal = this.subTotal + this.tax;

            if (this.guests >= this.MAX_GUESTS) {
                this.tips = this.subTotal * this.TIPS_PCT;
                this.checkTotal += this.tips;
            }
        }
    }

    showModifierDialog(orderItemIndex: number) {
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: true,
            //context: { options: options, currentOptions: currentOptions}
        };

        this.modalService.showModal(ModifyOrderItemComponent, modalOptions).then(
            (selectedModifiers) => {
                if (this.order.OrderItems[orderItemIndex].Modifiers.length == 0)
                    this.order.OrderItems[orderItemIndex].Modifiers = selectedModifiers;
                else {
                    // this.order.OrderItems[orderItemIndex].Modifiers = this.order.OrderItems[orderItemIndex].Modifiers.concat(selectedModifiers);
                }
            });
    }

    showMemoDialog() {
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: true
        };

        this.modalService.showModal(MemoComponent, modalOptions).then(
            (memo: Memo) => {
                this.currentOrderItem.Modifiers.push({ Name: memo.Memo, Price: memo.Price, DisplayPrice: memo.Price > 0 ? memo.Price : null })
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