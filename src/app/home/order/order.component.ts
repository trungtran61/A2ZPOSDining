import { Component, OnInit, ViewContainerRef, OnDestroy, NgZone } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { SwipeDirection } from "ui/gestures";

import * as dialogs from "tns-core-modules/ui/dialogs";
//import { SocketIO } from "nativescript-socketio";

import {
    CategoryCode, Product, MenuCategory, MenuSubCategory, MenuProduct, MenuChoice, OpenProductItem, MenuTimerTypes,
    MenuTimer, MenuOption, Choice, Modifier, TaxRate, UserModifier, Memo, ForcedModifier, TableDetail, MenuSubOption
} from "~/app/models/products";
import { SQLiteService } from "~/app/services/sqlite.service";
import { ModalDialogService, ModalDialogOptions, ListViewComponent } from "nativescript-angular";
import { Page } from "tns-core-modules/ui/page/page";
import { OpenProductComponent } from "./open-product/open-product.component";
import { OrderType, Countdown, OrderItem, Order, FixedOption, OrderHeader, OrderDetail, OrderResponse, ItemType } from "~/app/models/orders";
import { APIService } from "~/app/services/api.service";
import { PromptQtyComponent } from "./prompt-qty.component";
import { MemoComponent } from "./memo.component";
import { UtilityService } from "~/app/services/utility.service";
import { ForcedModifiersComponent } from "./forced-modifiers/forced-modifiers.component";
import { ModifyOrderItemComponent } from "./modify-order-item.component";
import { ActivatedRoute } from "@angular/router";
import { NullViewportScroller } from "@angular/common/src/viewport_scroller";
import { ReasonComponent } from "./reason.component";

@Component({
    selector: "order",
    moduleId: module.id,
    templateUrl: "./order.component.html",
    styleUrls: ['./order.component.css']
})

export class OrderComponent implements OnInit, OnDestroy {
    private printerSocket: any;

    currentCategoryID: number = 0;
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
    productPageSize: number = 24;

    menuOptions: MenuOption[];
    pageOptions: MenuOption[];
    totalOptionPages: number = 0;
    optionCurrentPage: number = 1;
    optionPageSize: number = 18;
    userModifiers: UserModifier[]; // bottom row user defined options

    categoryCodes: CategoryCode[] = [];
    order: Order = null;
    orderResponse: OrderResponse = null;
    orderItems: OrderDetail[] = [];
    //orderItems: string[] = ['item 1', 'item 1', 'item 1', 'item 1',];
    currentSeatNumber: number = 1;
    checkTotal: number = 0;
    subTotal: number = 0;
    tax: number = 0;
    discount: number = 0;
    tips: number = 0;
    guests: number = 0;
    table: string = '';
    server: string = '';
    checkNumber: number = 0;
    checkTitle: string = '';
    currentSubCategory: string = '';
    subCategoriesTitle: string = '';
    mainCategory: string = '';
    lockedCategoryId: number = 0;
    currentProduct: MenuProduct;
    ticketNumber: number = 0;

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

    currentOrderItem: OrderDetail = null;
    currentFixedOption: FixedOption;
    currentUserModifier: UserModifier;
    userModifierActive: boolean = false;

    countdowns: Countdown[] = [];
    allTimers: MenuTimer[] = [];

    TAX_RATE: number = .08;
    MAX_GUESTS: number = 6;
    TIPS_PCT: number = .15;

    qtyEntered: number = 1;
    orderType: number = OrderType.DineIn;

    canSubCategoryPageDown: boolean = false;
    canSubCategoryPageUp: boolean = false;
    canProductPageDown: boolean = false;
    canProductPageUp: boolean = false;
    canOptionPageDown: boolean = false;
    canOptionPageUp: boolean = false;

    isExistingOrder: boolean = false;
    textColorClass: string = 'enabledTextColor';
   
    printerPort: string = '192.168.0.125:9100';

