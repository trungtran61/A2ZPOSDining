import { Component, OnInit, ViewContainerRef, ViewChild, NgZone } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";

import * as dialogs from "tns-core-modules/ui/dialogs";

import { TableDetail } from "~/app/models/products";
import { SQLiteService } from "~/app/services/sqlite.service";
import { ModalDialogService, ModalDialogOptions } from "nativescript-angular";
import { Page } from "tns-core-modules/ui/page/page";
import { Order, OrderDetail, OrderResponse } from "~/app/models/orders";
import { APIService } from "~/app/services/api.service";
import { UtilityService } from "~/app/services/utility.service";
import { ActivatedRoute } from "@angular/router";
import { ReasonComponent } from "./../reason.component";

@Component({
    selector: "close-check",
    moduleId: module.id,
    templateUrl: "./close-check.component.html",
    styleUrls: ['./close-check.component.css']
})
export class CloseCheckComponent implements OnInit {
    order: Order = null;
    orderResponse: OrderResponse = null;
    orderItems: OrderDetail[] = [];

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
    ticketNumber: number = 0;
    showingItemFunctions: boolean = false;
    showingTicketFunctions: boolean = true;
    seats: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

    MAX_GUESTS: number = 6;
    TIPS_PCT: number = .15;

    constructor(private router: RouterExtensions,
        private DBService: SQLiteService,
        private modalService: ModalDialogService,
        private viewContainerRef: ViewContainerRef,
        private apiSvc: APIService,
        private utilSvc: UtilityService,
        private page: Page,
        private route: ActivatedRoute
    ) {
        page.actionBarHidden = true;
    }

    ngOnInit(): void {
        let table: TableDetail = JSON.parse(localStorage.getItem('currentTable'));
        this.getFullOrder(table.OrderFilter);
    }

    assignSeat(seat: number) {

    }

    showItemFunctions(item: OrderDetail) {
        this.showingItemFunctions = true;
        this.showingTicketFunctions = false;
    }

    cancelItemFunctions() {
        this.showingItemFunctions = false;
        this.showingTicketFunctions = true;
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

    printReceipt() { }
    itemDollarDiscount() { }
    itemPctDiscount() { }
    itemComp() { } deleteItem() { }
    otherSeat() { }
    dollarTip() { }
    pctTip() { }
    credit() { }
    specialDiscount() { }
    dollarDiscount() { }
    pctDiscount() { }
    compAll() { }
    splitEven(){}
    cashPayment(){}
    chargePayment(){}
    checkPayment(){}
    giftCard(){}
    certificate(){}
    housePayment(){}
    otherPayment(){}    

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

    showReasonDialog() {
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: true
        };

        this.modalService.showModal(ReasonComponent, modalOptions).then(
            (reason: string) => {

            });
    }
}