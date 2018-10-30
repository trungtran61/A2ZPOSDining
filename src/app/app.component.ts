import { Component, OnInit } from "@angular/core";

import { SQLiteService } from "~/app/services/sqlite/sqlite.service";
import { ApplicationEventData } from "tns-core-modules/application/application";
import * as appSettings from "application-settings";

var Sqlite = require("nativescript-sqlite");

@Component({
    moduleId: module.id,
    selector: "ns-app",
    templateUrl: "app.component.html"
})


export class AppComponent implements OnInit {

    public constructor(private DBService: SQLiteService) {
    }

    public ngOnInit() {

        if (appSettings.getBoolean("isFirstLaunch", true)) {
            console.log('First Launch;')
            this.DBService.createTables(null);
            appSettings.setBoolean("isFirstLaunch", false);
        }

    }
    onClick() {
        console.log('clicked');
    }

}


