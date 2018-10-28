import { Component, OnInit } from "@angular/core";

import { Employee } from "~/app/models/employees";
import { SQLiteService } from "~/app/services/sqlite/sqlite.service";
import { ApplicationEventData } from "tns-core-modules/application/application";

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
         
    }
}


