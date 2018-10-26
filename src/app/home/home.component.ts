import { Component, OnInit, AfterViewInit, NgZone } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { Observable } from 'rxjs';
import { registerElement } from 'nativescript-angular';
import {exit} from 'nativescript-exit';

import { Employee, LoginResponse } from "~/app/models/employees";
import { SQLiteService } from "~/app/services/sqlite/sqlite.service";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { Page } from "tns-core-modules/ui/page/page";

@Component({
    selector: "Home",
    moduleId: module.id,
    templateUrl: "./home.component.html",
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
    
    employees: Employee[];
    employeeId: string = "";   
    isBusy = true;
    protected employee: Observable<Employee>;
   
    public hidden: boolean;
    public inactiveColor: string;
    public accentColor: string;   
    //loginResponse: LoginResponse;
    //loggedInUser: Employee = Object();
    
    constructor(private router: RouterExtensions, private DBService: SQLiteService, 
        private zone: NgZone, private page: Page,
        ) {          
        page.actionBarHidden = true;
    }

    ngOnInit(): void {
        //this.page.className = 'loginBG';
        //this.router.navigate(['/home/mytables'])
        //this.router.navigate(['/home/menu'])
        // Init your component properties here.
    }   
  
    addDigit(digit: string) {      
        this.employeeId += digit;        
    }

    clearInput() {
        this.employeeId = '';
    }

    logIn() {
          //this.DBService.createTables(this.DBService);
          if (this.employeeId == '')
          {
              dialogs.alert("Please enter Employee Id.");    
              return;
          }

          this.DBService.login(this.employeeId).subscribe(res => {
            switch (res.AccessType)
            {
            case 0:
            case 1:
            case 2:
                this.DBService.loggedInUser.EmployeeID = this.employeeId;
                this.DBService.loggedInUser.PriKey = res.EmployeeID;
                this.DBService.loggedInUser.AccessType = res.AccessType;
                //localStorage.setItem("loggedInUser", JSON.stringify(this.loggedInUser));
                //this.router.navigate(['/home/mytables']);         
                this.zone.run(() => this.router.navigate(['/home/mytables']));         
                break;
            case -3:
                //dialogs.alert("Employee already logged in.");    
                this.DBService.loggedInUser.PriKey = res.EmployeeID;
                this.DBService.logoff().subscribe(res => {
                    this.logIn();
                });
                break;
            default:  
                dialogs.alert("Invalid Employee Id entered.");    
                break;             
        };
        
    });
    }

    managerFunctions()
    {
        //this.router.navigate(['/home/menu'])
        //this.router.navigate(['/home/menuitems'])
    }

    loadTables()
    {
        this.DBService.getTableInfo('MenuProducts'); // .createTables(null);
    }

    dropTables()
    {
        this.DBService.getTableInfo('MenuCategories'); // .createTables(null);
    }

    ngAfterViewInit() {
        require("nativescript-localstorage");
        localStorage.removeItem('dataloaded');

        if (localStorage.getItem('dataloaded') != 'true') {
            console.log('data not loaded');           
            this.isBusy = false;                      
            }       
        else
        {
            console.log('data loaded');
            this.isBusy = false;
        } 
    }

    shutDown()
    {
        dialogs.confirm({
            title: "Shutdown",
            message: "Shutdown A2ZPOSDining App?",
            okButtonText: "Yes, shut down app",
            cancelButtonText: "No"
        }).then(isShuttingDown => {
            if (isShuttingDown)
                exit();            
        });
    }
   
}