    constructor(private router: RouterExtensions,
        private DBService: SQLiteService,
        private modalService: ModalDialogService,
        private viewContainerRef: ViewContainerRef,
        private apiSvc: APIService,
        private utilSvc: UtilityService,
        private page: Page,
        private route: ActivatedRoute,
        //private socketIO: SocketIO       
    ) 
    {
        page.actionBarHidden = true;        
        /*
        if (isIOS) {
                topmost().ios.controller.navigationBar.barStyle = 1;
        }
        */
        //this.printerSocket = new WebSocket("ws://" + this.printerPort, []);
    }

    ngOnInit(): void {
        /*
        this.guests = parseInt(localStorage.getItem('guests'));
        this.table = localStorage.getItem('table');
        this.server = localStorage.getItem('server');
        this.checkTitle = this.checkNumber + ' ' + this.server + ' ' + this.table + ' ' + this.guests;             
        */
        this.apiSvc.reloadCountdowns().then(result => {
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

        this.route.queryParams.subscribe(params => {
            if (params['action']) {
                let action: string = params['action'];

                if (action == 'openTable') {
                    let table: TableDetail = JSON.parse(localStorage.getItem('currentTable'));
                    this.getFullOrder(table.OrderFilter);
                    this.isExistingOrder = true;
                    this.textColorClass = 'disabledTextColor';
                }
            }
            else {
                this.createNewOrder();
            }
        });
        const SocketIO = require("nativescript-socket.io")
        SocketIO.connect(this.printerPort);
        //SocketIO.disconnect();
        //SocketIO.emit('0x1B@trung', {
        //    username: '0x1B@tran',
        //  });
        //this.socketIO.connect();
    }

    createNewOrder() {
        this.order = { TaxExempt: this.DBService.systemSettings.TaxExempt, OrderItems: [], Gratuity: 0, Discount: 0 };
    }

    getFullOrder(orderFilter: number) {
        this.order = { TaxExempt: this.DBService.systemSettings.TaxExempt, OrderItems: [], Gratuity: 0, Discount: 0 };
        this.apiSvc.getFullOrder(orderFilter).subscribe(orderResponse => {
            this.orderResponse = orderResponse;
            this.orderItems = orderResponse.OrderDetail;
            this.ticketNumber = this.orderResponse.Order.OrderID;
            this.checkNumber = this.orderResponse.Order.CheckNumber;
            this.table = this.orderResponse.Order.TableNumber;
            this.DBService.getLocalEmployee(this.orderResponse.Order.EmployeeID).then(employee => this.server = employee.FirstName);
            this.guests = this.orderResponse.Order.NumberGuests;
            this.totalPrice();
        });
    }

    loadCategories(categories: MenuCategory[]) {
        let that = this;
        this.categories = categories;
        this.categories.forEach(function (menuCategory: MenuCategory) {
            let lightColor: string = '#' + menuCategory.ButtonColorHex;
            let darkColor: string = that.utilSvc.colorLuminance(lightColor, -.3);
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
        this.currentCategoryID = category.CategoryID;
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
                if (this.totalSubCategoriesPages > 1)
                    this.canSubCategoryPageDown = true;

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
        //let categoryID: number = parseInt(localStorage.getItem("CategoryID"));
        let categoryID: number = this.currentCategoryID;

        this.DBService.getLocalMenuProducts(categoryID, subCategory.SubCategoryID).then((products) => {
            if (products.length == 0) {
                dialogs.alert("Menu Products not loaded.")
            }
            else {
                this.products = products;

                this.setProductAttributes();
                this.totalProductPages = Math.ceil(this.products[that.products.length - 1].Position / this.productPageSize);
                this.productCurrentPage = 0;

                if (this.totalProductPages > 1)
                    this.canProductPageDown = true;

                this.getProductPage(true);
                this.currentSubCategory = subCategory.Name;
                this.showProducts = true;
                this.setActiveSubCategoryClass(subCategory);
            }
        });
    }

    setProductAttributes() {
        let that = this;

        this.products.forEach(function (product: MenuProduct) {
            product.Row = ((Math.floor((product.Position - 1) / 4)) % 6) + 1;
            product.Col = (product.Position - 1) % 4;
            let lightColor: string = '#' + product.ButtonColorHex;
            //let lightColor: string = darkColor //that.lightenDarkenColor(darkColor, 50);
            let darkColor: string = that.utilSvc.colorLuminance(lightColor, -0.2);
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
                //this.checkMenuTimer(product.)
                this.addProductToOrder(product);
            }
    }

    showForcedModifierDialog(product: MenuProduct, orderItemIndex: number, choice, isAdding: boolean) {
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: true,
            context: { productCode: product.ProductCode, 
                indexData: this.getMaxIndexData() + 1,
                currentChoices: orderItemIndex > -1 ? this.order.OrderItems[orderItemIndex].ForcedModifiers : [] }
        };

        let that = this;

        this.modalService.showModal(ForcedModifiersComponent, modalOptions).then(
            (selectedItems: OrderDetail[]) => {
                if (selectedItems != null) {
                    this.currentSeatNumber++;
                    if (isAdding) {
                        this.addProductToOrder(product);                        
                    }
                    
                    selectedItems.forEach(function (od: OrderDetail) {
                        that.addItemToOrder(0, od.ProductName, od.UnitPrice, od.ItemType, 
                            that.currentOrderItem.ProductCode, od.IndexDataSub);                       
                    });
                }
            });
    }

    showForcedModifierDialogOrderItem(orderItem: OrderDetail) {
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: true,
            context: { orderItems: this.orderItems.filter(oi => oi.IndexData == orderItem.IndexData),
                currentChoices: this.orderItems.filter(oi => oi.IndexData == orderItem.IndexData && 
                    (oi.ItemType == ItemType.ForcedChoice ||
                    oi.ItemType == ItemType.SubOption)) }
        };
        let that = this;

        this.modalService.showModal(ForcedModifiersComponent, modalOptions).then(
            (selectedItems) => {
                if (selectedItems != null)
                {
                // remove current choices
                this.orderItems = this.orderItems.filter(oi => oi.ItemType != ItemType.ForcedChoice && oi.ItemType != ItemType.SubOption );

                selectedItems.forEach(function (od: OrderDetail) {
                    that.addItemToOrder(0, od.ProductName, od.UnitPrice, od.ItemType, 
                        that.currentOrderItem.ProductCode, od.IndexDataSub);                        
                    });
                }
            });
    }

    productInfo() {
        console.log('product info');
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
        this.addItemToOrder(
            1, product.Name, product.UnitPrice, ItemType.Product, product.ProductCode, null
        );
    }

    showOpenProduct() {
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: true,
            //context: { options: options, currentOptions: currentOptions}
        };

        let that = this;
        this.modalService.showModal(OpenProductComponent, modalOptions).then(
            (openProductItem: OpenProductItem) => {
                this.showExtraFunctions = false;
                if (openProductItem != null) {
                    that.addItemToOrder(1, openProductItem.ProductName, 
                        openProductItem.UnitPrice, ItemType.Product, 0, null)
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

    showModifyDialog(orderItem: OrderDetail) {

        this.currentOrderItem = orderItem;

        let context = { orderItem: orderItem, isForcedModifier: orderItem.ItemType == ItemType.ForcedChoice };

        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: false,
            context: context
        };

        let that = this;
        this.modalService.showModal(ModifyOrderItemComponent, modalOptions).then(
            (choice: Choice) => {
                console.log(choice.ChangeType);
                switch (choice.ChangeType) {
                    case 'quantity':
                        orderItem.Quantity = parseFloat(choice.SelectedNumber);
                        orderItem.ExtPrice = orderItem.UnitPrice * parseFloat(choice.SelectedNumber);
                        this.totalPrice();
                        break;
                    case 'seat':
                        orderItem.SeatNumber = choice.SelectedNumber;
                        break;
                    case 'delete':
                        this.deleteOrderItem(orderItem);
                        break;
                    case 'repeat':
                        this.repeatOrderItem(orderItem);
                        break;
                    case 'modify':
                        this.getMenuOptions(orderItem.ProductCode);
                        break;
                    case 'changechoice':
                        this.showForcedModifierDialogOrderItem(orderItem);
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
        let endPosition: number = startPosition + this.optionPageSize - 1;

        if (endPosition > this.menuOptions[this.menuOptions.length - 1].Position)
            endPosition = this.menuOptions[this.menuOptions.length - 1].Position;

        this.pageOptions = this.menuOptions.filter(
            o => o.Position >= startPosition && o.Position <= endPosition);

        this.canOptionPageUp = this.optionCurrentPage > 1;
        this.canOptionPageDown = this.totalOptionPages > this.optionCurrentPage;

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

    getMenuOptions(productCode: number) {
        this.resetFixedOptionClasses();
        this.resetUserModifierClasses();

        let that = this;
        this.DBService.getLocalMenuOptions(productCode).then((menuOptions) => {
            if (menuOptions.length == 0) {
                dialogs.alert("Missing Menu Options");
            }
            else {
                this.menuOptions = menuOptions;
                this.menuOptions.forEach(function (menuOption: MenuOption) {
                    menuOption.Row = ((Math.floor((menuOption.Position - 1) / 3)) % 6);
                    menuOption.Col = (menuOption.Position - 1) % 3;
                });

                this.totalOptionPages = Math.ceil(menuOptions[menuOptions.length - 1].Position / that.optionPageSize);

                if (this.totalOptionPages > 1)
                    this.canOptionPageDown = true;

                this.showOptions = true;
                this.showMainCategories = false;
                this.showSubCategories = false;
                this.optionCurrentPage = 0;
                this.getOptionPage(true);
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
                let maxIndexDataSub: number = this.getMaxIndexDataSub(this.currentOrderItem.IndexData);
                this.addItemToOrder
                    (0,fixedOption.Name, 0, ItemType.Option, this.currentProduct.ProductCode, this.getMaxIndexDataSub(this.currentOrderItem.IndexData) + 1
                    );

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
            DisplayPrice: price > 0 ? price : null
        };

        //this.currentOrderItem.Modifiers.push(modifier);
        this.addItemToOrder
            (0,modifier.Name, modifier.Price, ItemType.Option, this.currentProduct.ProductCode, 
                this.getMaxIndexDataSub(this.currentOrderItem.IndexData) + 1 );
 }

    getMaxIndexData(): number {
        if (this.orderItems.length == 0)
            return 0;

        return Math.max.apply(Math, this.orderItems
            .filter(oi => oi.ItemType == ItemType.Product)
            .map(function (oi) { return oi.IndexData; }));
    }

    getMaxIndexDataSub(indexData: number): number {
        if (this.orderItems.filter( oi => oi.IndexData == indexData && oi.ItemType == ItemType.Option).length == 0)
            return 0;

        return Math.max.apply(Math, this.orderItems
            .filter(oi => oi.IndexData == indexData && oi.ItemType == ItemType.Option)
            .map(function (oi) { return oi.IndexDataSub; }));
    }

    getLeftMargin(itemType: ItemType) : number
    {
        let marginLeft: number = 0;
        switch (itemType) {
            case ItemType.Option:
            case ItemType.Choice:
            case ItemType.ForcedChoice:
                marginLeft = 5;
                break;
            case ItemType.SubOption:
                marginLeft = 10;
                break;
        }

        return marginLeft;
    }

    addItemToOrder(qty: number, name: string, unitPrice: number, 
        itemType: ItemType, productCode: number, indexDataSub: number) {
        let indexData: number = 0;
        let marginLeft: number = this.getLeftMargin(itemType);

        if (itemType == ItemType.Product) {   //adding a product
            indexData = this.getMaxIndexData() + 1;
            let orderItem: OrderDetail = {
                Quantity: itemType == ItemType.Product ? qty : null,
                SeatNumber: this.currentSeatNumber.toString(),
                ExtPrice: itemType == ItemType.Product ? qty * unitPrice : null,
                UnitPrice: unitPrice,
                PrintName: name,
                ProductName: name,
                ItemType: itemType,
                IndexData: indexData,
                ProductCode: productCode,
                MarginLeft: 0
            }
            this.orderItems.push(orderItem);
            this.currentOrderItem = orderItem;
        }
        else {   // adding product modifier
            indexData = this.currentOrderItem.IndexData;
            let lastIndex: number = this.orderItems.map(oi =>
                oi.IndexData === indexData).lastIndexOf(true);
            let orderItem: OrderDetail = {
                Quantity: null,
                SeatNumber: this.currentSeatNumber.toString(),
                ExtPrice: null,
                UnitPrice: unitPrice,
                PrintName: name,
                ProductName: name,
                ItemType: itemType,
                IndexData: indexData,
                ProductCode: productCode,
                MarginLeft: marginLeft,
                IndexDataSub: indexDataSub
            }
            this.orderItems.splice(lastIndex + 1, 0, orderItem);
        }

        this.totalPrice();
    }

    userModifierSelected(userModifier: UserModifier) {
        this.resetUserModifierClasses();
        this.resetFixedOptionClasses();

        if (userModifier.ButtonFunction == 1) {
            this.addItemToOrder
                (
                this.currentOrderItem.Quantity,
                userModifier.ItemName,
                userModifier.Price,
                ItemType.Option,
                this.currentProduct.ProductCode,
                null
                );

            return;
        }

        this.currentUserModifier = userModifier;
        userModifier.Class = 'glass btnOptionActive';
        this.userModifierActive = true;
    }
    /*
        refreshList() {
            let listView: ListView = <ListView>this.page.getViewById("lvItems");
            listView.refresh();
        }
    */
    resetUserModifierClasses() {
        this.userModifiers.forEach(function (userModifier: UserModifier) {
            userModifier.Class = 'glass btnOption';
        });
    }

    showHideDetails() {
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
        if (this.subCategoryCurrentPage > 1 && nextPage)
            startPosition = this.subCategories.find(sc => sc.Position > this.pageSubCategories[this.pageSubCategories.length - 1].Position).Position;

        let endPosition: number = startPosition + this.subCategoryPageSize - 1;

        if (endPosition > this.subCategories[this.subCategories.length - 1].Position)
            endPosition = this.subCategories[this.subCategories.length - 1].Position;

        this.pageSubCategories = this.subCategories.filter(
            sc => sc.Position >= startPosition && sc.Position <= endPosition);

        // if first item is in last row - page has only 1 row    
        if (this.pageSubCategories[0].Row >= this.subCategoryPageSize)
            this.pageSubCategories = this.pageSubCategories.slice(0, 1);

        this.subCategorySelected(this.pageSubCategories[0], 0);
        this.canSubCategoryPageUp = this.subCategoryCurrentPage > 1;
        this.canSubCategoryPageDown = this.subCategoryCurrentPage < this.totalSubCategoriesPages;
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

        this.pageProducts = this.products.filter(
            product => product.Position >= startPosition && product.Position <= endPosition);

        this.canProductPageUp = this.productCurrentPage > 1;
        this.canProductPageDown = this.totalProductPages > this.productCurrentPage;
    }

    onOrderItemSwipe(args, orderItem: OrderDetail) {
        if (args.direction == SwipeDirection.left) {
            this.deleteOrderItem(orderItem);
        }
    }

    deleteOrderItem(orderItem: OrderDetail) {
        if (orderItem.OrderFilter)
        {
            this.showReasonDialog(orderItem);
        }
        else
        {
        // if item is product, delete product and all associated modifiers
        if (orderItem.ItemType == ItemType.Product)
            this.orderItems = this.orderItems.filter(obj => obj.IndexData !== orderItem.IndexData);
        else       
            if (orderItem.ItemType == ItemType.SubOption)     
            {
                this.orderItems = this.orderItems.filter(obj => obj !== orderItem );
            }
            else
            {
            this.orderItems = this.orderItems.filter(obj => obj.IndexDataSub !== orderItem.IndexDataSub );
            }

        if (orderItem.ExtPrice > 0)
            this.totalPrice();
        }
    }

    repeatOrderItem(orderItem: OrderDetail) {
        let itemsToCopy = this.orderItems.filter(oi => oi.IndexData == orderItem.IndexData);
        let maxIndexData: number = this.getMaxIndexData();
        let that = this;

        itemsToCopy.forEach(function (orderItem: OrderDetail) {
            //that.addItemToOrder(orderItem.ItemType == ItemType.Product ? 1 : null,
             //   orderItem.ProductName, orderItem.UnitPrice, orderItem.ItemType, orderItem.ProductCode)
            
            that.orderItems.push(
                {
                    Quantity: orderItem.ItemType == ItemType.Product ? 1 : null,
                    SeatNumber: that.currentSeatNumber.toString(),
                    ExtPrice: orderItem.ExtPrice,
                    UnitPrice: orderItem.UnitPrice,
                    PrintName: orderItem.PrintName,
                    ProductName: orderItem.ProductName,
                    ItemType: orderItem.ItemType,
                    IndexData: maxIndexData + 1,
                    ProductCode: orderItem.ProductCode,
                    MarginLeft: that.getLeftMargin(orderItem.ItemType)
                }
            );
           
        });
    }

    totalPrice() {
        this.subTotal = 0;

        for (var i = 0; i < this.orderItems.length; i++) {
            {
                if (this.orderItems[i].ExtPrice != null)
                    this.subTotal += this.orderItems[i].ExtPrice;
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

    showReasonDialog(orderItem: OrderDetail)
    {
        // get the product Order
        //let _orderItem: OrderDetail = this.orderItems.find( oi => oi.ItemType == ItemType.Product && oi.IndexData == orderItem.IndexData)
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: true
        };

        this.modalService.showModal(ReasonComponent, modalOptions).then(
            (reason: string) => {     
                // delete product from order if reason given          
                if (reason != null)
                {
                    this.orderItems = this.orderItems.filter(obj => obj.IndexData !== orderItem.IndexData);
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
                //this.currentOrderItem.Modifiers.push({ Name: memo.Memo, Price: memo.Price, DisplayPrice: memo.Price > 0 ? memo.Price : null })
                this.addItemToOrder(0, memo.Memo, memo.Price, ItemType.Option, this.currentProduct.ProductCode, null);
            });
    }

    sendCheck()
    {
        //var printController = UIPrintInteractionController;
        //console.log(printController.printingAvailable);
        //this.printReceipt();
        //this.utilSvc.sendToPrinter('hello', {'username': 'trung'});
        //this.printerSocket.send('hello');
        //this.socketIO.emit("test", { test: "test" });
    }

    printReceipt()
    {
    
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
                            case OrderType.DineIn:
                                if (!timer.TableService)
                                    checkMenuTimer = false;
                                break;
                            case OrderType.Here:
                            case OrderType.TakeOut:
                                if (!timer.WalkIn)
                                    checkMenuTimer = false;
                                break;
                            case OrderType.TakeOut:
                                if (!timer.TakeOut)
                                    checkMenuTimer = false;
                                break;
                            case OrderType.BarQuickSale:
                            case OrderType.BarTab:
                                if (!timer.Bar)
                                    checkMenuTimer = false;
                                break;
                            case OrderType.PickUp:
                            case OrderType.Delivery:
                                if (!timer.PhoneIn)
                                    checkMenuTimer = false;
                                break;
                            case OrderType.FastFood:
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
    
    public ngOnDestroy() {
        const SocketIO = require("nativescript-socket.io")        
    }
}