import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";

import * as dialogs from "tns-core-modules/ui/dialogs";

import { SQLiteService } from "~/app/services/sqlite.service";
import { Page } from "tns-core-modules/ui/page/page";
import { Reason, OrderDetail } from "~/app/models/orders";
import { ModalDialogParams } from "nativescript-angular/modal-dialog";

@Component({
    selector: "reason",
    moduleId: module.id,
    templateUrl: "./reason.component.html",
    styleUrls: ['./reason.component.css']
})

export class ReasonComponent implements OnInit {
    @ViewChild('vcReason') vcReason: ElementRef; 
    reasons: Reason[] = [];
    //orderItem: OrderDetail;
    reason: string;
    otherReason: string;
    isOtherReason: boolean = false;
    
    ngOnInit(): void {
        //this.orderItem = this.params.context.orderItem;        
        this.getReasons();
    }

    getReasons() {
        this.DBService.getLocalReasons().then((data) => {
            if (data.length == 0) {
                dialogs.alert("Reasons not loaded").then(() => {
                    console.log("Dialog closed!");
                });
            }
            else {
                this.reasons = data; 
                let i: number = 1;
                this.reasons.forEach(reason =>
                    {
                        reason.Class = 'glass' 
                        reason.Row = (Math.floor((i - 1) / 3));
                        reason.Col = (i - 1) % 3;     
                        i++;
                    });                         
            }
        });
    }

    setActiveReason(reason: Reason)
    {
        this.reason = reason.Reason;

        this.reasons.forEach( reason => {
            reason.Class = 'glass'            
        });

        reason.Class = 'glass activeReason';
    }

    showOtherReason()
    {
        this.vcReason.nativeElement.focus();
        this.isOtherReason = true;
    }
   
    acceptReason(reason: string)
    {
        //if (reason != '')
        this.params.closeCallback(reason);
    }   

    keyPressed(event)
    {
        console.log(event);
    }

    cancel()
    {
        this.params.closeCallback(null);
    }   

    constructor ( private DBService: SQLiteService, private page: Page, private params: ModalDialogParams ) 
    {
        page.actionBarHidden = true;
    }
}
