import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnChanges, ViewContainerRef, NgZone } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { NavigationExtras } from "@angular/router";

import * as dialogs from "tns-core-modules/ui/dialogs";

import { SQLiteService } from "~/app/services/sqlite.service";
import { Area, TableDetail, TableType } from "~/app/models/products";
import { Observable } from "rxjs";
import { Page } from "tns-core-modules/ui/page/page";
import { UtilityService } from "~/app/services/utility.service";
import { APIService } from "~/app/services/api.service";
import { min } from "rxjs/operators";
import { ModalDialogOptions, ModalDialogService } from "nativescript-angular";
import { GuestsComponent } from "../order/guests.component";
import { NullInjector } from "@angular/core/src/di/injector";

require("nativescript-localstorage");

const ONE_HOUR: number = 1000 * 60 * 60; // in milliseconds
const ONE_MINUTE: number = 1000 * 60; // in milliseconds

@Component({
    selector: "area",
    moduleId: module.id,
    templateUrl: "./area.component.html",
    styleUrls: ['./area.component.css']
})

export class AreaComponent implements OnInit, OnChanges {
    isAreaLayout: boolean = true;
    isGettingGuests: boolean = false;
    isBlinking: boolean = true;
    isNormalChoice: boolean = true;
    blinkingInterval: number;
    areas: Area[] = [];
    //tables: Observable<TableDetail[]>;   
    tables: TableDetail[];
    areaStyle: string = "";
    activeTable: string = "";
    httpProtocol: string = "http";
    displayTableActions: boolean = false;
    displayTableActionsClass: string = "sliderHide";
    employeeName: string = this.DBService.loggedInUser.FirstName;
    
    showStatus: boolean = false;
    showInfo: boolean = false;
    showStaff: boolean = false;
    showGuests: boolean = false;
    showAreas: boolean = false;
    currentArea: Area;    
    guests: number = 0;
    tableGuestsTitle: string = 'Choose the number of guests for table ';
    guestsEntered: string = '';       

    ngOnChanges(): void {      
        
    }

    ngOnInit(): void {      
        //console.log('elapsed ms: ' +  (new Date().getTime() - this.utilSvc.startTime));          
        this.DBService.getLocalAreas().then((data) => {
            if (data.length == 0) {
                dialogs.alert("Areas not loaded").then(() => {
                    console.log("Dialog closed!");
                });
            }
            else {
                this.areas = data;
                
                let areaID: number = Number(localStorage.getItem("areaID"));
                if (areaID != 0)                                
                    this.currentArea = this.areas.find(area => area.AreaID == areaID);                                    
                else
                    this.currentArea = this.areas[0];                
                
                this.utilSvc.area = this.currentArea.AreaID;
                this.getTablesInfo();
            }
        });

        //if (this.utilSvc.blinkingInterval == null)
           //clearInterval(this.utilSvc.blinkingInterval);
        //{
            /*
            this.utilSvc.blinkingInterval = setInterval(() => 
            {
                this.isBlinking = !this.isBlinking;
            }, 500);   
            */
        //}
    } 

    getTablesInfo() {
        let area: Area = this.currentArea;
        
        //this.areaStyle = "padding-left: 30;background-image: url('" + this.httpProtocol + "://" + area.ImageURL + 
        //    "'); background-repeat: no-repeat;background-size: 970px; background-position: 30px 0px;";   
      
        this.areaStyle = "padding-left: 30;background-image: url('res://images/TableLayout/Area_" + 
            area.AreaID.toString().trim() + "'); background-repeat: no-repeat;background-size: 970px; background-position: 30px 0px;";        

        let startTime = new Date().getTime();
        this.apiSvc.getTablesDetails(area.AreaID,
            this.DBService.loggedInUser.PriKey,
            this.DBService.loggedInUser.AccessType,
            this.DBService.systemSettings.ServerViewAll).subscribe(res => {       
                //console.log('elapsed ms: ' +  (new Date().getTime() - startTime));         
                this.tables = res.map(table => {
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
                    table.Opacity = '1';                          
                    table.OrderTime = table.OrderTime == null ? 0 : this.utilSvc.getJSONDate(table.OrderTime);
                    //let margin: number = (table.Height / 2) - 20; 
                    //table.TopMargin = margin;
                    
                    if (table.TableType == TableType.Round)
                    {
                        table.Style = 'border-radius: 100';                        
                    }
                    else
                    {
                        table.Style = 'border-radius: 5';
                    }
                    return table;  
                });                                            
            });

    }

    viewInfo(showStaff: boolean, showStatus: boolean, showGuests: boolean) {
        this.showStaff = showStaff;
        this.showStatus = showStatus;
        this.showGuests = showGuests;

        let now = new Date().getTime();

        this.tables.forEach(table => {
            if (Date.parse(table.OrderTime)) {
                if (table.Covers > 0)                    
                    table.Opacity = '0.2'
                    
                if (this.showStatus) {
                    let elapsedTime: number = Math.ceil((now - Date.parse(table.OrderTime)) / (ONE_MINUTE));
                    let hours = Math.floor(elapsedTime / 60);
                    let minutes = elapsedTime % 60;
                    table.ElapsedTime = hours.toString() + ':' + this.utilSvc.padLeft(minutes.toString(), '0', 2);
                }
            }
        });
    }

