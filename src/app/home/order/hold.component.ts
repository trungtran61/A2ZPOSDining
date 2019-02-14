import { Component, OnInit, ViewChild, ElementRef, ViewContainerRef } from "@angular/core";

import * as dialogs from "tns-core-modules/ui/dialogs";

import { SQLiteService } from "~/app/services/sqlite.service";
import { Page } from "tns-core-modules/ui/page/page";
import { RouterExtensions } from "nativescript-angular/router";
import { UtilityService } from "~/app/services/utility.service";
import { OrderDetail, HoldItem, Printer, OrderHeader, OrderUpdate, DirectPrintJobsRequest, PrintType, PrintKitchenMessageRequest, PrintCommandType } from "~/app/models/orders";
import { ModalDialogOptions, ModalDialogService } from "nativescript-angular/modal-dialog";
import { KitchenMessageComponent } from "./kitchen-message.component";
import { SelectPrinterComponent } from "./select-printer.component";
import { APIService } from "~/app/services/api.service";

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
                Fired: false,
                tag: null
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
            hi.tag = hi.Fired ? 1 : null;
        });
    }

    selectItems(printGroup: number) {
        this.printGroupFired[printGroup] = !this.printGroupFired[printGroup];

        if (printGroup == 0) // ALL
        {
            this.holdItems.forEach(hi => {
                hi.Fired = this.printGroupFired[0];
                hi.tag = hi.Fired ? 1 : null;
            });
        }
        else {
            this.holdItems.filter(hi => hi.PrintGroup == printGroup).forEach(hi => {
                hi.Fired = this.printGroupFired[printGroup];
                hi.tag = hi.Fired ? 1 : null;
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
                    this.saveOrder(PrintCommandType.PrintMessageOnly);
                }
            });
    }

    sendHoldItems()
    {
        this.saveOrder(PrintCommandType.PrintHoldItems);
    }

    sendFireItems()
    {
        this.saveOrder(PrintCommandType.PrintFireItems);
    }

    saveOrder(printCommandType: PrintCommandType) {

        if (this.utilSvc.orderFilter == null) {
            let orderHeader: OrderHeader = this.utilSvc.getOrderHeader();
            
            this.holdItems.forEach(hi => {
                this.utilSvc.orderItems.filter(oi => oi.IndexData == hi.IndexData).forEach(oi => {
                    oi.tag = hi.tag;
                });
            });

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

                switch (printCommandType) {
                    case PrintCommandType.PrintHoldItems:
                        {
                            let printRequest: DirectPrintJobsRequest = {
                                orderFilter: orderFilter,
                                printType: PrintType.NotPrinted,
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
                            break;
                        }
                    case PrintCommandType.PrintFireItems:
                        {
                            let printRequest: DirectPrintJobsRequest = {
                                orderFilter: orderFilter,
                                printType: PrintType.Selected,
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
                            break;
                        }
                    case PrintCommandType.PrintMessageOnly:
                        {
                            let printRequest: PrintKitchenMessageRequest = {
                                orderFilter: orderFilter,                                
                                systemID: this.DBService.systemSettings.DeviceName,
                                printerID: this.selectedPrinter.PrinterID
                            }

                            this.apiSvc.printKitchenMessage(printRequest).subscribe(printResult => {
                                if (!printResult) {
                                    dialogs.alert({
                                        title: "Error",
                                        message: "Error occurred calling printKitchenMessage API.",
                                        okButtonText: "Close"
                                    })
                                }
                            });
                            break;
                        }
                }
               },
                err => {
                    dialogs.alert({
                        title: "Error",
                        message: err.message,
                        okButtonText: "Close"
                    })
                });
        }
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

    constructor(private DBService: SQLiteService, private page: Page, private router: RouterExtensions, private apiSvc: APIService,
        private utilSvc: UtilityService, private viewContainerRef: ViewContainerRef, private modalService: ModalDialogService) {
        page.actionBarHidden = true;
    }
}
