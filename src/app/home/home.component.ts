import { Component, OnInit, AfterViewInit, NgZone } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { Observable, forkJoin } from 'rxjs';
import { registerElement } from 'nativescript-angular';
import { exit } from 'nativescript-exit';
import * as appSettings from "application-settings";

import { Employee, LoginResponse } from "~/app/models/employees";
import { SQLiteService } from "~/app/services/sqlite.service";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { Page } from "tns-core-modules/ui/page/page";
import { Logos } from "../models/settings";
import { UtilityService } from "../services/utility.service";
import { APIService } from "../services/api.service";
import { topmost } from "tns-core-modules/ui/frame";
import { isIOS } from "tns-core-modules/platform";

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
    protected employee: Observable<Employee>;

    public hidden: boolean;
    public inactiveColor: string;
    public accentColor: string;
    //loginResponse: LoginResponse;
    //loggedInUser: Employee = Object();
    logInLogo: string = '';
    isLoading: boolean = false;

    printerPort: string = '192.168.0.125';

    constructor(private router: RouterExtensions, private DBService: SQLiteService,
        private zone: NgZone, private page: Page, private utilSvc: UtilityService,
        private apiSvc: APIService
    ) {
        page.actionBarHidden = true;
    }

    ngOnInit(): void {
        if (isIOS) {
            topmost().ios.controller.navigationBar.barStyle = UIBarStyle.Black;
        }
        //if (this.DBService.systemSettings == null)
        //{
        this.DBService.getLocalSystemSettings().then((systemSettings) => {
            if (systemSettings == null) {
                console.log("SystemSettings not loaded.")
            }
            else {
                this.DBService.systemSettings = systemSettings;
            }
        });
        //}

        //this.page.className = 'loginBG';
        //this.router.navigate(['/home/area'])
        //this.router.navigate(['/home/order'])
        // Init your component properties here.
        //this.router.navigate(['/home/pizza']);  
        this.utilSvc.setTopBarStyle();
        this.utilSvc.getTaxRates();
    }

    ngAfterViewInit(): void {

        if (appSettings.getBoolean("isFirstLaunch", true)) {
            this.isLoading = true;
            console.log('First Launch');
            (new Sqlite("FullServiceDining.db")).then(db => {
                console.log("DB Created");
                Promise.all([
                    this.loadLocalDataBase(db)
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
    }

    showLogos() {
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
            this.DBService.loggedInUser.Module = 1;
            this.DBService.loggedInUser.ClockInType = 1;
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
                            //this.utilSvc.startTimer();                            
                            this.zone.run(() => this.router.navigate(['/home/area']));
                        }
                    });
                    //localStorage.setItem("loggedInUser", JSON.stringify(this.loggedInUser));
                    //this.router.navigate(['/home/area']);                          
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

    loadLocalDataBase(db) {
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
            this.DBService.loadOptions(db),
            this.DBService.loadTaxRates(db),
            this.DBService.loadUserModifiers(db),
            this.DBService.loadReasons(db)
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
        //this.router.navigate(['/home/order'])
        //this.router.navigate(['/home/orderitems'])
        //this.DBService.loadSystemSettings(db);
        //this.DBService.loadEmployees(db);
        //this.DBService.getLocalSystemSettings();
        //this.DBService.getAllEmployees();
        //this.apiSvc.getFullOrder(188183).subscribe(orderResponse => {
        //    console.log(orderResponse);            
        //});

        this.loadLocalDataBase(null);
    }

    loadTables() {
        this.DBService.getTableInfo('MenuProducts'); // .createTables(db);
    }

    dropTables() {
        this.DBService.getTableInfo('MenuCategories'); // .createTables(db);
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
