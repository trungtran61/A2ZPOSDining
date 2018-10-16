import { Component, OnInit } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { SQLiteService } from "~/app/services/sqlite/sqlite.service";
import { Area, TableDetail } from "~/app/models/products";
import { Observable } from "rxjs";

@Component({
    selector: "MyTables",
    moduleId: module.id,
    templateUrl: "./my-tables.component.html",
    styleUrls: ['./my-tables.component.css']
})

export class MyTablesComponent implements OnInit {    
    areas: Area[] = [];
    tables: Observable<TableDetail[]>;   
    areaStyle: string = "";   
    tableStyles: string[] = [];
    activeTable: string = "";
    httpProtocol: string = "http";
    displayTableActions: boolean = false;
    displayTableActionsClass: string = "sliderHide";
    
    onTableClick(table: TableDetail)
    {
        require( "nativescript-localstorage" );
        // table is open, go get number of guests
        if (table.Status.indexOf('Open') > -1)
        {
            localStorage.setItem('table', table.Name); 
            this.router.navigate(['/home/tableguests/'+ table.Name]);    
        }

        // table is active (occupied and enabled)
        if (table.Status.indexOf('Enabled') > -1)
        {
            // table actions menu is displayed and same table selected
            if (this.displayTableActions && localStorage.getItem('table') == table.Name) 
            {
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
        if (table.Status.indexOf('Disabled') > -1)
        {
            dialogs.alert("Not your table!");
        }        
        
    }

    setNumberOfGuests(table: TableDetail)
    {       
        localStorage.setItem('table', table.Name); 
        this.router.navigate(['/home/tableguests/'+ table.Name]);        
    }

    ngOnInit(): void {
        console.log('mytables');        
        this.DBService.getLocalAreas().then((data) => {
            if (data.length == 0) {
                dialogs.alert("Areas not loaded").then(() => {
                    console.log("Dialog closed!");
                });
            }
            else {
                this.areas = data;                
                this.areaStyle = "margin-left: 10px; background-image: url('" + this.httpProtocol + "://" + this.areas[0].ImageURL + "'); background-repeat: no-repeat";   
                
                this.DBService.getTablesDetails(this.areas[0].AreaID, this.DBService.loggedInUser.PriKey, false).subscribe(res => {
                    this.tables = res;     
                    res.forEach(element => {
                        let style:string = "text-align: center; background-color: #" +   (element.TableColor == '0' ? 'ffffff' : this.padZeroes((element.TableColor).toString(16), 6));                        
                        this.tableStyles.push(style);
                    });
                  });               
            }
        });
        
        
    }

    padZeroes(num:string, size:number): string {
        let s = num;
        while (s.length < size) s = "0" + s;
        return s;
    }

    logOut()
    {
        //this.DBService.dropTables();
        this.DBService.logoff().subscribe(res => {
            this.router.navigate(['/home/']);              
        });
    }

    constructor(private router:RouterExtensions, private DBService: SQLiteService) {        
    }
}
