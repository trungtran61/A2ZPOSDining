import { Component, OnInit, ViewContainerRef, NgZone, ViewChild, ElementRef } from "@angular/core";
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
import { OrderType, Countdown, FixedOption, OrderHeader, OrderDetail, OrderResponse, ItemType, ModifierType, OrderUpdate, DirectPrintJobsRequest, PrintType, PrintStatus, PrintStatusDetail } from "~/app/models/orders";
import { APIService } from "~/app/services/api.service";
import { PromptQtyComponent } from "./prompt-qty.component";
import { MemoComponent } from "./memo.component";
import { UtilityService } from "~/app/services/utility.service";
import { ForcedModifiersComponent } from "./forced-modifiers/forced-modifiers.component";
import { ModifyOrderItemComponent } from "./modify-order-item.component";
import { ActivatedRoute } from "@angular/router";
import { ReasonComponent } from "./reason.component";
import { SearchComponent } from "./search.component";
//import { GuestsComponent } from "./guests.component";

const CHOICE_PAGESIZE: number = 20;
const PRODUCT_PAGESIZE: number = 24;
const SUBCATEGORY_PAGESIZE: number = 5;
const OPTION_PAGESIZE: number = 18;
const OPTIONCATEGORY_PAGESIZE: number = 3;
const SPACES10: string = '          ';
const SPACES5: string = '   ';
const SPACES3: string = '   ';

@Component({
    selector: "order",
    moduleId: module.id,
    templateUrl: "./order.component.html",
    styleUrls: ['./order.component.css']
})

export class OrderComponent implements OnInit {
    @ViewChild('orderScroller') private orderScroller: ElementRef;
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
    newItemsCount: number = 0;

    productOptions: MenuOption[];
    allProductOptions: MenuOption[];
    optionCategories: OptionCategory[];
    pageOptionCategories: OptionCategory[];
    optionCategoryCurrentPage: number = 0;
    totalOptionCategoryPages: number = 0;
    allOptionCategorySelected: boolean = true;
    
    menuOptions: MenuOption[];
    pageOptions: MenuOption[];
    totalOptionPages: number = 0;
    optionCurrentPage: number = 1;
    userModifiers: UserModifier[]; // bottom row user defined options

    categoryCodes: CategoryCode[] = [];
    //orderHeader: OrderHeader = null;
    orderResponse: OrderResponse = null;
    orderItems: OrderDetail[] = [];
    orderProducts: OrderDetail[] = [];
    
    currentSeatNumber: number = 1;
    //checkTotal: number = 0;
    //checkTotalAll: number = 0;
    //subTotal: number = 0;
    //tax: number = 0;
    //taxAll: number = 0;
    //discount: number = 0;
    //tips: number = 0;
    //guests: number = 0;
    //table: string = '';
    //server: string = '';
    //checkNumber: number = 1;
    checkTitle: string = '';
    currentSubCategory: MenuSubCategory;
    currentSubCategoryName: string = '';
    subCategoriesTitle: string = '';
    mainCategory: string = '';
    lockedCategoryId: number = 0;
    currentProduct: MenuProduct;
    selectedProduct: Product;
    previousProduct: MenuProduct;
    //ticketNumber: number = 0;

    isShowingMainCategories: boolean = true;
    isShowingSubCategories: boolean = false;
    isShowingOptions: boolean = false;
    isShowingProducts: boolean = false;
    isShowingDetails: boolean = true;
    isShowingExtraFunctions: boolean = false;
    isShowingProductInfo: boolean = false;
    isShowingBottomNav: boolean = true;
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
    selectedOrderItem: OrderDetail = null;
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
    //orderType: number = OrderType.DineIn;

    isExistingOrder: boolean = false;
    orderModified: boolean = false;
    isShowingMainOptions: boolean = false;
    productOptionsClass: string = 'glass productOptions';
    allOptionFilterClass: string = 'glass';

    priceLevel: number = 0;
    currentModifierType: ModifierType;

    isShowingOptionsButton: boolean = false;

    //employeeID: number = 0;
    //area: number = 0;

    choices: MenuChoice[] = [];
    pageChoices: MenuChoice[] = [];
    isShowingChoices: boolean = false;
    totalChoicePages: number = 0;
    choiceCurrentPage: number = 1;

    subOptions: MenuChoice[] = [];
    isShowingSubOptions: boolean = false;
    isShowingSubOptionsButton: boolean = false;
    currentItemIndex: number = 0;
    
    isGettingGuests: boolean = false;
    isNormalChoice: boolean = true;
    tableGuestsTitle: string = 'Choose the number of guests for table ';
    guestsEntered: string = '';       

