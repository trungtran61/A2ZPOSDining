import { Component, OnInit, ViewContainerRef } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { SwipeDirection } from "ui/gestures";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { SQLiteService } from "~/app/services/sqlite.service";
import { ModalDialogService, ModalDialogOptions } from "nativescript-angular";
import { ModifyOrderItemComponent } from "~/app/home/order/modify-order-item.component";
import { ForcedModifiersComponent } from "~/app/home/order/forced-modifiers/forced-modifiers.component";
import { Page } from "tns-core-modules/ui/page/page";

@Component({
    selector: "pizza",
    moduleId: module.id,
    templateUrl: "./pizza.component.html",
    styleUrls: ['./pizza.component.css']
})
export class PizzaComponent implements OnInit {
    

    constructor(
        private page: Page) {
        page.actionBarHidden = true;        

    }

    ngOnInit(): void {
       
    }
}