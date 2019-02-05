import { Component, OnInit, ViewChild, ElementRef, ViewContainerRef } from "@angular/core";

import * as dialogs from "tns-core-modules/ui/dialogs";

import { SQLiteService } from "~/app/services/sqlite.service";
import { Page } from "tns-core-modules/ui/page/page";
import { RouterExtensions } from "nativescript-angular/router";
import { UtilityService } from "~/app/services/utility.service";
import { OrderDetail } from "~/app/models/orders";
import { ModalDialogOptions, ModalDialogService } from "nativescript-angular/modal-dialog";
import { KitchenMessageComponent } from "./kitchen-message.component";

@Component({
    selector: "hold",
    moduleId: module.id,
    templateUrl: "./hold.component.html",
    styleUrls: ['./hold.component.css']
})

export class HoldComponent implements OnInit {

    orderItems: OrderDetail[];
    message: string;

    ngOnInit(): void {

    }

    cancel() {
        this.router.back();
    }

    clearMessage()
    {
        this.message = null;
    }

    showMessageDialog() {
        const modalOptions: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            fullscreen: true
        };

        this.modalService.showModal(KitchenMessageComponent, modalOptions).then(
            (message: string) => {
                this.message = message;
            });
    }

    constructor(private DBService: SQLiteService, private page: Page, private router: RouterExtensions,  
        private utilSvc: UtilityService, private viewContainerRef: ViewContainerRef, private modalService: ModalDialogService) {
        page.actionBarHidden = true;
        this.orderItems = this.utilSvc.orderItems;
    }
}
