import { Component, OnInit, ViewChild, ElementRef, ViewContainerRef } from "@angular/core";

import * as dialogs from "tns-core-modules/ui/dialogs";

import { SQLiteService } from "~/app/services/sqlite.service";
import { Page } from "tns-core-modules/ui/page/page";
import { RouterExtensions } from "nativescript-angular/router";
import { UtilityService } from "~/app/services/utility.service";
import { OrderDetail, HoldItem, Printer, OrderHeader } from "~/app/models/orders";
import { ModalDialogOptions, ModalDialogService } from "nativescript-angular/modal-dialog";
import { KitchenMessageComponent } from "./kitchen-message.component";
import { SelectPrinterComponent } from "./select-printer.component";

@Component({
    selector: "hold",
    moduleId: module.id,
    templateUrl: "./hold.component.html",
    styleUrls: ['./hold.component.css']
})

export class HoldComponent implements OnInit {

    holdItems: HoldItem[];
    message: string;
    isShowingSendHold: boolean = false;
    isShowingSendFire: boolean = false;
    printGroupFired: boolean[] = [false, false, false, false];
    selectedPrinter: Printer;
    order: OrderHeader;

    ngOnInit(): void {
        this.initializePage();
    }

    initializePage() {
        this.holdItems = this.utilSvc.orderItems.map(oi =>
            ({
                ProductName: oi.ProductName, Quantity: oi.Quantity,
                SeatNumber: oi.SeatNumber,
                IndexData: oi.IndexData,
                Printed: oi.Printed,
                PrintGroup: oi.PrintGroup,
                Fired: false
            })
        );

        this.isShowingSendHold = this.holdItems.some(hi => hi.Printed == null);
        this.isShowingSendFire = false;
        this.printGroupFired = [false, false, false, false];
    }

    holdItem(item: HoldItem) {
        let indexData: number = item.IndexData;
        item.Fired = !item.Fired;
        this.holdItems.filter(hi => hi.IndexData == indexData).forEach(hi => {
            hi.Fired = item.Fired;
        });
    }

    selectItems(printGroup: number) {
        this.printGroupFired[printGroup] = !this.printGroupFired[printGroup];

        if (printGroup == 0) // ALL
        {
            this.holdItems.forEach(hi => {
                hi.Fired = this.printGroupFired[0];
            });
        }
        else {
            this.holdItems.filter(hi => hi.PrintGroup == printGroup).forEach(hi => {
                hi.Fired = this.printGroupFired[printGroup];
            });
        }

        this.isShowingSendFire = this.holdItems.some(hi => hi.Fired);
    }

    cancel() {
        this.router.back();
    }

    clearMessage() {
        this.message = null;
    }

    printMessageOnly() {
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: false
        };

        this.modalService.showModal(SelectPrinterComponent, modalOptions).then(
            (printer: Printer) => {
                if (printer != null) {
                    this.selectedPrinter = printer;
                }
            });
    }

    showMessageDialog() {
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: true
        };

        this.modalService.showModal(KitchenMessageComponent, modalOptions).then(
            (message: string) => {
                this.utilSvc.orderHeader.Extras = message;
                this.message = message;
            });
    }

    constructor(private DBService: SQLiteService, private page: Page, private router: RouterExtensions,
        private utilSvc: UtilityService, private viewContainerRef: ViewContainerRef, private modalService: ModalDialogService) {
        page.actionBarHidden = true;
    }
}
