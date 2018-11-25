import { Component, OnInit } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { NavigationExtras} from "@angular/router";

import * as dialogs from "tns-core-modules/ui/dialogs";

import { SQLiteService } from "~/app/services/sqlite.service";
import { Area, TableDetail } from "~/app/models/products";
import { Observable } from "rxjs";
import { Page } from "tns-core-modules/ui/page/page";
import { UtilityService } from "~/app/services/utility.service";
import { APIService } from "~/app/services/api.service";
import { min } from "rxjs/operators";

@Component({
    selector: "area",
    moduleId: module.id,
    templateUrl: "./area.component.html",
    styleUrls: ['./area.component.css']
})

export class AreaComponent implements OnInit {
    areas: Area[] = [];
    //tables: Observable<TableDetail[]>;   
    tables: TableDetail[];
    areaStyle: string = "";
    activeTable: string = "";
    httpProtocol: string = "http";
    displayTableActions: boolean = false;
    displayTableActionsClass: string = "sliderHide";
    employeeName: string = this.DBService.loggedInUser.FirstName;
    oneHour: number = 1000 * 60 * 60; // in milliseconds
    oneMinute: number = 1000 * 60; // in milliseconds
    showStatus: boolean = false;
    showInfo: boolean = false;
    showStaff: boolean = false;
    showGuests: boolean = false;
    showAreas: boolean = false;

    ngOnInit(): void {
        this.getTablesInfo();
    }

    getTablesInfo() {
        this.DBService.getLocalAreas().then((data) => {
            if (data.length == 0) {
                dialogs.alert("Areas not loaded").then(() => {
                    console.log("Dialog closed!");
                });
            }
            else {
                this.areas = data;
                this.areaStyle = "margin-left: 10px; background-image: url('" + this.httpProtocol + "://" + this.areas[0].ImageURL + "'); background-repeat: no-repeat";

                this.apiSvc.getTablesDetails(this.areas[0].AreaID,
                    this.DBService.loggedInUser.PriKey,
                    this.DBService.loggedInUser.AccessType,
                    this.DBService.systemSettings.ServerViewAll).subscribe(res => {
                        this.tables = res;
                        res.forEach(table => {
                            let tableClass: string = 'tableOpen';
                            if (table.Status.indexOf('Disabled') > -1) {
                                tableClass = 'tableDisabled';
                            }
                            else
                                if (table.Status.indexOf('Open') > -1) {
                                    tableClass = 'tableOpen';
                                }
                                else
                                    if (table.Status.indexOf('Occupied') > -1) {
                                        tableClass = 'tableOccupied';
                                    }

                            table.Class = 'table ' + tableClass;
                            //let style: string = "text-align: center; background-color: #" + (table.TableColor == '0' ? 'ffffff' :
                            //       this.utilSvc.padLeft((table.TableColor).toString(16), '0', 6));
                            //table.Style = style;
                            table.Opacity = '1';
                            table.OrderTime = table.OrderTime == null ? '' : this.utilSvc.getJSONDate(table.OrderTime);                            
                        });
                    });
            }
        });
    }

    viewInfo(showStaff: boolean, showStatus: boolean, showGuests: boolean) {
        this.showStaff = showStaff;
        this.showStatus = showStatus;
        this.showGuests = showGuests;

        let now = new Date().getTime();

        this.tables.forEach(table => {
            if (Date.parse(table.OrderTime)) {
                table.Opacity = '0.5'
                if (this.showStatus) {
                    let elapsedTime: number = Math.ceil((now - new Date(table.OrderTime).getTime()) / (this.oneMinute));
                    let hours = Math.floor(elapsedTime / 60);
                    let minutes = elapsedTime % 60;
                    table.ElapsedTime = hours.toString() + ':' + this.utilSvc.padLeft(minutes.toString(), '0', 2);
                }
            }
        });
    }

    viewStatus() {
        this.viewInfo(false, true, false);
    }

    viewStaff() {
        this.viewInfo(true, false, false);
    }

    viewGuests() {
        this.viewInfo(false, false, true);
    }

    onTableClick(table: TableDetail) {
        require("nativescript-localstorage");
        
        // table is open, go get number of guests
        if (table.Status.indexOf('Open') > -1) {
            localStorage.setItem('table', table.Name);           
            this.router.navigate(['/home/tableguests/' + table.Name]);
        }

        localStorage.setItem('currentTable', JSON.stringify(table));
        
        // table is active (occupied and enabled)
        if (table.Status.indexOf('Enabled') > -1) {
            // table actions menu is displayed and same table selected
            if (this.displayTableActions && localStorage.getItem('table') == table.Name) {
                this.displayTableActions = false;
                this.displayTableActionsClass = 'sliderHide';
                return;
            }

            // different table selected
            this.displayTableActions = true;
            this.displayTableActionsClass = 'slideLeft';
            localStorage.setItem('table', table.Name);
            return;
        }

        // not your table
        if (table.Status.indexOf('Disabled') > -1) {
            dialogs.alert("Not your table!");
        }

    }

    setNumberOfGuests(table: TableDetail) {
        localStorage.setItem('table', table.Name);
        this.router.navigate(['/home/tableguests/' + table.Name]);
    }

    info() {
        this.showInfo = true;
    }

    startOver() {
        this.getTablesInfo();
        this.showInfo = false;
        this.showStatus = false;
        this.showGuests = false;
        this.showStaff = false;
    }

    logOut() {
        this.DBService.logoff().subscribe(res => {
            this.router.navigate(['/home/']);
        });
    }

    openTable() {
        let navigationExtras: NavigationExtras = {
            queryParams: {
                "action": "openTable"                
            }
        };
        this.router.navigate(["home/order"], navigationExtras);
    }

    viewAreas() {
        this.showAreas = !this.showAreas;
        if (this.showAreas) {
            this.apiSvc.getOccupiedTables().subscribe(areas => {
                areas.forEach(area => {
                    this.areas.find(x => x.AreaID == area.AreaID).OccupiedTables = area.Count;
                });
            });
        }
    }

    viewClosedChecks()
    {
        this.router.navigate(['/home/mychecks']);
    }

    viewMyChecks()
    {

    }

    viewCheckDetail()
    {

    }
    /*
        pageTap()
        {
            this.utilSvc.idleTimer = 0;
        }
    */
    constructor(
        private router: RouterExtensions, private DBService: SQLiteService,
        private page: Page, private utilSvc: UtilityService, private apiSvc: APIService        
    ) {
        page.actionBarHidden = true;
    }
}