    viewStatus() {
        this.utilSvc.startTime = new Date().getTime();
        this.viewInfo(false, true, false);
        console.log('elapsed ms: ' +  (new Date().getTime() - this.utilSvc.startTime));  
    }

    viewStaff() {
        this.utilSvc.startTime = new Date().getTime();
        this.viewInfo(true, false, false);
        console.log('elapsed ms: ' +  (new Date().getTime() - this.utilSvc.startTime));  
    }

    viewGuests() {
        this.utilSvc.startTime = new Date().getTime();
        this.viewInfo(false, false, true);
        console.log('elapsed ms: ' +  (new Date().getTime() - this.utilSvc.startTime));   
    }

    getArea(increment: number)
    {
        let currentIndex: number = this.areas.findIndex( area => area.AreaID == this.currentArea.AreaID);

        if (increment > 0)
            if (this.areas.length - 1 == currentIndex )
                this.viewTables(this.areas[0]);
            else
                this.viewTables(this.areas[currentIndex+1]);
        else
        if (currentIndex == 0 )
            this.viewTables(this.areas[this.areas.length - 1]);
        else
            this.viewTables(this.areas[currentIndex-1]);        
        }

    viewTables(area: Area) {
        this.showAreas = false;
        localStorage.setItem('areaID', area.AreaID.toString());
        this.currentArea = area;
        this.utilSvc.area = this.currentArea.AreaID;
        this.getTablesInfo();
    }

    resetOccupiedTablesClass() {
        this.tables.forEach(table => {
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
        });
    }

    onTableClick(table: TableDetail) {        
        this.resetOccupiedTablesClass();

        table.Class += ' currentTable';
        this.utilSvc.table = table.Name;

        // table is open, go get number of guests
        if (table.Status.indexOf('Open') > -1) {
            //localStorage.setItem('table', table.Name);                       
            //this.router.navigate(['/home/tableguests/' + table.Name]);
            this.getNumberOfGuests();            
            return;
        }

        localStorage.setItem('currentTable', JSON.stringify(table));

        // table is active (occupied and enabled)
        if (table.Status.indexOf('Enabled') > -1) {
            // table actions menu is displayed and same table selected
            if (this.displayTableActions && this.utilSvc.table == table.Name) {
                this.displayTableActions = false;
                this.displayTableActionsClass = 'sliderHide';
                return;
            }

            // different table selected
            this.displayTableActions = true;
            this.displayTableActionsClass = 'slideLeft';           
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
        //localStorage.removeItem('areaID');
        this.apiSvc.downloadAreaImage('');
        this.DBService.logoff().subscribe(res => {
            this.router.navigate(['/home/']);
            //this.router.back();
        });
    }

    openTable() {
        let navigationExtras: NavigationExtras = {
            queryParams: {
                "action": "openTable"
            }
        };
        this.utilSvc.startTime = new Date().getTime(); 
        this.router.navigate(["home/order"], navigationExtras);
    }

    closeTable() {
        let navigationExtras: NavigationExtras = {
            queryParams: {
                "action": "closeTable"
            }
        };
        this.router.navigate(["home/closeCheck"], navigationExtras);
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

    viewChecks(closed: boolean) {
        let navigationExtras: NavigationExtras = {
            queryParams: {
                "closed": closed
            }
        };
        this.router.navigate(['/home/mychecks'], navigationExtras);
    }

    viewCheckDetail() {

    }

    getNumberOfGuests() {
        localStorage.setItem('guests', null); 
        this.utilSvc.startTime = new Date().getTime();  
       
        this.isAreaLayout = false;
        this.isGettingGuests = true;
        this.isNormalChoice = true;        
    }

     // number of guests   

     setGuests(numberOfGuests: string) {
        this.utilSvc.guests = Number(numberOfGuests);
        //localStorage.setItem('guests', this.utilSvc.guests.toString());
        this.router.navigate(["home/order"]);
    }     
 
    saveEnteredGuests()
    {    
        this.setGuests(this.guestsEntered);        
    }

    cancelGuests() {
        this.isGettingGuests = false;       
        this.isAreaLayout = true;
    }

    addDigit(digit: string)  
    {
        if (parseInt(digit) || (digit == '0' && parseInt(this.guestsEntered)))
            this.guestsEntered = this.guestsEntered + digit;          
    }

    backSpace()    
    {
        if (this.guestsEntered.length > 0)
            this.guestsEntered = this.guestsEntered.substring(0, this.guestsEntered.length - 1); 
    }
    
    otherGuests()
    {       
        this.isNormalChoice = false;
    }
    // number of guests
    
    /*
        pageTap()
        {
            this.utilSvc.idleTimer = 0;
        }
    */
    constructor(
        private router: RouterExtensions, private DBService: SQLiteService,
        private page: Page, private utilSvc: UtilityService, private apiSvc: APIService,
        private modalService: ModalDialogService,
        private viewContainerRef: ViewContainerRef,
        private zone: NgZone
    ) {        
        page.actionBarHidden = true;
    }
}
