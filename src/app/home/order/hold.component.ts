import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";

import * as dialogs from "tns-core-modules/ui/dialogs";

import { SQLiteService } from "~/app/services/sqlite.service";
import { Page } from "tns-core-modules/ui/page/page";
import { RouterExtensions } from "nativescript-angular/router";
import { UtilityService } from "~/app/services/utility.service";
import { OrderDetail } from "~/app/models/orders";

@Component({
    selector: "hold",
    moduleId: module.id,
    templateUrl: "./hold.component.html",
    styleUrls: ['./hold.component.css']
})

export class HoldComponent implements OnInit {

    orderItems: OrderDetail[];

    ngOnInit(): void {

    }

    cancel() {
        this.router.back();
    }

    constructor(private DBService: SQLiteService, private page: Page, private router: RouterExtensions,  private utilSvc: UtilityService) {
        page.actionBarHidden = true;
        this.orderItems = this.utilSvc.orderItems;
    }
}
