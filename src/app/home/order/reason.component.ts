import { Component, OnInit } from "@angular/core";

import * as dialogs from "tns-core-modules/ui/dialogs";

import { SQLiteService } from "~/app/services/sqlite.service";
import { Page } from "tns-core-modules/ui/page/page";
import { UtilityService } from "~/app/services/utility.service";
import { APIService } from "~/app/services/api.service";
import { Reason } from "~/app/models/orders";

@Component({
    selector: "reason",
    moduleId: module.id,
    templateUrl: "./reason.component.html",
    styleUrls: ['./reason.component.css']
})

export class ReasonComponent implements OnInit {
    reasons: Reason[] = [];
    
    ngOnInit(): void {
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
            }
        });
    }
   
    constructor(
        private DBService: SQLiteService, private page: Page, private utilSvc: UtilityService, private apiSvc: APIService        
    ) 
    {
        page.actionBarHidden = true;
    }
}
