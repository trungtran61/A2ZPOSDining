import { Component, OnInit } from "@angular/core";

import { SQLiteService } from "~/app/services/sqlite.service";
import { ApplicationEventData } from "tns-core-modules/application/application";
//import * as appSettings from "application-settings";

var Sqlite = require("nativescript-sqlite");

@Component({
    moduleId: module.id,
    selector: "ns-app",
    templateUrl: "app.component.html"
})


export class AppComponent implements OnInit {

    loadingStyle: string = 'display:none';

    public constructor(private DBService: SQLiteService) {
    }

    public ngOnInit() {     
       // this.DBService.getLocalSystemSettings().then((systemSettings) => {
       //     if (systemSettings == null) {
       //         console.log("SystemSettings not loaded.")
       //     }
       // });  
    }

    onClick() {
        console.log('clicked');
    }

}


