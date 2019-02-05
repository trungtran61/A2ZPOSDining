import { Component, OnInit, ViewChild, ElementRef, ViewContainerRef } from "@angular/core";

import * as dialogs from "tns-core-modules/ui/dialogs";

import { SQLiteService } from "~/app/services/sqlite.service";
import { Page } from "tns-core-modules/ui/page/page";
import { RouterExtensions } from "nativescript-angular/router";
import { UtilityService } from "~/app/services/utility.service";
import { OrderDetail, HoldItem } from "~/app/models/orders";
import { ModalDialogOptions, ModalDialogService } from "nativescript-angular/modal-dialog";
import { KitchenMessageComponent } from "./kitchen-message.component";

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

    ngOnInit(): void {

    }

    holdItem(item: HoldItem)
    {
        let indexData:number = item.IndexData;
        this.utilSvc.orderItems.filter(oi => oi.IndexData == indexData).forEach(oi => oi.tag = 1);
        this.holdItems.filter(hi => hi.IndexData == indexData && hi.Printed == null).forEach(hi => {
            hi.Status = '&#xf06d; FIRE';           
            hi.StatusClass = 'fa';
        });
        this.holdItems.filter(hi => hi.IndexData == indexData && hi.Printed != null).forEach(hi => {
            hi.Status = 'RE-FIRE';           
            hi.StatusClass = '';
        })
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
        
        this.holdItems = this.utilSvc.orderItems.map(oi =>  
               ({
                   ProductName: oi.ProductName, Quantity: oi.Quantity, 
                   SeatNumber: oi.SeatNumber, 
                   Status: oi.Printed != null ? 'PRINTED' : 'HOLD',
                   StatusClass: oi.Printed != null ? 'printedStatus' : 'holdStatus',
                   IndexData: oi.IndexData,
                   Printed: oi.Printed                   
                })             
        );

        this.isShowingSendHold = this.holdItems.some (hi => hi.Printed == null);        
    }
}
