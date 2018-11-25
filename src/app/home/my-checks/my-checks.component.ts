import { Component, OnInit } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { SQLiteService } from "~/app/services/sqlite.service";
import { Area, TableDetail, Check } from "~/app/models/products";
import { Page } from "tns-core-modules/ui/page/page";
import { UtilityService } from "~/app/services/utility.service";
import { APIService } from "~/app/services/api.service";

@Component({
    selector: "my-check",
    moduleId: module.id,
    templateUrl: "./my-checks.component.html",
    styleUrls: ['./my-checks.component.css']
})

export class MyChecksComponent implements OnInit {
    checks: Check[] = [];
    myChecksText: string = 'Checks';
    currentDateTime: Date;

    ngOnInit(): void {
        setInterval( () => { 
            this.currentDateTime = new Date(); 
     }, 1000);
    }

    cancel()
    {
        this.router.back();
    }
    
    constructor(
        private router: RouterExtensions, private DBService: SQLiteService
        , private page: Page, private utilSvc: UtilityService, private apiSvc: APIService
    ) {
        page.actionBarHidden = true;
    }
}