    isOrdering: boolean = true;

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
        //this.utilSvc.startTime = new Date().getTime();          
        page.actionBarHidden = true;
        utilSvc.orderItems = [];        
        /*
        if (isIOS) {
                topmost().ios.controller.navigationBar.barStyle = 1;
        }
        */
        //this.printerSocket = new WebSocket("ws://" + this.printerPort, []);
    }
   
    ngOnInit(): void {        
        console.log('elapsed ms: ' +  (new Date().getTime() - this.utilSvc.startTime));  
        this.isGettingGuests = false;        
        this.tableGuestsTitle += this.utilSvc.table;                 
        //this.guests = parseInt(localStorage.getItem('guests'));        
        this.utilSvc.server = this.DBService.loggedInUser.FirstName;
        this.utilSvc.orderFilter = null;        
        //this.employeeID = this.DBService.loggedInUser.PriKey;        

        this.apiSvc.reloadCountdowns().then(result => {
            this.countdowns = <Countdown[]>result;

            this.getMenuTimers();
            this.getUserModifiers();

            this.route.queryParams.subscribe(params => {
                if (params['action']) {
                    let action: string = params['action'];

                    if (action == 'openTable') {
                        this.isGettingGuests = false;
                        let table: TableDetail = JSON.parse(localStorage.getItem('currentTable'));
                        this.utilSvc.orderFilter = table.OrderFilter;
                        this.getFullOrder(table.OrderFilter);
                        this.isExistingOrder = true;
                        //this.textColorClass = 'disabledTextColor';
                    }
                }
                else {       
                    this.createNewOrder();
                }
            });            
        }
        );
        
        this.getProductOptions('');
        this.getOptionCategories();
        this.allOptionFilterClass = 'glass';          
    } 

    isShowingProductOptions() {
        this.isShowingSubCategories = false;
        this.isShowingMainOptions = !this.isShowingMainOptions;
        this.isShowingOptions = true;
        this.isShowingChoices = false;

        let that = this;

        if (this.isShowingMainOptions) {
            this.productOptionsClass = 'glass productOptionsActive';
            this.optionCategoryCurrentPage = 1;
            this.getOptionCategoryPage();
            this.resetFixedOptionClasses();
            this.resetUserModifierClasses();
            this.totalOptionPages = Math.ceil(that.productOptions[this.productOptions.length - 1].Position / OPTION_PAGESIZE);

            this.optionCurrentPage = 1;
            this.getProductOptionPage();
        }
        else {
            // show menu's options first page
            this.productOptionsClass = 'glass productOptions';
            this.totalOptionPages = Math.ceil(this.menuOptions[this.menuOptions.length - 1].Position / OPTION_PAGESIZE);
            this.optionCurrentPage = 1;
            this.getOptionPage();
        }

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
                this.optionCategoryCurrentPage = 1;
                this.totalOptionCategoryPages = Math.ceil(this.optionCategories[this.optionCategories.length - 1].Position / OPTIONCATEGORY_PAGESIZE);
                this.getOptionCategoryPage();
            }
        });
    }

    getOptionsForAllCategories() {
        this.optionCategories.forEach(oc => oc.Selected = false);
        this.allOptionCategorySelected = true;
        this.productOptions = this.allProductOptions;
        this.setOptionsPosition();
        this.optionCategoryCurrentPage = 1;
        this.getOptionCategoryPage();
    }

    setOptionsPosition() {
        let rowCtr: number = 0;

        this.productOptions.forEach(oc => {
            rowCtr++;
            oc.Position = rowCtr;
            oc.Row = ((Math.floor((rowCtr - 1) / 3)) % 6);
            oc.Col = (rowCtr - 1) % 3;
            oc.Page = Math.ceil(rowCtr / OPTION_PAGESIZE);
            this.totalOptionPages = oc.Page;
        });

        this.optionCurrentPage = 1;
        this.getProductOptionPage();
    }

    getOptionsForCategory(optionCategory: OptionCategory) {
        this.allOptionCategorySelected = false;
        this.productOptions = this.allProductOptions.filter(po => po.CategoryCode == optionCategory.PriKey);
        this.totalOptionPages = Math.ceil(this.productOptions.length / OPTION_PAGESIZE);
        this.setOptionsPosition();
        this.optionCategories.forEach(oc => oc.Selected = false);
        optionCategory.Selected = true;
    }

    createNewOrder() {
        this.utilSvc.orderHeader = { TaxExempt: this.DBService.systemSettings.TaxExempt, Gratuity: 0, Discount: 0 };
    }

    getFullOrder(orderFilter: number) {
        this.utilSvc.orderHeader = { TaxExempt: this.DBService.systemSettings.TaxExempt, Gratuity: 0, Discount: 0 };       
        
        this.apiSvc.getFullOrder(orderFilter).subscribe(orderResponse => {
            //let startTime: number = new Date().getTime();            
            this.orderResponse = orderResponse;
            //this.origOrderItems = orderResponse.OrderDetail;
            //this.utilSvc.orderItems = this.origOrderItems.filter(oi => oi.Voided == null);
            this.utilSvc.orderItems = orderResponse.OrderDetail;
            this.utilSvc.ticketNumber = this.orderResponse.Order.OrderID;
            this.utilSvc.checkNumber = this.orderResponse.Order.CheckNumber;
            this.utilSvc.table = this.orderResponse.Order.TableNumber;
            this.DBService.getLocalEmployee(this.orderResponse.Order.EmployeeID).then(employee => this.utilSvc.server = employee.FirstName);
            this.utilSvc.guests = this.orderResponse.Order.NumberGuests;
            this.utilSvc.orderItems.forEach(oi => oi.Class = 'disabledTextColor');
            this.totalPrice();
            //console.log('elapsed ms: ' +  (new Date().getTime() - startTime));  
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
        this.isShowingMainCategories = true;
        this.isShowingSubCategories = false;
        this.isShowingOptions = false;
    }

    sortOrderItems() {
        this.utilSvc.orderItems.sort((a, b) => ((a.IndexData * 1000) + ((a.IndexDataSub == null ? 0 : a.IndexDataSub) * 100) + a.ItemType >
            (b.IndexData * 1000) + ((b.IndexDataSub == null ? 0 : b.IndexDataSub) * 100) + b.ItemType)
            ? 1 : (((a.IndexData * 1000) + ((a.IndexDataSub == null ? 0 : a.IndexDataSub) * 100) + a.ItemType <
                ((b.IndexData * 1000) + ((b.IndexDataSub == null ? 0 : b.IndexDataSub) * 100) + b.ItemType) ? -1 : 0)));
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
        this.isShowingMainCategories = false;
        this.isShowingSubCategories = true;
        this.isShowingOptions = false;
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

                this.subCategories.forEach(function (sc: MenuSubCategory) {
                    sc.Row = ((sc.Position - 1) % 5) + 1;
                    sc.Col = 0;
                    sc.Page = Math.ceil(sc.Position / SUBCATEGORY_PAGESIZE);
                    sc.Class = 'btnSubCategory';
                    that.totalSubCategoriesPages = sc.Page;
                });

                //this.totalSubCategoriesPages = Math.ceil(this.subCategories[this.subCategories.length - 1].Position / this.subCategoryPageSize);
                //if (this.totalSubCategoriesPages > 1)
                //    this.canSubCategoryPageDown = true;

                this.subCategoryCurrentPage = 1;
                this.getSubCategoryPage(true);
                this.subCategorySelected(subCategories[0]);
            }
        });
    }

    setActiveSubCategoryClass(currentSubCategory: MenuSubCategory) {
        //this.subCategoryClasses = [];
        let that = this;
        this.isShowingSubCategories = true;

        this.pageSubCategories.forEach(function (menuSubCategory: MenuSubCategory) {
            menuSubCategory.Class = 'btnSubCategory'
            //that.subCategoryClasses.push('btnSubCategory');
        });
        currentSubCategory.Class = 'btnSubCategoryActive';
        //this.subCategoryClasses[currentIndex] = 'btnSubCategoryActive';
    }

    subCategorySelected(subCategory: MenuSubCategory) {
        // build menu products list      
        this.hideOptions();
        this.subCategoriesTitle = this.mainCategory + ' - ' + subCategory.Name;
        let that = this;
        //let categoryID: number = parseInt(localStorage.getItem("CategoryID"));
        let categoryID: number = this.currentCategoryID;
        this.currentSubCategory = subCategory;

        this.DBService.getLocalMenuProducts(categoryID, subCategory.SubCategoryID).then((products) => {
            if (products.length == 0) {
                dialogs.alert("Menu Products not loaded.")
            }
            else {
                this.products = products;
                this.setProductAttributes();
                this.productCurrentPage = 1;
                this.getProductPage();
                this.currentSubCategoryName = subCategory.Name;
                this.isShowingProducts = true;
                this.setActiveSubCategoryClass(subCategory);
            }
        });
    }

    setProductAttributes() {
        let that = this;

        this.products.forEach(function (product: MenuProduct) {
            product.Row = ((Math.floor((product.Position - 1) / 4)) % 6) + 1;
            product.Col = (product.Position - 1) % 4;
            product.Page = Math.ceil(product.Position / PRODUCT_PAGESIZE);
            that.totalProductPages = product.Page;
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
                product.OrigQtyAvailable = countdown.Quantity;
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
        this.isShowingMainOptions = false;
        this.currentItemIndex = this.utilSvc.orderItems.length - 1;        

        if (this.previousProduct == product) {
            this.currentOrderItem.Quantity++;
            this.currentOrderItem.ExtPrice = this.currentOrderItem.Quantity * this.currentOrderItem.UnitPrice;
            this.totalPrice();
            product.QtyAvailable -= 1;
        }
        else {
            this.previousProduct = product;
            this.isShowingOptionsButton = true;
            this.currentProduct = product;

            if (this.isShowingProductInfo) {
                dialogs.alert({
                    title: product.Name,
                    message: "Good, healthy ingredients only!",
                    okButtonText: "Close"
                })
                //this.isShowingProductInfo = false;
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
        this.previousProduct = null;

        //let orderItems: OrderDetail[];
        //orderItems = this.utilSvc.orderItems.filter(od => od.IndexData == this.currentOrderItem.IndexData);

        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: true, 
            context: {
                isAdding: isAdding,
                product: this.selectedProduct,
                orderItem: this.currentOrderItem
            }
        };

        let that = this;

        this.modalService.showModal(ForcedModifiersComponent, modalOptions).then(
            (selectedItems: OrderDetail[]) => {
                if (selectedItems != null) {
                    // if changing choices, remove current choices before adding new ones
                    if (!isAdding)
                        this.utilSvc.orderItems = this.utilSvc.orderItems.filter(oi => ((oi.IndexData == this.currentOrderItem.IndexData && oi.ItemType == ItemType.Product) ||
                            oi.IndexData != this.currentOrderItem.IndexData));

                    selectedItems.forEach(function (od: OrderDetail) {
                        od.SeatNumber = that.currentSeatNumber.toString();
                        that.resetLastItemOrdered();
                        od.Class = 'lastOrderItem';
                        //that.orderItems.push(od);
                        that.addItemToOrder(od);
                    });
                    this.currentItemIndex = this.utilSvc.orderItems.length - 1;
                    //this.sortOrderItems();

                    this.totalPrice();
                    //this.setLastItemOrdered();
                }
                else {
                    // cancelled selected on forced modifier page, remove item just added 
                    if (isAdding) {
                        this.currentProduct = null;
                        this.deleteOrderItem(this.currentOrderItem);
                    }
                }
            });
    }

    productInfo() {
        console.log('product info');
        this.isShowingProductInfo = !this.isShowingProductInfo;
        if (this.isShowingProductInfo)
            this.productInfoClass = 'glass btnOK fa';
        else
            this.productInfoClass = 'glass fa';
    }

    changeGuestsNumber() {
        this.isGettingGuests = true;
        this.isOrdering = false;
    }
    /*
    changeGuestsNumber() {
        //this.router.navigate(['/home/tableguests/' + this.table]);
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: false,
            //context: { options: options, currentOptions: currentOptions}
        };

        this.modalService.showModal(GuestsComponent, modalOptions).then(
            (numberOfGuests: string) => {
                if (numberOfGuests != null) {
                    localStorage.setItem('guests', numberOfGuests);
                    this.guests = Number(numberOfGuests);
                }
            });
    }
*/
    changeChoice(orderItem: OrderDetail) {
        this.currentOrderItem = orderItem;
        this.showForcedModifierDialog(false);
    }

    resetOptions() {
        this.currentFixedOption = null;
        this.currentModifierType = null;
    }

    addProductToOrder(mp: MenuProduct) {
        //let marginLeft: number = this.getLeftMargin(ItemType.Product);
        this.resetOptions();

        let currentDate: string = this.utilSvc.getCurrentTime();

        this.DBService.getLocalProduct(mp.ProductID).then(product => {
            this.selectedProduct = product;
            let orderItem: OrderDetail = Object.assign({}, product);
            orderItem = this.getInitializedOrderItem(orderItem);
            orderItem.IndexData = this.getNextIndexData();
            orderItem.FilterNumber = this.getNextFilterNumber();
            // null orderFilter indicates a new item
            //if (this.utilSvc.orderFilter != null) 
            //    orderItem.OrderFilter = this.utilSvc.orderFilter;
            orderItem.Quantity = this.qtyEntered;
            orderItem.ExtPrice = this.qtyEntered * product.UnitPrice;
            orderItem.EmployeeID = this.DBService.loggedInUser.PriKey;
            orderItem.MarginLeft = 0;
            orderItem.Class = 'lastOrderItem';
            orderItem.ProductCode = mp.ProductCode;
            orderItem.PriceLevel = this.priceLevel;
            orderItem.ItemType = ItemType.Product;
            orderItem.SeatNumber = this.currentSeatNumber.toString();
            orderItem.CouponCode = 0;
            orderItem.OrderTime = currentDate;
            orderItem.Voided = null;
            orderItem.ReportProductMix = false;
            orderItem.ClientName = this.DBService.systemSettings.DeviceName;
            orderItem.CostID = product.CostID;
            orderItem.PrintGroup = product.PrintGroup;
            this.changeQtyAvailable(product.ProductFilter, this.qtyEntered * -1);

            if (this.utilSvc.orderItems.length > 0 && this.utilSvc.orderItems[this.utilSvc.orderItems.length - 1].OrderFilter == null)
                this.utilSvc.orderItems[this.utilSvc.orderItems.length - 1].Class = 'orderItem';

            this.resetLastItemOrdered();
            orderItem.Class = 'lastOrderItem';
            //this.utilSvc.orderItems.push(orderItem);
            this.currentOrderItem = orderItem;
            this.addItemToOrder(orderItem);
            this.selectedOrderItem = orderItem;

            if (product.UseForcedModifier && product.ForcedModifier) {
                this.showForcedModifierDialog(true);
            }
            else if (product.UseForcedModifier) {
                this.showChoices(mp.ProductCode);
            }
            else {
                this.totalPrice();
            }

            this.newItemsCount = this.utilSvc.orderItems.length;
        });
    }

    showChoices(productCode: number) {
        let that = this;

        this.DBService.getLocalMenuChoiceItemsByProductCode(productCode).then((items) => {
            if (items.length == 0) {
                dialogs.alert("Menu Choice Items not loaded.");
            }
            else {
                this.isShowingChoices = true;
                this.isShowingSubCategories = true;
                this.choices = items;
                this.choices.forEach(function (ci: MenuChoice) {
                    ci.Row = ((Math.floor((ci.Position - 1) / 4)) % 6) + 1;
                    ci.Col = (ci.Position - 1) % 4;
                    ci.Page = Math.ceil(ci.Position / CHOICE_PAGESIZE);
                    that.totalChoicePages = ci.Page;
                });

                this.choiceCurrentPage = 1;
                this.getChoicePage();
                this.isShowingOptionsButton = false;
                this.isShowingProducts = false;
            }
        });

    }

    onChoiceSwipe(args) {
        if (this.totalChoicePages <= 1)
            return;

        // swiping up, goes to next page -- swiping down, goes to previous page
        if (args.direction == SwipeDirection.down) {
            this.choiceCurrentPage--;
        }
        else if (args.direction == SwipeDirection.up) {
            this.choiceCurrentPage++;
        }

        if (this.choiceCurrentPage > this.totalChoicePages)
            this.choiceCurrentPage = 1;
        else if (this.choiceCurrentPage == 0)
            this.choiceCurrentPage = this.totalChoicePages;

        this.getChoicePage();
    }

    getChoicePage() {
        this.pageChoices = this.choices.filter(c => c.Page == this.choiceCurrentPage);
    }

    changeQtyAvailable(productId: number, qty: number) {
        let product = this.pageProducts.find(p => p.ProductID == productId);

        if (product != null)
            product.QtyAvailable = product.QtyAvailable + qty;
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
                this.isShowingExtraFunctions = false;
                if (openProductItem != null) {
                    that.addOpenProductToOrder(openProductItem);
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

    showProducts(show: boolean) {
        this.isShowingOptionsButton = show;
        this.isShowingBottomNav = show;
        this.isShowingProducts = show;
        this.isShowingSubCategories = show;
    }

    showModifyDialog(orderItem: OrderDetail) {        
        this.resetFixedOptionClasses();
        this.isShowingOptionsButton = false;        
        this.previousProduct = null;

        this.utilSvc.orderItems.forEach(oi => 
            {
                if (oi.Printed == 'P')
                    oi.Class = 'disabledTextColor';
                else
                    oi.Class = 'orderItem';     
            });
        if (orderItem != null)
        {
            this.currentOrderItem = orderItem;            
        }
        else
            orderItem = this.currentOrderItem;
        
        this.selectedOrderItem = orderItem;

        orderItem.Class = 'activeOrderItem';
        this.currentItemIndex = this.utilSvc.orderItems.indexOf(orderItem);

        let context = { orderItem: orderItem };

        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: false,
            context: context
        };

        let that = this;
        let orderProduct = this.utilSvc.orderItems.find(oi => oi.IndexData == orderItem.IndexData && oi.ItemType == ItemType.Product);

        this.modalService.showModal(ModifyOrderItemComponent, modalOptions).then(
            (choice: Choice) => {
                switch (choice.ChangeType) {
                    case 'quantity':
                        let qtyChange: number = orderProduct.Quantity - parseFloat(choice.SelectedNumber);
                        this.changeQtyAvailable(orderItem.ProductFilter, qtyChange);

                        orderProduct.Quantity = parseFloat(choice.SelectedNumber);
                        orderProduct.ExtPrice = orderProduct.UnitPrice * parseFloat(choice.SelectedNumber);
                        this.utilSvc.orderItems.forEach(oi => {
                            if (oi.ItemType != ItemType.Product && oi.UnitPrice != null ? oi.UnitPrice : 0 > 0) {
                                oi.ExtPrice = oi.UnitPrice * orderProduct.Quantity;
                            }
                        }
                        )
                        this.totalPrice();

                        break;
                    case 'seat':
                        orderProduct.SeatNumber = choice.SelectedNumber;
                        break;
                    case 'delete':
                        if (orderItem.ItemType != ItemType.ForcedChoice || this.utilSvc.orderFilter != null)
                            this.deleteOrderItem(orderItem);
                        break;
                    case 'repeat':
                        this.repeatOrderItem(orderItem);
                        break;
                    case 'modify':
                        this.getMenuOptions(orderProduct.ProductCode);
                        this.isShowingOptionsButton = false;
                        this.isShowingBottomNav = false;
                        this.isShowingProducts = false;
                        break;
                    case 'changechoice':
                        //this.showForcedModifierDialogOrderItem(orderItem);
                        //this.isShowingProducts = false;
                        this.changeChoice(orderItem);
                        break;
                }
            });
    }

    addOption(isMemo: boolean, itemName: string, amount: number, isSubOption: boolean, itemType: ItemType) {
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
        let currentDate: string = this.utilSvc.getCurrentTime();

        if (this.currentModifierType == ModifierType.USERDEFINED && this.currentUserModifier.ButtonFunction == 1)
            customStamp = true;

        if (isSubOption) {
            if (!isMemo && this.currentModifierType != ModifierType.TOGO && this.currentModifierType != ModifierType.NOMAKE && !customStamp) {
                if (this.isShowingMainOptions) {
                    unitPrice = this.currentOption.Price;
                    optionName = SPACES5 + this.currentOption.Name;
                    printName = SPACES5 + this.currentOption.PrintName;
                }
                else {
                    applyCharge = this.currentSubOption.ApplyCharge;
                    optionName = SPACES5 + this.currentSubOption.Name;
                    printName = SPACES5 + this.currentSubOption.PrintName;
                }
            }
            orderDetail = this.utilSvc.orderItems.find(od => od.IndexData == this.currentOrderItem.IndexData &&
                od.IndexDataSub == this.currentOrderItem.IndexDataSub &&
                (od.ItemType == ItemType.Choice || od.ItemType == ItemType.ForcedChoice));
            orderDetail.OptionCode = this.currentSubOption.Key;
            orderDetail.PriKey = 0
            orderDetail = Object.assign({}, this.selectedProduct);
            orderDetail.Refund = false;
            orderDetail.Paid = false;
            orderDetail.Comped = false;
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
                    optionName = SPACES3 + this.currentMenuOption.Name;
                    printName = SPACES3 + this.currentMenuOption.PrintName;
                }
                reportProductMix = this.currentMenuOption.ReportProductMix;
            }
            modifierIgnoreQuantity = this.currentOrderItem.ProductFilter == 0;
            orderDetail = Object.assign({}, this.utilSvc.orderItems.find(od => od.IndexData == this.currentOrderItem.IndexData && od.ItemType == ItemType.Product));
            orderDetail.PriKey = 0
        }

        orderDetail.IndexData = this.currentOrderItem.IndexData;
        
        if (this.selectedOrderItem.ItemType == ItemType.Product)
            orderDetail.IndexDataSub = null;
        else
            orderDetail.IndexDataSub = this.currentOrderItem.IndexDataSub;

        orderDetail.OrderTime = currentDate;
        orderDetail.IndexDataOption = isSubOption ? 0 : -1
        orderDetail.Quantity = null
        orderDetail.UnitPrice = null
        orderDetail.ExtPrice = null
        orderDetail.ReportProductMix = reportProductMix
        orderDetail.ItemType = itemType; // isSubOption ? ItemType.SubOption : ItemType.Option
        orderDetail.Voided = null;

        if (!isMemo) {
            switch (this.currentModifierType) {
                case ModifierType.NONE:
                    strOption = SPACES5; //??? remove?
                    if (applyCharge) {
                        orderDetail.UnitPrice = unitPrice;
                    }
                    orderDetail.ExtPrice = modifierIgnoreQuantity ? unitPrice : unitPrice * qty;
                    break;

                case ModifierType.LESS:
                case ModifierType.NO:
                    strOption = SPACES5 + ModifierType[this.currentModifierType] + ' ';
                    break;

                case ModifierType.EXTRA:
                case ModifierType.ADD:
                    strOption = SPACES5 + ModifierType[this.currentModifierType] + ' ';
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
                    strOption = '   1/2';
                    if (unitPrice > 0) {
                        orderDetail.UnitPrice = this.round2Decimals(unitPrice / 2);
                        orderDetail.ExtPrice = modifierIgnoreQuantity ? orderDetail.UnitPrice : orderDetail.UnitPrice * qty;
                    }
                    break;

                case ModifierType.NOMAKE:
                case ModifierType.TOGO:
                    strOption = SPACES5 + ModifierType[this.currentModifierType];
                    break;

                case ModifierType.USERDEFINED:
                    if (this.currentUserModifier.ButtonFunction == 1) {
                        strOption = SPACES5 + this.currentUserModifier.ItemName;
                        if (this.currentUserModifier.StampPrice) {
                            orderDetail.UnitPrice = unitPrice;
                            orderDetail.ExtPrice = modifierIgnoreQuantity ? unitPrice : unitPrice * qty;
                        }
                    }
                    else {
                        strOption = SPACES5 + this.currentUserModifier.ItemName + ' ';
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

        if (strOption.trim().length == 0)
            strOption = '';

        if (this.currentModifierType == ModifierType.NOMAKE || this.currentModifierType == ModifierType.TOGO || customStamp) {
            orderDetail.ProductName = strOption;
            orderDetail.PrintName = strOption;
        }
        else {
            if (textPosition == 1) {
                orderDetail.ProductName = SPACES5 + optionName + strOption;
            }
            else {
                orderDetail.ProductName = strOption + optionName;
                orderDetail.PrintName = printName != '' ? strOption + printName : orderDetail.ProductName;                
            }
        }

        if (isMemo) {
            orderDetail.ProductName = SPACES5 + itemName + strOption;
            orderDetail.PrintName = SPACES5 + itemName + strOption;
            if (amount > 0) {
                orderDetail.UnitPrice = amount;
                orderDetail.ExtPrice = amount * qty;
            }
        }

        /* handle user modifiers */
        if (amount > 0) {
            orderDetail.UnitPrice = amount;
            orderDetail.ExtPrice = amount * qty;
        }

        //if (this.utilSvc.orderFilter != null)
        //    orderDetail.OrderFilter = this.utilSvc.orderFilter;
        this.resetLastItemOrdered();
        orderDetail.Class = 'lastOrderItem';
        orderDetail.CostID = 0;
        
        let firstCharPos: number = orderDetail.ProductName.search(/\S|$/);
        orderDetail.ProductName = SPACES10.substr(0, firstCharPos - 1) + orderDetail.ProductName.replace(/\s+/g, " ");    

        if (this.selectedOrderItem.ItemType != ItemType.Product)
        {
            orderDetail.ProductName = SPACES3 + orderDetail.ProductName;
        }

        orderDetail.PrintName = orderDetail.ProductName;            
        //this.utilSvc.orderItems.push(orderDetail);      
        this.addItemToOrder(orderDetail);        
        //this.sortOrderItems();

        this.totalPrice(); 
    }

    addItemToOrder(orderItem: OrderDetail) {
        /*
        if (orderItem.ItemType == ItemType.Product) {
            this.utilSvc.orderItems.splice(this.currentItemIndex + 1, 0, orderItem);
            this.currentItemIndex = this.utilSvc.orderItems.indexOf(orderItem);
        }
        else {
            // get last item in product group        
            let item: OrderDetail = this.utilSvc.orderItems.slice().reverse().find(oi => oi.IndexData == orderItem.IndexData);
            let itemIndex: number = this.utilSvc.orderItems.indexOf(item);
            this.utilSvc.orderItems.splice(itemIndex + 1, 0, orderItem);
        }
        */
       if (orderItem.IndexDataSub == null && orderItem.ItemType != ItemType.Product)
       {
            orderItem.IndexDataSub = this.getNextIndexDataSub(this.currentOrderItem.IndexData);
       }

        orderItem.ExtPrice = orderItem.ExtPrice > 0 ? orderItem.ExtPrice : null;     // hide amount if zero            
            
        this.utilSvc.orderItems.splice(this.currentItemIndex + 1, 0, orderItem);
        this.currentItemIndex = this.utilSvc.orderItems.indexOf(orderItem);
        this.currentOrderItem = orderItem;

        this.orderProducts = this.utilSvc.orderItems.filter(oi => oi.ItemType == ItemType.Product);
        this.totalPrice(); 
    }

    round2Decimals(inNumber: number) {
        return Math.round(inNumber * 100) / 100
    }    

    onOptionSwipe(args) {
        if (this.totalOptionPages <= 1)
            return;

        ////

        // swiping up, goes to next page -- swiping down, goes to previous page
        if (args.direction == SwipeDirection.down) {
            this.optionCurrentPage--;
        }
        else if (args.direction == SwipeDirection.up) {
            this.optionCurrentPage++;
        }

        if (this.optionCurrentPage > this.totalOptionPages)
            this.optionCurrentPage = 1;
        else if (this.optionCurrentPage == 0)
            this.optionCurrentPage = this.totalOptionPages;

        if (this.isShowingMainOptions)
            this.getProductOptionPage();
        else
            this.getOptionPage();
    }

    getOptionCategoryPage() {
        this.pageOptionCategories = this.optionCategories.filter(oc => oc.Page == this.optionCategoryCurrentPage);
    }

    getOptionPage() {
        this.pageOptions = this.menuOptions.filter(po => po.Page == this.optionCurrentPage);
    }

    getProductOptionPage() {
        this.pageOptions = this.productOptions.filter(c => c.Page == this.optionCurrentPage);
    }

    resetFixedOptionClasses() {
        this.currentFixedOption = null;
        this.fixedOptions.forEach(function (fixedOption: FixedOption) {
            fixedOption.Class = 'glass btnOption';
        });
    }

    hideOptions() {
        this.isShowingOptions = false;
        this.isShowingChoices = false;
        this.isShowingSubOptions = false;
    }

    extraFunctions() {
        this.isShowingExtraFunctions = true;
        this.isShowingBottomNav = false;
    }

    closeExtraFunctions() {
        this.isShowingExtraFunctions = false;
        this.isShowingBottomNav = true;
    }

    getMenuOptions(productCode: number) {
        this.resetFixedOptionClasses();
        this.resetUserModifierClasses();

        let that = this;
        this.DBService.getLocalMenuOptions(productCode).then((menuOptions) => {
            if (menuOptions.length == 0) {
                //dialogs.alert("Missing Menu Options");
                this.isShowingProductOptions();
            }
            else {
                this.menuOptions = menuOptions;
                this.menuOptions.forEach(function (menuOption: MenuOption) {
                    menuOption.Row = ((Math.floor((menuOption.Position - 1) / 3)) % 6);
                    menuOption.Col = (menuOption.Position - 1) % 3;
                    menuOption.Page = Math.ceil(menuOption.Position / OPTION_PAGESIZE);
                    that.totalOptionPages = menuOption.Page;
                });

                this.isShowingOptions = true;
                this.isShowingMainCategories = false;
                this.isShowingSubCategories = false;
                this.optionCurrentPage = 1;
                this.getOptionPage();
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
                this.addOption(false, fixedOption.Name, null, false, ItemType.Option);
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
        if (this.utilSvc.orderItems.filter(oi => oi.OrderFilter == null).length > 0) {
            dialogs.confirm({
                title: "Cancel Order",
                message: "Cancel this order?",
                okButtonText: "Yes, cancel order",
                cancelButtonText: "No"
            }).then(isCanceling => {
                if (isCanceling)
                    //this.router.back();
                    this.utilSvc.orderItems = []; 
                    this.zone.run(() => this.router.navigate(['/home/area']));
            });
        }
        else {
            this.router.navigate(['/home/area']);
            //this.zone.run(() => this.router.navigate(['/home/area']));
        }
    }

    optionSelected(option: MenuOption) {

        if (this.currentModifierType == null)
            this.currentModifierType = ModifierType.NONE;

        this.currentMenuOption = option;
        let amount: number = 0;

        if (this.userModifierActive) {
            if (this.currentUserModifier.StampPrice) {
                amount = this.currentUserModifier.Price;
            }
        }

        this.addOption(false, option.Name, amount, false, ItemType.Option);
    }

    choiceSelected(choice: MenuChoice) {
        this.currentMenuOption = choice;
        this.addOption(false, choice.Name, choice.Charge, false, ItemType.Choice);

        this.DBService.getLocalMenuSubOptions(choice.ChoiceID).then((items) => {
            if (items.length > 0) {
                this.subOptions = items;
                this.subOptions.forEach(function (item: MenuSubOption) {
                    item.Row = Math.floor((item.Position - 1) / 4) + 1;
                    item.Col = item.Position - ((item.Row - 1) * 4) - 1;
                });
                this.isShowingSubOptionsButton = true;
            }
        });
    }

    showSubOptions() {
        this.isShowingSubOptions = true;
        this.isShowingChoices = false;
        this.isShowingOptionsButton = false;
    }

    subOptionSelected(subOption: MenuSubOption) {
        this.currentSubOption = subOption;
        this.addOption(false, subOption.Name, subOption.Charge, true, ItemType.SubOption);
    }

    doneChoices() {
        if (this.isShowingSubOptions) {
            this.isShowingSubOptions = false;
            this.isShowingChoices = true;
        }
        else {
            this.isShowingChoices = false;
            this.isShowingProducts = true;
        }
    }

    getNextOptionFilterNumber(): number {
        if (this.utilSvc.orderItems.length == 0)
            return 0;

        return Math.max.apply(Math, this.utilSvc.orderItems
            .filter(oi => oi.IndexData == this.currentOrderItem.IndexData && oi.IndexDataSub == this.currentOrderItem.IndexDataSub)
            .map(function (oi) { return oi.FilterNumber + 1; }));
    }

    getNextFilterNumber(): number {
        if (this.utilSvc.orderItems.length == 0)
            return 0;

        return Math.max.apply(Math, this.utilSvc.orderItems
            .filter(oi => oi.ItemType == ItemType.Product)
            .map(function (oi) { return oi.FilterNumber + 1; }));
    }

    getNextIndexData(): number {
        if (this.utilSvc.orderItems.length == 0)
            return 1;

        return Math.max.apply(Math, this.utilSvc.orderItems
            .filter(oi => oi.ItemType == ItemType.Product)
            .map(function (oi) { return oi.IndexData + 1; }));
    }

    getNextIndexDataSub(indexData: number): number {
        if (this.utilSvc.orderItems.filter(oi => oi.IndexData == indexData && (oi.ItemType == ItemType.Option || oi.ItemType == ItemType.Choice)).length == 0)
            return 0;
/*
        return Math.max.apply(Math, this.utilSvc.orderItems
            .filter(oi => oi.IndexData == indexData && oi.ItemType == ItemType.Option)
            .map(function (oi) { return oi.IndexDataSub + 1; }));
*/
        return Math.max.apply(Math, this.utilSvc.orderItems
            .filter(oi => oi.IndexData == indexData && oi.ItemType != ItemType.Product)
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

    addOpenProductToOrder(product: OpenProductItem) {
        let indexData: number = 0;
        let lastIndex: number = 0;

        if (this.utilSvc.orderItems.length > 0) {
            indexData = this.currentOrderItem.IndexData;
            lastIndex = this.utilSvc.orderItems.map(oi =>
                oi.IndexData === indexData).lastIndexOf(true);
        }

        let orderItem: OrderDetail = this.getInitializedOrderItem(null);

        orderItem.SeatNumber = this.currentSeatNumber.toString();
        orderItem.UnitPrice = product.UnitPrice;
        orderItem.PrintName = product.ProductName;
        orderItem.ProductName = product.ProductName;
        orderItem.ItemType = ItemType.Product;
        orderItem.IndexData = indexData;
        orderItem.ProductCode = 0;
        orderItem.MarginLeft = 0;
        orderItem.IndexDataSub = 0;
        orderItem.Quantity = product.Quantity;
        orderItem.ExtPrice = product.Quantity * product.UnitPrice;
        orderItem.TaxRate = product.TaxRate;
        orderItem.Taxable = product.Taxable;
        this.resetLastItemOrdered();
        orderItem.Class = 'lastOrderItem';
        // add item to the order
        this.utilSvc.orderItems.splice(lastIndex + 1, 0, orderItem);

        this.totalPrice();
    }

    resetLastItemOrdered() {
        if (this.utilSvc.orderItems.length > 0) {
            let orderItem: OrderDetail = this.utilSvc.orderItems.find(oi => oi.Class == 'lastOrderItem');

            if (orderItem != null)
                orderItem.Class = 'orderItem';
        }
    }

    userModifierSelected(userModifier: UserModifier) {
        this.resetUserModifierClasses();
        this.resetFixedOptionClasses();
        this.currentModifierType = ModifierType.USERDEFINED;
        this.currentUserModifier = userModifier;

        if (userModifier.ButtonFunction == 1) {
            this.addOption(false, userModifier.ItemName, null, false, ItemType.ForcedChoice);
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
        this.isShowingDetails = !this.isShowingDetails;
        this.viewDetailsText = this.isShowingDetails ? this.hideDetailsCode : this.viewDetailsCode;
    }

    doneOption() {
        this.isShowingOptions = false;
        this.isShowingProducts = true;
        this.isShowingSubCategories = true;
        this.isShowingBottomNav = true;
    }

    onOptionCategorySwipe(args) {
        if (this.totalOptionCategoryPages <= 1)
            return;

        // swiping left, goes to next page -- swiping right, goes to previous page
        if (args.direction == SwipeDirection.right) {
            this.optionCategoryCurrentPage--;
        }
        else if (args.direction == SwipeDirection.left) {
            this.optionCategoryCurrentPage++;
        }

        if (this.optionCategoryCurrentPage > this.totalOptionCategoryPages)
            this.optionCategoryCurrentPage = 1;
        else if (this.optionCategoryCurrentPage == 0)
            this.optionCategoryCurrentPage = this.totalOptionCategoryPages;

        this.getOptionCategoryPage();
    }


    onSubCategorySwipe(args) {
        if (this.totalSubCategoriesPages <= 1)
            return;

        // swiping up, goes to next page -- swiping down, goes to previous page
        let getNextPage: boolean = true;

        if (args.direction == SwipeDirection.down) {
            this.subCategoryCurrentPage--;
            getNextPage = false;
        }
        else if (args.direction == SwipeDirection.up) {
            this.subCategoryCurrentPage++;
        }

        if (this.subCategoryCurrentPage > this.totalSubCategoriesPages)
            this.subCategoryCurrentPage = 1;
        else if (this.subCategoryCurrentPage == 0)
            this.subCategoryCurrentPage = this.totalSubCategoriesPages;

        this.getSubCategoryPage(getNextPage);
    }

    getSubCategoryPage(getNextPage: boolean) {
        this.pageSubCategories = this.subCategories.filter(sc => sc.Page == this.subCategoryCurrentPage);

        if (this.pageSubCategories.length == 0) {
            if (getNextPage) {
                this.subCategoryCurrentPage++;
                if (this.subCategoryCurrentPage > this.totalSubCategoriesPages)
                    this.subCategoryCurrentPage = 1;
                this.getSubCategoryPage(true);
            }
            else {
                this.subCategoryCurrentPage--;
                if (this.subCategoryCurrentPage == 0)
                    this.subCategoryCurrentPage = this.totalSubCategoriesPages;
                this.getSubCategoryPage(false);
            }
        }
        else {
            this.pageSubCategories.forEach(function (sc: MenuSubCategory) {
                sc.Class = 'btnSubCategory';
            });
        }
    }

    onProductSwipe(args) {

        if (this.totalProductPages <= 1)
            return;

        // swiping up, goes to next page -- swiping down, goes to previous page
        if (args.direction == SwipeDirection.down) {
            this.productCurrentPage--;
        }
        else if (args.direction == SwipeDirection.up) {
            this.productCurrentPage++;
        }

        if (this.productCurrentPage > this.totalProductPages)
            this.productCurrentPage = 1;
        else if (this.productCurrentPage == 0)
            this.productCurrentPage = this.totalProductPages;

        this.getProductPage();
    }

    getProductPage() {
        this.pageProducts = this.products.filter(p => p.Page == this.productCurrentPage);
    }

    onOrderItemSwipe(args, orderItem: OrderDetail) {
        if (args.direction == SwipeDirection.left) {
            this.deleteOrderItem(orderItem);
        }
    }

    deleteOrderItem(orderItem: OrderDetail) {
        if (orderItem.OrderFilter != null) {
            this.showReasonDialog(orderItem);
        }
        else {
            // if item is product, delete product and all associated modifiers
            if (orderItem.ItemType == ItemType.Product) {
                this.utilSvc.orderItems = this.utilSvc.orderItems.filter(oi => oi.IndexData !== orderItem.IndexData);
                this.changeQtyAvailable(orderItem.ProductFilter, orderItem.Quantity);
                this.currentProduct = null;
            }
            else
                if (orderItem.ItemType == ItemType.Option || orderItem.ItemType == ItemType.Choice) {
                    this.utilSvc.orderItems.filter(oi => oi.IndexData == orderItem.IndexData && oi.IndexDataSub == orderItem.IndexDataSub).forEach( oi =>
                        {
                            oi.Voided = 'deleted'; 
                        })
                    //this.utilSvc.orderItems.splice(this.utilSvc.orderItems.indexOf(orderItem),1);
                    this.utilSvc.orderItems = this.utilSvc.orderItems.filter(oi => oi.Voided != 'deleted');
                    //    || oi.ItemType != ItemType.Option);
                }
                else if (orderItem.ItemType == ItemType.SubOption) {
                    this.utilSvc.orderItems = this.utilSvc.orderItems.filter(oi => oi !== orderItem);
                }

            this.totalPrice();
            this.newItemsCount = this.utilSvc.orderItems.length;
        }
    }

    repeatOrderItem(orderItem: OrderDetail) {
        let itemsToCopy = this.utilSvc.orderItems.filter(oi => oi.IndexData == orderItem.IndexData);
        let nextIndexData: number = this.getNextIndexData();
        let that = this;

        let product: MenuProduct = this.pageProducts.find(p => p.ProductID == orderItem.ProductFilter);

        itemsToCopy.forEach(function (orderItem: OrderDetail) {
            let copiedItem = Object.assign({}, orderItem);
            copiedItem.IndexData = nextIndexData;
            copiedItem.Quantity = orderItem.ItemType == ItemType.Product ? 1 : null;
            copiedItem.ExtPrice = copiedItem.Quantity * copiedItem.UnitPrice;
            //copiedItem = Object.assign({}, that.selectedProduct);
            copiedItem.Quantity = orderItem.ItemType == ItemType.Product ? 1 : null;
            copiedItem.SeatNumber = that.currentSeatNumber.toString();
            copiedItem.ExtPrice = orderItem.ExtPrice;
            copiedItem.UnitPrice = orderItem.UnitPrice;
            copiedItem.PrintName = orderItem.PrintName;
            copiedItem.ProductName = orderItem.ProductName;
            copiedItem.ItemType = orderItem.ItemType;
            copiedItem.IndexData = nextIndexData;
            copiedItem.ProductCode = orderItem.ProductCode;
            that.resetLastItemOrdered();
            copiedItem.Class = 'lastOrderItem';

            if (product != null)
                product.QtyAvailable -= copiedItem.Quantity;

            that.utilSvc.orderItems.push(copiedItem);
            //that.addItemToOrder(copiedItem);
            /*
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
           */
        });

        this.currentItemIndex = this.utilSvc.orderItems.length - 1;
        this.totalPrice();
    }

    totalPrice() {
        this.utilSvc.subTotal = 0;
        this.utilSvc.tax = 0;
        this.utilSvc.tips = 0;
        this.utilSvc.checkTotal = 0;

        this.utilSvc.orderItems.filter(oi => oi.Voided == null).forEach(oi => {
            if (oi.ExtPrice != null)
                this.utilSvc.subTotal += oi.ExtPrice;

            this.utilSvc.tax = this.utilSvc.getTaxTotal(this.utilSvc.orderHeader, this.utilSvc.orderItems);
            this.utilSvc.checkTotal = this.utilSvc.subTotal + this.utilSvc.tax;

            if (this.utilSvc.guests >= this.MAX_GUESTS) {
                this.utilSvc.tips = this.utilSvc.subTotal * this.TIPS_PCT;
                this.utilSvc.checkTotal += this.utilSvc.tips;
            }
        });

        this.orderItems = this.utilSvc.orderItems.filter(oi => oi.Voided == null);

        // scroll to bottom
        setTimeout(() => {
            this.orderScroller.nativeElement.scrollToVerticalOffset(this.orderScroller.nativeElement.scrollableHeight, false)
        }, 200);
    }

    getCheckTotal() {
        let subTotal = 0;
        this.utilSvc.taxAll = 0;
        this.utilSvc.checkTotalAll = 0;

        this.utilSvc.orderItems.forEach(oi => {
            if (oi.ExtPrice != null)
                subTotal += oi.ExtPrice;

            this.utilSvc.taxAll = this.utilSvc.getTaxTotal(this.utilSvc.orderHeader, this.utilSvc.orderItems);
            this.utilSvc.checkTotalAll = subTotal + this.utilSvc.taxAll;

            if (this.utilSvc.guests >= this.MAX_GUESTS) {
                this.utilSvc.tips = subTotal * this.TIPS_PCT;
                this.utilSvc.checkTotalAll += this.utilSvc.tips;
            }
        });
    }
    
    showReasonDialog(orderItem: OrderDetail) {
        // get the product Order
        //let _orderItem: OrderDetail = this.utilSvc.orderItems.find( oi => oi.ItemType == ItemType.Product && oi.IndexData == orderItem.IndexData)
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: true
        };
        
        let currentTime = this.utilSvc.getCurrentTime();

        this.modalService.showModal(ReasonComponent, modalOptions).then(
            (reason: string) => {
                // void product if reason given          
                if (reason != null) {
                    if (orderItem != null) {
                        //this.utilSvc.orderItems.filter(oi => oi.IndexData == orderItem.IndexData).forEach(oi => {
                        //    oi.Voided = true;
                        //});
                        this.utilSvc.orderItems.forEach ( oi =>
                            {
                                if (oi.IndexData == orderItem.IndexData)    
                                {
                                    oi.Voided = true;                                    
                                    oi.DeleteReason = reason;
                                    oi.DeleteServerID = this.DBService.loggedInUser.EmployeeID;
                                    oi.DeleteTime = currentTime;
                                }    
                            }
                            );
                        this.orderModified = true;
                    }
                    else    //void the whole order
                    {
                        this.voidOrder(reason);
                    }
                    this.totalPrice();
                }
            });
    }

    voidOrder(reason: string) {
        this.utilSvc.reason = reason;        
        this.getCheckTotal();        

        let orderHeader: OrderHeader = this.utilSvc.getOrderHeader(true);        
       
        let orderUpdate: OrderUpdate = {
            order: orderHeader,
            orderDetails: this.utilSvc.orderItems,
            payments: []
        };

        this.apiSvc.updateOrder(orderUpdate).subscribe(results => {
            this.router.navigate(['/home/area/']);
        },
            err => {
                dialogs.alert({
                    title: "Error",
                    message: err.message,
                    okButtonText: "Close"
                })
            });

    }

    showMemoDialog() {
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: true
        };

        this.modalService.showModal(MemoComponent, modalOptions).then(
            (memo: Memo) => {
                this.currentModifierType = ModifierType.NONE;
                this.addOption(true, memo.Memo, memo.Price, false, ItemType.Option);
                this.totalPrice();
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

    formatUTC(d: Date) {
        return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), 0);
    }

    validateOrder(startNewOrder: boolean) {
        if (this.utilSvc.orderItems.filter(oi => oi.Voided == null).length == 0 && this.utilSvc.orderFilter != null) {
            let options = {
                title: "Confirm Void",
                message: "There are no items so the Order must be voided. Do you want to continue?",
                okButtonText: "Yes",
                cancelButtonText: "No"
            };

            dialogs.confirm(options).then((confirmed: boolean) => {
                if (confirmed) {
                    this.showReasonDialog(null);
                }
            });
        }
        else {
            this.sendCheck(startNewOrder);
        }
    }

    sendCheck(startNewOrder: boolean) {

        if (this.utilSvc.orderItems.length == 0 && this.utilSvc.orderFilter != null) {

        }
        else {
            let orderHeader: OrderHeader = this.utilSvc.getOrderHeader(false);             
            
            this.utilSvc.orderItems.forEach(oi => {
                if (oi.Voided == null)
                    oi.Printed = 'P';
            });

            this.utilSvc.processFilterNumber();
          
            let orderUpdate: OrderUpdate = {
                order: orderHeader,
                orderDetails: this.utilSvc.orderItems,
                payments: []
            };            
            
            this.apiSvc.updateOrder(orderUpdate).subscribe(results => {                
                let orderFilter: number = results.UpdateOrderResult;

                let printRequest: DirectPrintJobsRequest = {
                    orderFilter: orderFilter,
                    printType: PrintType.All,
                    modified: false,
                    systemID: this.DBService.systemSettings.DeviceName
                }

                this.apiSvc.directPrint(printRequest).subscribe(printResult => {
                    if (!printResult) {
                        dialogs.alert({
                            title: "Error",
                            message: "Error occurred sending to print API.",
                            okButtonText: "Close"
                        })
                    }
                });                
            },
                err => {
                    dialogs.alert({
                        title: "Error",
                        message: err.message,
                        okButtonText: "Close"
                    })
                });
           
            if (startNewOrder) {
                //this.router.navigate(['/home/tableguests/' + this.utilSvc.table]);
                this.utilSvc.orderItems = [];
                this.isOrdering = true;                
            }
            else {
                this.router.navigate(['/home/area/']);
            }
        }
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
                    this.isShowingMainCategories = false;
                }

                let isCategoryLocked: boolean = false;
                isCategoryLocked = this.checkMenuTimer(MenuTimerType.Locked, OverrideType.Type2, false);

                if (isCategoryLocked) {
                    this.currentCategoryID = this.lockedCategoryId;
                    this.isShowingMainCategories = false;
                }

                isCategoryLocked = this.checkMenuTimer(MenuTimerType.Locked, OverrideType.Type0, false);

                if (isCategoryLocked) {
                    this.currentCategoryID = this.lockedCategoryId;
                }

                if (this.currentCategoryID == 0) {
                    this.isShowingMainCategories = true;
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
                        switch (that.utilSvc.orderType) {
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
    
    // number of guests   

    setGuests(numberOfGuests: string) {
        this.isGettingGuests = false;
        this.isOrdering = true;
        this.isShowingBottomNav = true;
        this.isShowingExtraFunctions = false;
        this.utilSvc.guests = Number(numberOfGuests);
        localStorage.setItem('guests', this.utilSvc.guests.toString());
    }     
 
    saveEnteredGuests()
    {    
        this.setGuests(this.guestsEntered);        
    }

    cancel() {
        this.router.back();       
    }

    addDigit(digit: string)  
    {
        if (parseInt(digit) || (digit == '0' && parseInt(this.guestsEntered)))
            this.guestsEntered = this.guestsEntered + digit;          
    }

    backSpace()    
    {
        if (this.guestsEntered.length > 0)
            this.guestsEntered = this.guestsEntered.substring(0, this.guestsEntered.length - 1); 
    }
    
    otherQty()
    {       
        //this.guests.nativeElement.focus();
        this.isNormalChoice = false;
    }

    hold()
    {
        this.router.navigate(['/home/hold']);
    }
}