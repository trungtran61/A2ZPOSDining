import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";

import * as dialogs from "tns-core-modules/ui/dialogs";

import { SQLiteService } from "~/app/services/sqlite.service";
import { Page } from "tns-core-modules/ui/page/page";
import { KitchenMessage } from "~/app/models/orders"; 
import { ModalDialogParams } from "nativescript-angular/modal-dialog";

@Component({
    selector: "hold",
    moduleId: module.id,
    templateUrl: "./hold.component.html",
    styleUrls: ['./hold.component.css']
})

export class HoldComponent implements OnInit {
        
    ngOnInit(): void {
       
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
