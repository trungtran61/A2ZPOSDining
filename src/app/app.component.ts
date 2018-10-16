import { Component, OnInit } from "@angular/core";
import { Employee } from "~/app/models/employees";
import { SQLiteService } from "~/app/services/sqlite/sqlite.service";

var Sqlite = require("nativescript-sqlite");

@Component({
    moduleId: module.id,
    selector: "ns-app",
    templateUrl: "app.component.html"
})
export class AppComponent implements OnInit {    

    public employees: Employee[];

    public constructor(private DBService: SQLiteService) {
        this.employees = [];
    }

    public ngOnInit() {
        /*
        setTimeout(() => {
            this.DBService.getEmployees();
        }, 500);
*/
        //this.DBService.getEmployees();        
    }
}


