import { Component, OnInit, AfterViewInit, NgZone } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { Observable, forkJoin } from 'rxjs';
import { registerElement } from 'nativescript-angular';
import { exit } from 'nativescript-exit';
import * as appSettings from "application-settings";

import { Employee, LoginResponse } from "~/app/models/employees";
import { SQLiteService } from "~/app/services/sqlite/sqlite.service";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { Page } from "tns-core-modules/ui/page/page";
import { Logos } from "../models/settings";

var Sqlite = require("nativescript-sqlite");

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
    logInLogo: string = '';
    isLoading: boolean = false;

    constructor(private router: RouterExtensions, private DBService: SQLiteService,
        private zone: NgZone, private page: Page
    ) {
        page.actionBarHidden = true;
    }

    ngOnInit(): void {

        if (appSettings.getBoolean("isFirstLaunch", true)) {
            this.isLoading = true;
            console.log('First Launch');
            (new Sqlite("FullServiceDining.db")).then(db => {
                console.log("DB Created");
                Promise.all([
                    //this.DBService.createTables(db)
                    //this.loadLocalDataBase(db)
                ]).then
                {
                    this.isLoading = false;
                    this.showLogos();
                };
            }, error => {
                console.log("OPEN DB ERROR", error);
            });
            appSettings.setBoolean("isFirstLaunch", false);
        }

        //this.page.className = 'loginBG';
        //this.router.navigate(['/home/mytables'])
        //this.router.navigate(['/home/menu'])
        // Init your component properties here.
        
    }

    showLogos()
    {
        require("nativescript-localstorage");
        this.logInLogo = localStorage.getItem('LoginLogo');

        this.DBService.getLocalLogos().then((data) => {
            if (data == null) {
                dialogs.alert("Logo Info not loaded");
            }
            else {
                let logos: Logos = data;
                console.log(data);
                localStorage.setItem('LoginLogo', logos.LoginLogo);
                localStorage.setItem('MyChecksLogo', logos.MyChecksLogo);
            }
        });
        this.logInLogo = 'http://' + localStorage.getItem('LoginLogo');
        console.log(this.logInLogo);        
    }

    addDigit(digit: string) {
        this.employeeId += digit;
    }

    clearInput() {
        this.employeeId = '';
    }

    logIn() {
        //this.DBService.createTables(this.DBService);
        if (this.employeeId == '') {
            dialogs.alert("Please enter Employee Id.");
            return;
        }

        this.DBService.login(this.employeeId).subscribe(res => {
            switch (res.AccessType) {
                case 0:
                case 1:
                case 2:
                    this.DBService.loggedInUser.EmployeeID = this.employeeId;
                    this.DBService.loggedInUser.PriKey = res.EmployeeID;
                    this.DBService.loggedInUser.AccessType = res.AccessType;

                    this.DBService.getLocalEmployee(res.EmployeeID).then((data) => {
                        if (data == null) {
                            dialogs.alert("Employee Info not loaded");
                        }
                        else {
                            this.DBService.loggedInUser.FirstName = data.FirstName;
                            this.zone.run(() => this.router.navigate(['/home/mytables']));
                        }
                    });
                    //localStorage.setItem("loggedInUser", JSON.stringify(this.loggedInUser));
                    //this.router.navigate(['/home/mytables']);                          
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
                    this.employeeId = '';
                    break;
            };

        });
    }

    loadLocalDataBase(db)
    {
        this.isLoading = true;        
        forkJoin([
            this.DBService.loadSystemSettings(db),
            this.DBService.loadLogos(db),
            this.DBService.loadEmployees(db),
            this.DBService.loadAreas(db),
            this.DBService.loadProductGroups(db),
            this.DBService.loadCategoryCodes(db),
            this.DBService.loadProducts(db),
            this.DBService.loadTables(db),
            this.DBService.loadMenuCategories(db),            
            this.DBService.loadMenuProducts(db),
            this.DBService.loadMenuSubCategories(db),                        
            this.DBService.loadMenuChoices(db),            
            this.DBService.loadMenuOptions(db),              
            this.DBService.loadMenuSubOptions(db),            
            this.DBService.loadOptionCategories(db),
            this.DBService.loadProductCategories(db),                                    
            this.DBService.loadMenuTimers(db),
            this.DBService.loadOptions(db)                    
        ])
            .subscribe(results => {
                console.log(results);
                this.isLoading = false;
            },            
            err => {
                this.isLoading = false;
                dialogs.alert(err);
            // Do stuff whith your error
            });        
    }

    managerFunctions() {
        //this.router.navigate(['/home/menu'])
        //this.router.navigate(['/home/menuitems'])
        //this.DBService.loadSystemSettings(db);
        //this.DBService.loadEmployees(db);
        //this.DBService.getLocalSystemSettings();
        //this.DBService.getAllEmployees();
        this.loadLocalDataBase(null);
    }

    loadTables() {
        this.DBService.getTableInfo('MenuProducts'); // .createTables(db);
    }

    dropTables() {
        this.DBService.getTableInfo('MenuCategories'); // .createTables(db);
    }

    ngAfterViewInit() {

        localStorage.removeItem('dataloaded');

        if (localStorage.getItem('dataloaded') != 'true') {
            console.log('data not loaded');
            this.isBusy = false;
        }
        else {
            console.log('data loaded');
            this.isBusy = false;
        }
    }

    shutDown() {
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
