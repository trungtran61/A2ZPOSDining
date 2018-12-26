import { Component, OnInit, ViewContainerRef, OnDestroy, NgZone } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { SwipeDirection } from "ui/gestures";

import * as dialogs from "tns-core-modules/ui/dialogs";
//import { SocketIO } from "nativescript-socketio";

import {
    CategoryCode, Product, MenuCategory, MenuSubCategory, MenuProduct, MenuChoice, OpenProductItem,
    MenuTimer, MenuOption, Choice, Modifier, TaxRate, UserModifier, Memo, ForcedModifier, TableDetail, MenuSubOption, MenuTimerType, OverrideType, OptionCategory, Option
} from "~/app/models/products";
import { SQLiteService } from "~/app/services/sqlite.service";
import { ModalDialogService, ModalDialogOptions, ListViewComponent } from "nativescript-angular";
import { Page } from "tns-core-modules/ui/page/page";
import { OpenProductComponent } from "./open-product/open-product.component";
import { OrderType, Countdown, FixedOption, OrderHeader, OrderDetail, OrderResponse, ItemType, ModifierType } from "~/app/models/orders";
import { APIService } from "~/app/services/api.service";
import { PromptQtyComponent } from "./prompt-qty.component";
import { MemoComponent } from "./memo.component";
import { UtilityService } from "~/app/services/utility.service";
import { ForcedModifiersComponent } from "./forced-modifiers/forced-modifiers.component";
import { ModifyOrderItemComponent } from "./modify-order-item.component";
import { ActivatedRoute } from "@angular/router";
import { NullViewportScroller } from "@angular/common/src/viewport_scroller";
import { ReasonComponent } from "./reason.component";
import { SearchComponent } from "./search.component";
import { filter } from "rxjs/operators";
import { QueryBindingType } from "@angular/core/src/view";

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

    productOptions: MenuOption[];
    allProductOptions: MenuOption[];
    optionCategories: OptionCategory[];
    pageOptionCategories: OptionCategory[];
    optionCategoryCurrentPage: number = 0;
    optionCategoryPageSize: number = 3;
    totalOptionCategoryPages: number = 0;
    allOptionCategorySelected: boolean = true;

    menuOptions: MenuOption[];
    pageOptions: MenuOption[];
    totalOptionPages: number = 0;
    optionCurrentPage: number = 1;
    optionPageSize: number = 18;
    userModifiers: UserModifier[]; // bottom row user defined options

    categoryCodes: CategoryCode[] = [];
    orderHeader: OrderHeader = null;
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
    checkNumber: number = 1;
    checkTitle: string = '';
    currentSubCategory: string = '';
    subCategoriesTitle: string = '';
    mainCategory: string = '';
    lockedCategoryId: number = 0;
    currentProduct: MenuProduct;
    previousProduct: MenuProduct;
    ticketNumber: number = 0;

    showMainCategories: boolean = true;
    showSubCategories: boolean = false;
    showOptions: boolean = false;
    showProducts: boolean = false;
    showDetails: boolean = true;
    showExtraFunctions: boolean = false;
    showProductInfo: boolean = false;
    productInfoClass: string = 'glass fa';
    viewDetailsCode: string = String.fromCharCode(0xf06e) + ' View Details'
    hideDetailsCode: string = String.fromCharCode(0xf070) + ' Hide Details'

    viewDetailsText: string = this.hideDetailsCode;

    fixedOptions: FixedOption[] = [{ Name: 'NO', Class: 'glass btnOption', Position: 1, ModifierType: ModifierType.NO },
    { Name: 'EXTRA', Class: 'glass btnOption', Position: 2, ModifierType: ModifierType.EXTRA },
    { Name: 'LESS', Class: 'glass btnOption', Position: 3, ModifierType: ModifierType.LESS },
    { Name: 'ADD', Class: 'glass btnOption', Position: 4, ModifierType: ModifierType.ADD },
    { Name: 'OTS', Class: 'glass btnOption', Position: 5, ModifierType: ModifierType.ONTHESIDE },
    { Name: 'NO MAKE', Class: 'glass btnOption', Position: 5, ModifierType: ModifierType.NOMAKE },
    { Name: '1/2', Class: 'glass btnOption', Position: 6, ModifierType: ModifierType.HALF },
    { Name: 'TO GO', Class: 'glass btnOption', Position: 7, ModifierType: ModifierType.TOGO }];
    fixedOptionRows: number[] = [1, 2, 3, 4, 5, 6, 7, 8];

    currentOrderItem: OrderDetail = null;
    currentFixedOption: FixedOption;
    currentUserModifier: UserModifier;
    currentOption: Option;
    currentMenuOption: MenuOption;
    currentSubOption: MenuSubOption;
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
    canOptionCategoryPageDown: boolean = false;
    canOptionCategoryPageUp: boolean = false;

    isExistingOrder: boolean = false;
    isShowingMainOptions: boolean = false;
    productOptionsClass: string = 'glass productOptions';
    allOptionFilterClass: string = 'glass';

    priceLevel: number = 0;
    currentModifierType: ModifierType;

    showOptionsButton: boolean = false;

    constructor(private router: RouterExtensions,
        private DBService: SQLiteService,
        private modalService: ModalDialogService,
        private viewContainerRef: ViewContainerRef,
        private apiSvc: APIService,
        private utilSvc: UtilityService,
        private page: Page,
        private route: ActivatedRoute,
        private zone: NgZone,
        //private socketIO: SocketIO       
    ) {
        page.actionBarHidden = true;
        /*
        if (isIOS) {
                topmost().ios.controller.navigationBar.barStyle = 1;
        }
        */
        //this.printerSocket = new WebSocket("ws://" + this.printerPort, []);
    }

    ngOnInit(): void {
        
        this.guests = parseInt(localStorage.getItem('guests'));
        this.table = localStorage.getItem('table');
        this.server = this.DBService.loggedInUser.FirstName;
        /*
        this.checkTitle = this.checkNumber + ' ' + this.server + ' ' + this.table + ' ' + this.guests;             
        */
        this.apiSvc.reloadCountdowns().then(result => {
            this.countdowns = <Countdown[]>result;

            this.getMenuTimers();
            this.getUserModifiers();

            this.route.queryParams.subscribe(params => {
                if (params['action']) {
                    let action: string = params['action'];

                    if (action == 'openTable') {
                        let table: TableDetail = JSON.parse(localStorage.getItem('currentTable'));
                        this.getFullOrder(table.OrderFilter);
                        this.isExistingOrder = true;
                        //this.textColorClass = 'disabledTextColor';
                    }
                }
                else {
                    this.createNewOrder();
                }
            });

            this.getProductOptions('');
            this.getOptionCategories();
            this.apiSvc.postToPrint('hero');
            this.allOptionFilterClass = 'glass';
        }
        );
    }

    showProductOptions() {
        this.isShowingMainOptions = !this.isShowingMainOptions;
        let that = this;

        if (this.isShowingMainOptions) {
            this.productOptionsClass = 'glass productOptionsActive';
            this.optionCategoryCurrentPage = 0;
            this.getOptionCategoryPage(true);
            this.resetFixedOptionClasses();
            this.resetUserModifierClasses();
            this.totalOptionPages = Math.ceil(that.productOptions[this.productOptions.length - 1].Position / this.optionPageSize);

            this.optionCurrentPage = 0;
            this.getProductOptionPage(true);
        }
        else {
            // show menu's options first page
            this.productOptionsClass = 'glass productOptions';
            this.totalOptionPages = Math.ceil(this.menuOptions[this.menuOptions.length - 1].Position / this.optionPageSize);
            this.optionCurrentPage = 0;
            this.getOptionPage(true);
        }

        if (this.totalOptionPages > 1)
            this.canOptionPageDown = true;
    }

    getProductOptions(optionName) {
        this.DBService.getLocalOptions(optionName).then((options) => {
            if (options.length == 0) {
                if (optionName == '')
                    dialogs.alert("Missing Product Options");
                else
                    dialogs.alert(optionName + " not found.");
            }
            else {
                if (optionName == '') {
                    this.allProductOptions = options;
                }
                else {
                    this.allOptionCategorySelected = false;
                    this.optionCategories.forEach(oc => oc.Selected = false);
                }

                this.productOptions = options;
                this.setOptionsPosition();
            }
        });
    }

    getOptionCategories() {
        this.DBService.getLocalOptionCategories().then((categories) => {
            if (categories.length == 0) {
                dialogs.alert("Missing OptionCategories");
            }
            else {
                this.optionCategories = categories;
                this.optionCategoryCurrentPage = 0;
                this.totalOptionCategoryPages = Math.ceil(this.optionCategories[this.optionCategories.length - 1].Position / this.optionCategoryPageSize);
                if (this.totalSubCategoriesPages > 1)
                    this.canSubCategoryPageDown = true;

                this.getOptionCategoryPage(true);
            }
        });
    }

    getOptionsForAllCategories() {
        this.optionCategories.forEach(oc => oc.Selected = false);
        this.allOptionCategorySelected = true;
        this.productOptions = this.allProductOptions;
        this.setOptionsPosition();
        this.optionCategoryCurrentPage = 0;
        this.getOptionCategoryPage(true);
    }

    setOptionsPosition() {
        let rowCtr: number = 0;

        this.productOptions.forEach(oc => {
            rowCtr++;
            oc.Position = rowCtr;
            oc.Row = ((Math.floor((rowCtr - 1) / 3)) % 6);
            oc.Col = (rowCtr - 1) % 3;
        });

        this.totalOptionPages = Math.ceil(this.productOptions.length / this.optionPageSize);
        this.optionCurrentPage = 0;
        this.getProductOptionPage(true);
    }

    getOptionsForCategory(optionCategory: OptionCategory) {
        this.allOptionCategorySelected = false;
        this.productOptions = this.allProductOptions.filter(po => po.CategoryCode == optionCategory.PriKey);
        this.totalOptionPages = Math.ceil(this.productOptions.length / this.optionPageSize);
        this.setOptionsPosition();
        this.optionCategories.forEach(oc => oc.Selected = false);
        optionCategory.Selected = true;
    }

    createNewOrder() {
        this.orderHeader = { TaxExempt: this.DBService.systemSettings.TaxExempt, Gratuity: 0, Discount: 0 };
    }

    getFullOrder(orderFilter: number) {
        this.orderHeader = { TaxExempt: this.DBService.systemSettings.TaxExempt, Gratuity: 0, Discount: 0 };
        this.apiSvc.getFullOrder(orderFilter).subscribe(orderResponse => {
            this.orderResponse = orderResponse;
            this.orderItems = orderResponse.OrderDetail;
            this.ticketNumber = this.orderResponse.Order.OrderID;
            this.checkNumber = this.orderResponse.Order.CheckNumber;
            this.table = this.orderResponse.Order.TableNumber;
            this.DBService.getLocalEmployee(this.orderResponse.Order.EmployeeID).then(employee => this.server = employee.FirstName);
            this.guests = this.orderResponse.Order.NumberGuests;
            this.orderItems.forEach(oi => oi.Class = 'disabledTextColor');
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
    }

    nextSeat() {
        this.currentSeatNumber++;
    }

    displayMainCategories() {
        this.showMainCategories = true;
        this.showSubCategories = false;
        this.showOptions = false;
    }

    checkCategoryTimer(categoryID: number): boolean {
        let timers: MenuTimer[] = this.allTimers.filter(t => t.CategoryToLock == categoryID)
        let locked: boolean = false;

        if (timers.length == 0)
            return false;

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
        let that = this;

        timers.forEach(function (timer: MenuTimer) {
            // start time is later than end time 
            let date1: Date = new Date();
            let date2: Date = new Date();
            let now: Date = new Date();

            if (parseInt(timer.StartTime.replace(':', '')) > parseInt(timer.EndTime.replace(':', ''))) {
                if (now.getHours() <= parseInt(timer.EndTime.substr(0, 2))) {
                    date1 = that.convertToDate(that.addDays(now, -1).toDateString(), timer.StartTime);
                    date2 = that.convertToDate(now.toDateString(), timer.EndTime);
                }
                else {
                    date1 = that.convertToDate(now.toDateString(), timer.StartTime);
                    date2 = that.convertToDate(that.addDays(now, 1).toDateString(), timer.EndTime);
                }
            }
            else {
                date1 = that.convertToDate(now.toDateString(), timer.StartTime);
                date2 = that.convertToDate(now.toDateString(), timer.EndTime);
            }

            console.log(now.toDateString() + ' ' + now.toTimeString());
            console.log(date1.toDateString() + ' ' + date1.toTimeString());
            console.log(date2.toDateString() + ' ' + date2.toTimeString());

            if (now > date2 || now < date1) {
                locked = true;
                return;
            }
        });

        return locked;
    }

    categorySelected(category: MenuCategory) {

        let isCategoryLocked = this.checkCategoryTimer(category.CategoryID);

        if (isCategoryLocked) {
            alert(category.Name + " not available during this time period.");
            return;
        }

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
        if (this.currentProduct == product) {
            this.currentOrderItem.Quantity++;
            this.currentOrderItem.ExtPrice = this.currentOrderItem.Quantity * this.currentOrderItem.UnitPrice;
            this.totalPrice();
        }
        else {
            this.showOptionsButton = true;
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
            this.qtyEntered = 1;

            if (product.PromptQty) {
                this.showPromptQty(product);
            }
            else {
                this.addProductToOrder(product);
            }
        }
    }

    showForcedModifierDialog(isAdding: boolean) {

        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: true,
            context: { orderProduct: this.currentOrderItem, isAdding: isAdding }
        };

        let that = this;

        this.modalService.showModal(ForcedModifiersComponent, modalOptions).then(
            (selectedItems: OrderDetail[]) => {
                if (selectedItems != null) {
                    this.currentSeatNumber++;
                    /*
                    if (isAdding) {
                        this.addProductToOrder(product);
                    }
                    */
                    selectedItems.forEach(function (od: OrderDetail) {
                        that.orderItems.push(od);
                        /*
                        if (od.ItemType == ItemType.SubOption)
                        {
                            that.currentSubOption = {
                                Name: od.ProductName,
                                PrintName: od.PrintName,
                                ApplyCharge: od.ApplyCharge,
                            };
                        }
                        else
                        {
                            that.currentMenuOption = {
                                Name: od.ProductName,
                                PrintName: od.PrintName,
                                ApplyCharge: od.ApplyCharge,
                                ReportProductMix: od.ReportProductMix
                            };
                        }
                        */
                        /*
                        that.addItemToOrder(0, od.ProductName, od.UnitPrice, od.ItemType,
                            that.currentOrderItem.ProductCode, od.IndexDataSub);
                        */
                    });
                    this.totalPrice();
                    this.setLastItemOrdered();
                }
                else {
                    // cancelled selected on forced modifier page, remove item just added 
                    if (isAdding)
                    {
                        this.currentProduct = null;
                        this.deleteOrderItem(this.currentOrderItem);
                    }
                }
            });
    }

    showForcedModifierDialogOrderItem(orderItem: OrderDetail) {
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: true,
            context: {
                orderItems: this.orderItems.filter(oi => oi.IndexData == orderItem.IndexData),
                currentChoices: this.orderItems.filter(oi => oi.IndexData == orderItem.IndexData &&
                    (oi.ItemType == ItemType.ForcedChoice ||
                        oi.ItemType == ItemType.SubOption))
            }
        };
        let that = this;

        this.modalService.showModal(ForcedModifiersComponent, modalOptions).then(
            (selectedItems) => {
                if (selectedItems != null) {
                    // remove current choices
                    this.orderItems = this.orderItems.filter(oi => oi.ItemType != ItemType.ForcedChoice && oi.ItemType != ItemType.SubOption);

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
            this.productInfoClass = 'glass btnOK fa';
        else
            this.productInfoClass = 'glass fa';
    }

    changeGuestsNumber() {
        this.router.navigate(['/home/tableguests/' + this.table]);
    }

    changeChoice() {
        this.showForcedModifierDialog(false);
    }

    addProductToOrder(menuProduct: MenuProduct) {
        //let marginLeft: number = this.getLeftMargin(ItemType.Product);

        this.DBService.getLocalProduct(menuProduct.ProductID).then(product => {
            let orderItem: OrderDetail = Object.assign({}, product);
            orderItem = this.getInitializedOrderItem(orderItem);
            orderItem.IndexData = this.getNextIndexData();
            orderItem.FilterNumber = this.getNextFilterNumber();
            orderItem.OrderFilter = 0;
            orderItem.Quantity = this.qtyEntered;
            orderItem.ExtPrice = this.qtyEntered * product.UnitPrice;
            orderItem.EmployeeID = this.DBService.loggedInUser.PriKey;
            orderItem.MarginLeft = 0;
            orderItem.Class = 'lastOrderItem';
            orderItem.ProductCode = menuProduct.ProductCode;
            orderItem.PriceLevel = this.priceLevel;
            orderItem.ItemType = ItemType.Product;
            orderItem.SeatNumber = this.currentSeatNumber.toString();
            /*
            let orderItem: OrderDetail = {              
                OrderTime: new Date(),            
                ProductName: product.ProductName,
                SeatNumber: this.currentSeatNumber.toString(),
                TaxRate: product.TaxRate,
                ProductType: product.ProductType,
                IndexData: this.getNextIndexData(),
                FilterNumber: this.getNextFilterNumber(),
                OrderFilter: 0,
                Quantity: this.qtyEntered,  
                ExtPrice: this.qtyEntered * product.UnitPrice,
                PrintCode: product.PrintCode,
                CategoryCode: product.CategoryCode,    
                ProductGroup: product.ProductGroup,
                Taxable: product.Taxable,
                ProductCode: menuProduct.ProductCode,
                ProductFilter: product.ProductFilter,
                ItemType: ItemType.Product,
                EmployeeID: this.DBService.loggedInUser.PriKey,
                PrintName: product.PrintName,                
                PrintCode1: product.PrintCode1,
                CouponCode: product.CouponCode,
                Pizza: product.Pizza,
                UnitPrice: product.UnitPrice,                                                    
                MarginLeft: 0
            }
            */
            if (this.orderItems.length > 0)
                this.orderItems[this.orderItems.length - 1].Class = 'orderItem';

            this.orderItems.push(orderItem);
            this.currentOrderItem = orderItem;
            this.totalPrice();
            this.setLastItemOrdered();
            if (product.UseForcedModifier) {
                this.showForcedModifierDialog(true);
            }
            this.previousProduct = this.currentProduct;
        });
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
                    this.showForcedModifierDialog(true);
                }
                else {
                    this.addProductToOrder(product);
                }
            });
    }

    showModifyDialog(orderItem: OrderDetail) {

        if (orderItem != null)
            this.currentOrderItem = orderItem;
        else
            orderItem = this.currentOrderItem;

        let context = { orderItem: orderItem };

        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: false,
            context: context
        };

        let that = this;
        let orderProduct = this.orderItems.find(oi => oi.IndexData == orderItem.IndexData && oi.ItemType == ItemType.Product);

        this.modalService.showModal(ModifyOrderItemComponent, modalOptions).then(
            (choice: Choice) => {
                switch (choice.ChangeType) {
                    case 'quantity':
                        orderProduct.Quantity = parseFloat(choice.SelectedNumber);
                        orderProduct.ExtPrice = orderProduct.UnitPrice * parseFloat(choice.SelectedNumber);
                        this.totalPrice();
                        break;
                    case 'seat':
                        orderProduct.SeatNumber = choice.SelectedNumber;
                        break;
                    case 'delete':
                        if (orderItem.ItemType != ItemType.ForcedChoice)
                            this.deleteOrderItem(orderItem);
                        break;
                    case 'repeat':
                        this.repeatOrderItem(orderItem);
                        break;
                    case 'modify':
                        this.getMenuOptions(orderProduct.ProductCode);
                        this.showOptionsButton = false;
                        break;
                    case 'changechoice':
                        //this.showForcedModifierDialogOrderItem(orderItem);
                        this.changeChoice();
                        break;
                }
            });
    }

    addOption(isMemo: boolean, itemName: string, amount: number, isSubOption: boolean) {
        let qty = this.currentOrderItem.Quantity;
        let customStamp: boolean = false;
        let unitPrice: number = 0;
        let applyCharge: boolean = false;
        let optionName: string = '';
        let printName: string = null;
        let orderDetail: OrderDetail = null;
        //let filterNumber: number = 0;
        let reportProductMix: boolean = false;
        let modifierIgnoreQuantity: boolean = false;
        let strOption = '';
        let textPosition: number = 0;

        if (this.currentModifierType == ModifierType.USERDEFINED && this.currentUserModifier.ButtonFunction == 1)
            customStamp = true;

        if (isSubOption) {
            if (!isMemo && this.currentModifierType != ModifierType.TOGO && this.currentModifierType != ModifierType.NOMAKE && !customStamp) {
                if (this.isShowingMainOptions) {
                    unitPrice = this.currentOption.Price;
                    optionName = this.currentOption.Name;
                    printName = this.currentOption.PrintName;
                }
                else {
                    applyCharge = this.currentSubOption.ApplyCharge;
                    optionName = this.currentSubOption.Name;
                    printName = this.currentSubOption.PrintName;
                }
            }
            orderDetail = this.orderItems.find(od => od.IndexData == this.currentOrderItem.IndexData &&
                od.IndexDataSub == this.currentOrderItem.IndexDataSub &&
                (od.ItemType == ItemType.Choice || od.ItemType == ItemType.ForcedChoice));
            orderDetail.OptionCode = this.currentSubOption.Key;
            orderDetail.PriKey = 0
        }
        else    // not suboption
        {
            if (!isMemo && this.currentModifierType != ModifierType.TOGO && this.currentModifierType != ModifierType.NOMAKE && !customStamp) {
                if (this.isShowingMainOptions) {
                    unitPrice = this.currentMenuOption.Price;
                    optionName = this.currentMenuOption.Name;
                    printName = this.currentMenuOption.PrintName;
                }
                else {
                    applyCharge = this.currentMenuOption.ApplyCharge;
                    optionName = this.currentMenuOption.Name;
                    printName = this.currentMenuOption.PrintName;
                    reportProductMix = this.currentMenuOption.ReportProductMix;
                }
            }
            modifierIgnoreQuantity = this.currentOrderItem.ProductFilter == 0;
            orderDetail = Object.assign({}, this.orderItems.find(od => od.IndexData == this.currentOrderItem.IndexData && od.ItemType == ItemType.Product));
            orderDetail.PriKey = 0
        }

        orderDetail.OrderTime = new Date();
        orderDetail.IndexDataOption = isSubOption ? 0 : -1
        orderDetail.Quantity = null
        orderDetail.UnitPrice = null
        orderDetail.ExtPrice = null
        orderDetail.ReportProductMix = reportProductMix
        orderDetail.ItemType = isSubOption ? ItemType.SubOption : ItemType.Option

        if (!isMemo) {
            switch (this.currentModifierType) {
                case ModifierType.NONE:
                    strOption = '     '; //??? remove?
                    if (applyCharge) {
                        orderDetail.UnitPrice = unitPrice;
                    }
                    orderDetail.ExtPrice = modifierIgnoreQuantity ? unitPrice : unitPrice * qty;
                    break;

                case ModifierType.LESS:
                case ModifierType.NO:
                    strOption = '     ' + ModifierType[this.currentModifierType] + ' ';
                    break;

                case ModifierType.EXTRA:
                case ModifierType.ADD:
                    strOption = '     ' + ModifierType[this.currentModifierType] + ' ';
                    if (unitPrice > 0) {
                        orderDetail.UnitPrice = unitPrice;
                        orderDetail.ExtPrice = modifierIgnoreQuantity ? unitPrice : unitPrice * qty;
                    }
                    break;

                case ModifierType.ONTHESIDE:
                    strOption = ' OTS';
                    if (unitPrice > 0) {
                        orderDetail.UnitPrice = unitPrice;
                        orderDetail.ExtPrice = modifierIgnoreQuantity ? unitPrice : unitPrice * qty;
                    }
                    textPosition = 1;
                    break;

                case ModifierType.HALF:
                    strOption = '     1/2';
                    if (unitPrice > 0) {
                        orderDetail.UnitPrice = this.round2Decimals(unitPrice / 2);
                        orderDetail.ExtPrice = modifierIgnoreQuantity ? orderDetail.UnitPrice : orderDetail.UnitPrice * qty;
                    }
                    break;

                case ModifierType.NOMAKE:
                case ModifierType.TOGO:
                    strOption = '     ' + ModifierType[this.currentModifierType];
                    break;

                case ModifierType.USERDEFINED:
                    if (this.currentUserModifier.ButtonFunction == 1) {
                        strOption = '     ' + this.currentUserModifier.ItemName;
                        if (this.currentUserModifier.StampPrice) {
                            orderDetail.UnitPrice = unitPrice;
                            orderDetail.ExtPrice = modifierIgnoreQuantity ? unitPrice : unitPrice * qty;
                        }
                    }
                    else {
                        strOption = '     ' + this.currentUserModifier.ItemName + ' ';
                        orderDetail.UnitPrice = 0;

                        if (this.currentUserModifier.ApplyCharge) {
                            orderDetail.UnitPrice = unitPrice;
                        }
                        else if (this.currentUserModifier.ButtonFunction == 3 && this.currentUserModifier.StampPrice) {
                            orderDetail.UnitPrice = this.currentUserModifier.Price;
                        }
                        orderDetail.ExtPrice = modifierIgnoreQuantity ? orderDetail.UnitPrice : orderDetail.UnitPrice * qty;
                        textPosition = this.currentUserModifier.TextPosition;
                    }
            }
        }

        if (this.currentModifierType == ModifierType.NOMAKE || this.currentModifierType == ModifierType.TOGO || customStamp) {
            orderDetail.ProductName = strOption;
            orderDetail.PrintName = strOption;
        }
        else {
            if (textPosition == 1) {
                orderDetail.ProductName = '     ' + optionName + strOption;
            }
            else {
                orderDetail.ProductName = strOption + optionName;
                if (printName != null) {
                    orderDetail.PrintName = printName != '' ? strOption + printName : orderDetail.ProductName;
                }
            }
        }

        if (isMemo) {
            orderDetail.ProductName = '     ' + itemName + strOption;
            orderDetail.PrintName = '     ' + itemName + strOption;
            if (amount > 0) {
                orderDetail.UnitPrice = amount;
                orderDetail.ExtPrice = amount * qty;
            }
        }

        this.orderItems.push(orderDetail);
        this.processFilterNumber();
    }

    round2Decimals(inNumber: number) {
        return Math.round(inNumber * 100) / 100
    }

    processFilterNumber() {
        let i: number = 1;
        this.orderItems.forEach(oi => {
            oi.ExtPrice = oi.ExtPrice > 0 ? oi.ExtPrice : null;     // hide amount if zero
            oi.Class = 'orderItem';
            oi.FilterNumber = i;
            i++;
        })

        if (this.orderItems.length > 0)
            this.orderItems[this.orderItems.length - 1].Class = 'lastOrderItem'
    }

    onOptionSwipe(args) {
        if (this.totalOptionPages <= 1)
            return;

        // at last page, can only swipe down
        if (this.optionCurrentPage == this.totalOptionPages) {
            if (args.direction == SwipeDirection.down) {
                if (this.isShowingMainOptions)
                    this.getProductOptionPage(false);
                else
                    this.getOptionPage(false);
            }
        }
        // at first page, can only swipe up
        else
            if (this.optionCurrentPage == 1) {
                if (args.direction == SwipeDirection.up) {
                    if (this.isShowingMainOptions)
                        this.getProductOptionPage(true);
                    else
                        this.getOptionPage(true);
                }
            }
            // else, can swipe up or down
            else
                if (this.optionCurrentPage >= 1) {
                    // go to next page            
                    if (args.direction == SwipeDirection.up) {
                        if (this.isShowingMainOptions)
                            this.getProductOptionPage(true);
                        else
                            this.getOptionPage(true);
                    }
                    else
                        // go to previous page
                        if (args.direction == SwipeDirection.down) {
                            if (this.isShowingMainOptions)
                                this.getProductOptionPage(false);
                            else
                                this.getOptionPage(false);
                        }
                }

    }

    getOptionCategoryPage(nextPage: boolean) {
        if (nextPage)
            this.optionCategoryCurrentPage++;
        else
            this.optionCategoryCurrentPage--;

        let startPosition: number = (this.optionCategoryCurrentPage * this.optionCategoryPageSize) - this.optionCategoryPageSize + 1;
        let endPosition: number = startPosition + this.optionCategoryPageSize - 1;

        if (endPosition > this.optionCategories[this.optionCategories.length - 1].Position)
            endPosition = this.optionCategories[this.optionCategories.length - 1].Position;

        this.pageOptionCategories = this.optionCategories.filter(
            o => o.Position >= startPosition && o.Position <= endPosition);

        this.canOptionCategoryPageUp = this.optionCategoryCurrentPage > 1;
        this.canOptionCategoryPageDown = this.totalOptionCategoryPages > this.optionCategoryCurrentPage;
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

    getProductOptionPage(nextPage: boolean) {
        if (nextPage)
            this.optionCurrentPage++;
        else
            this.optionCurrentPage--;

        let startPosition: number = (this.optionCurrentPage * this.optionPageSize) - this.optionPageSize + 1;
        let endPosition: number = startPosition + this.optionPageSize - 1;

        if (endPosition > this.productOptions[this.productOptions.length - 1].Position)
            endPosition = this.productOptions[this.productOptions.length - 1].Position;

        this.pageOptions = this.productOptions.filter(
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

        if (this.currentFixedOption != null) {
            if (fixedOption.Name == this.currentFixedOption.Name) {
                this.currentFixedOption = null;
                this.currentModifierType = null;
                return;
            }
        }

        this.userModifierActive = false;

        switch (fixedOption.Name) {
            case 'NO MAKE':
            case 'TO GO':
                this.currentModifierType = fixedOption.ModifierType;
                this.addOption(false, fixedOption.Name, null, false);
                /*
                                this.addItemToOrder
                                    (
                                        0, fixedOption.Name, 0, ItemType.Option, this.currentProduct.ProductCode, this.getNextIndexDataSub(this.currentOrderItem.IndexData)
                                    );
                */
                break;

            default:
                {
                    this.currentFixedOption = fixedOption;
                    fixedOption.Class = 'glass btnOptionActive';
                    this.currentModifierType = fixedOption.ModifierType;
                }
        }
    }

    cancelOrder() {
        if (this.orderItems.filter(oi => oi.OrderFilter == null).length > 0) {
            dialogs.confirm({
                title: "Cancel Order",
                message: "Cancel this order?",
                okButtonText: "Yes, cancel order",
                cancelButtonText: "No"
            }).then(isCanceling => {
                if (isCanceling)
                    //this.router.back();
                    this.zone.run(() => this.router.navigate(['/home/area']));
            });
        }
        else {
            //this.router.back();            
            this.zone.run(() => this.router.navigate(['/home/area']));
        }
    }

    optionSelected(option: MenuOption) {
        /*
                let name: string = '';
                let price: number = 0;
        
                if (this.userModifierActive) {
                    name = this.currentUserModifier.ItemName + ' ' + option.Name;
                    price = this.currentUserModifier.StampPrice ? this.currentUserModifier.Price : option.Charge;
                }
                else {
                    name = this.currentFixedOption == null ? option.Name : this.currentFixedOption.Name + ' ' + option.Name;
                    price = option.Name == 'EXTRA' || option.Name == 'ADD' ? option.Charge : 0;
                }
        
                let modifier: Modifier = {
                    Name: name,
                    Price: price,
                    DisplayPrice: price > 0 ? price : null
                };
        */
        if (this.currentModifierType == null)
            this.currentModifierType = ModifierType.NONE;

        this.currentMenuOption = option;
        this.addOption(false, option.Name, null, false);
        /*
        this.addItemToOrder
            (0, modifier.Name, modifier.Price, ItemType.Option, this.currentProduct.ProductCode,
                this.getNextIndexDataSub(this.currentOrderItem.IndexData));
        */
    }

    getNextOptionFilterNumber(): number {
        if (this.orderItems.length == 0)
            return 0;

        return Math.max.apply(Math, this.orderItems
            .filter(oi => oi.IndexData == this.currentOrderItem.IndexData && oi.IndexDataSub == this.currentOrderItem.IndexDataSub)
            .map(function (oi) { return oi.FilterNumber + 1; }));
    }

    getNextFilterNumber(): number {
        if (this.orderItems.length == 0)
            return 0;

        return Math.max.apply(Math, this.orderItems
            .filter(oi => oi.ItemType == ItemType.Product)
            .map(function (oi) { return oi.FilterNumber + 1; }));
    }

    getNextIndexData(): number {
        if (this.orderItems.length == 0)
            return 1;

        return Math.max.apply(Math, this.orderItems
            .filter(oi => oi.ItemType == ItemType.Product)
            .map(function (oi) { return oi.IndexData + 1; }));
    }

    getNextIndexDataSub(indexData: number): number {
        if (this.orderItems.filter(oi => oi.IndexData == indexData && oi.ItemType == ItemType.Option).length == 0)
            return 0;

        return Math.max.apply(Math, this.orderItems
            .filter(oi => oi.IndexData == indexData && oi.ItemType == ItemType.Option)
            .map(function (oi) { return oi.IndexDataSub + 1; }));
    }

    getLeftMargin(itemType: ItemType): number {
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

    getInitializedOrderItem(orderItem: OrderDetail): OrderDetail {
        if (orderItem == null)
            return {
                FilterNumber: 0,
                Quantity: 0,
                ExtPrice: 0,
                Reprint: 0,
                PriKey: 0,
                Refund: false,
                HappyHour: false,
                ExcludeFromInventory: false,
                Paid: false,
                Comped: false,
                IgnoreTax: false,
                ReportProductMix: false
            }
        else {
            orderItem.FilterNumber = 0;
            orderItem.Quantity = 0;
            orderItem.ExtPrice = 0;
            orderItem.Reprint = 0;
            orderItem.PriKey = 0;
            orderItem.Refund = false;
            orderItem.HappyHour = false;
            orderItem.ExcludeFromInventory = false;
            orderItem.Paid = false;
            orderItem.Comped = false;
            orderItem.IgnoreTax = false;
            orderItem.ReportProductMix = false;
            return orderItem;
        }
    }

    addItemToOrder(qty: number, name: string, unitPrice: number,
        itemType: ItemType, productCode: number, indexDataSub: number) {
        let indexData: number = 0;
        let marginLeft: number = this.getLeftMargin(itemType);

        // add modifier/option
        let indentation: string = '   ';
        if (itemType == ItemType.SubOption)
            indentation = '      ';

        indexData = this.currentOrderItem.IndexData;
        let lastIndex: number = this.orderItems.map(oi =>
            oi.IndexData === indexData).lastIndexOf(true);

        let orderItem: OrderDetail = this.getInitializedOrderItem(null);

        orderItem.SeatNumber = this.currentSeatNumber.toString();
        orderItem.UnitPrice = unitPrice;
        orderItem.PrintName = indentation + name;
        orderItem.ProductName = indentation + name;
        orderItem.ItemType = itemType;
        orderItem.IndexData = indexData;
        orderItem.ProductCode = productCode;
        orderItem.MarginLeft = marginLeft;
        orderItem.IndexDataSub = indexDataSub;

        // add item to the order
        this.orderItems.splice(lastIndex + 1, 0, orderItem);

        this.totalPrice();
        this.setLastItemOrdered();
    }

    setLastItemOrdered() {
        this.orderItems.forEach(oi => oi.Class = 'orderItem');

        if (this.orderItems.length > 0)
            this.orderItems[this.orderItems.length - 1].Class = 'lastOrderItem'
    }

    userModifierSelected(userModifier: UserModifier) {
        this.resetUserModifierClasses();
        this.resetFixedOptionClasses();
        this.currentModifierType = ModifierType.USERDEFINED;
        this.currentUserModifier = userModifier;

        if (userModifier.ButtonFunction == 1) {
            /*
            this.addItemToOrder
                (
                    this.currentOrderItem.Quantity,
                    userModifier.ItemName,
                    userModifier.Price,
                    ItemType.Option,
                    this.currentProduct.ProductCode,
                    null
                );
            */
            this.addOption(false, userModifier.ItemName, null, false);
            return;
        }

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

    onOptionCategorySwipe(args) {
        if (this.totalOptionCategoryPages <= 1)
            return;

        // at last page, can only swipe left
        if (this.optionCategoryCurrentPage == this.totalOptionCategoryPages) {
            if (args.direction == SwipeDirection.left) {
                this.getOptionCategoryPage(false);
            }
        }
        // at first page, can only swipe up
        else
            if (this.optionCategoryCurrentPage == 1) {
                if (args.direction == SwipeDirection.right) {
                    this.getOptionCategoryPage(true);
                }
            }
            // else, can swipe up or down
            else
                if (this.optionCategoryCurrentPage >= 1) {
                    // go to next page            
                    if (args.direction == SwipeDirection.right) {
                        this.getOptionCategoryPage(true);
                    }
                    else
                        // go to previous page
                        if (args.direction == SwipeDirection.left) {
                            this.getOptionCategoryPage(false);
                        }
                }
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
        if (orderItem.OrderFilter) {
            this.showReasonDialog(orderItem);
        }
        else {
            // if item is product, delete product and all associated modifiers
            if (orderItem.ItemType == ItemType.Product)
                this.orderItems = this.orderItems.filter(obj => obj.IndexData !== orderItem.IndexData);
            else
                if (orderItem.ItemType == ItemType.SubOption) {
                    this.orderItems = this.orderItems.filter(obj => obj !== orderItem);
                }
                else {
                    this.orderItems = this.orderItems.filter(obj => obj.IndexDataSub !== orderItem.IndexDataSub);
                }

            if (orderItem.ExtPrice > 0)
                this.totalPrice();
        }
    }

    repeatOrderItem(orderItem: OrderDetail) {
        let itemsToCopy = this.orderItems.filter(oi => oi.IndexData == orderItem.IndexData);
        let nextIndexData: number = this.getNextIndexData();
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
                    IndexData: nextIndexData,
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
            this.tax = this.utilSvc.getTaxTotal(this.orderHeader, this.orderItems);
            this.checkTotal = this.subTotal + this.tax;

            if (this.guests >= this.MAX_GUESTS) {
                this.tips = this.subTotal * this.TIPS_PCT;
                this.checkTotal += this.tips;
            }
        }
    }
/*
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
*/
    showReasonDialog(orderItem: OrderDetail) {
        // get the product Order
        //let _orderItem: OrderDetail = this.orderItems.find( oi => oi.ItemType == ItemType.Product && oi.IndexData == orderItem.IndexData)
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: true
        };

        this.modalService.showModal(ReasonComponent, modalOptions).then(
            (reason: string) => {
                // delete product from order if reason given          
                if (reason != null) {
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
                //this.addItemToOrder(0, memo.Memo, memo.Price, ItemType.Option, this.currentProduct.ProductCode, null);
                this.currentModifierType = ModifierType.NONE;
                this.addOption(true, memo.Memo, memo.Price, false);
            });
    }

    showSearchDialog() {
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: true
        };

        this.modalService.showModal(SearchComponent, modalOptions).then(
            (searchTerm: string) => {
                if (searchTerm != '') {
                    this.getProductOptions(searchTerm);
                }
            });
    }

    sendCheck() {
        //var printController = UIPrintInteractionController;
        //console.log(printController.printingAvailable);
        //this.printReceipt();
        //this.utilSvc.sendToPrinter('hello', {'username': 'trung'});
        //this.printerSocket.send('hello');
        //this.socketIO.emit("test", { test: "test" });
    }

    printReceipt() {

    }

    getMenuTimers() {
        this.lockedCategoryId = 0;
        let timers: MenuTimer[] = [];

        let that = this;
        this.DBService.getLocalMenuTimers().then((menuTimers) => {
            if (menuTimers.length == 0) {
                dialogs.alert("Missing Menu Timers");
            }
            else {
                this.allTimers = menuTimers;

                if (this.DBService.systemSettings.AutoCategory) {
                    // CategoryName is actually CategoryID
                    this.currentCategoryID = this.DBService.systemSettings.CategoryName;
                    this.showMainCategories = false;
                }

                let isCategoryLocked: boolean = false;
                isCategoryLocked = this.checkMenuTimer(MenuTimerType.Locked, OverrideType.Type2, false);

                if (isCategoryLocked) {
                    this.currentCategoryID = this.lockedCategoryId;
                    this.showMainCategories = false;
                }

                isCategoryLocked = this.checkMenuTimer(MenuTimerType.Locked, OverrideType.Type0, false);

                if (isCategoryLocked) {
                    this.currentCategoryID = this.lockedCategoryId;
                }

                if (this.currentCategoryID == 0) {
                    this.showMainCategories = true;
                }

                this.DBService.getLocalMenuCategories().then((categories) => {
                    if (categories.length == 0) {
                        dialogs.alert("Main Categories not loaded.");
                    }
                    else {
                        this.loadCategories(categories);
                        this.categorySelected(this.categories.find(x => x.CategoryID == this.currentCategoryID));
                    }
                });
            }
        });
    }

    convertToDate(date: string, time: string) {
        return new Date(date + ' ' + time);
    }

    addDays(date: Date, daysToAdd: number) {
        return new Date(date.getTime() + (daysToAdd * (1000 * 60 * 60 * 24)));
    }

    checkMenuTimer(timerType: MenuTimerType, overrideType: number, checkLocked: boolean): boolean {
        let checkMenuTimer: boolean = false;
        this.priceLevel = 0;
        let totalCategory: number = 0;
        let timers: MenuTimer[] = [];
        let _category = this.lockedCategoryId;
        let that = this;

        if (timerType == MenuTimerType.Undefined) {
            timers = this.allTimers.filter(x => x.Enabled == true);

        }
        else if (timerType == MenuTimerType.Locked) {
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

            if (parseInt(timer.StartTime.replace(':', '')) > parseInt(timer.EndTime.replace(':', ''))) {
                if (now.getHours() <= parseInt(timer.EndTime.substr(0, 2))) {
                    date1 = that.convertToDate(that.addDays(now, -1).toDateString(), timer.StartTime);
                    date2 = that.convertToDate(now.toDateString(), timer.EndTime);
                }
                else {
                    date1 = that.convertToDate(now.toDateString(), timer.StartTime);
                    date2 = that.convertToDate(that.addDays(now, 1).toDateString(), timer.EndTime);
                }
            }
            else {
                date1 = that.convertToDate(now.toDateString(), timer.StartTime);
                date2 = that.convertToDate(now.toDateString(), timer.EndTime);
            }

            if (now > date1 && now <= date2) {
                switch (timerType) {
                    case MenuTimerType.Price:
                        this.priceLevel = timer.PriceLevel;
                        checkMenuTimer = true;
                        break;
                    case MenuTimerType.Locked:
                        if (!checkLocked) {
                            switch (overrideType) {
                                case 1:
                                    if (!timer.OverRideCategoryBar)
                                        checkMenuTimer = false;
                                    else {
                                        that.lockedCategoryId = timer.CategoryToLock;
                                        checkMenuTimer = true;
                                    }

                                    break;
                                case 2:
                                    if (!timer.OverRideCategoryDineIn)
                                        checkMenuTimer = false;
                                    else {
                                        that.lockedCategoryId = timer.CategoryToLock;
                                        checkMenuTimer = true;
                                    }

                                    break;
                            }
                            break;
                        }
                        else
                            return true;
                    case MenuTimerType.Default:
                        that.lockedCategoryId = timer.DefaultCategory;
                        switch (that.orderType) {
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
                if (timerType == MenuTimerType.Locked) {
                    if (checkLocked) {
                        if (that.lockedCategoryId != timer.CategoryToLock)
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