import { Component, OnInit } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { SQLiteService } from "~/app/services/sqlite.service";
import { Area, TableDetail, Check } from "~/app/models/products";
import { Page } from "tns-core-modules/ui/page/page";
import { UtilityService } from "~/app/services/utility.service";
import { APIService } from "~/app/services/api.service";
import { OrderTypeDetail, OrderType } from "~/app/models/orders";
import { AccessType } from "~/app/models/employees";
import { ActivatedRoute, NavigationExtras } from "@angular/router";

@Component({
    selector: "my-check",
    moduleId: module.id,
    templateUrl: "./my-checks.component.html",
    styleUrls: ['./my-checks.component.css']
})

export class MyChecksComponent implements OnInit {
    viewChecksText: string = ''
    employeeOrderText: string = 'Employee A > Z';
    employeeOrderASC: boolean = true;

    checks: Check[] = [];
    myChecksHeader: string = 'Checks';
    currentDateTime: Date;
    oneHour: number = 1000 * 60 * 60; // in milliseconds
    oneMinute: number = 1000 * 60; // in milliseconds

    userName: string = '';
    orderTypeDetails: OrderTypeDetail[] = [];
    closedChecks: boolean = false;    

    ngOnInit(): void {
        // this is for the date/time display at top right corner
        setInterval(() => {
            this.currentDateTime = new Date();
        }, 1000);

        this.getGroupedChecks();

        if (this.DBService.loggedInUser.ClockInType == 2 ||
            ((this.DBService.loggedInUser.ClockInType == 1 || this.DBService.loggedInUser.ClockInType == 0)
                && this.DBService.systemSettings.ServerViewAll && this.DBService.loggedInUser.Module == 1))
            this.myChecksHeader = "Everyone's Checks"
        else
            if (this.DBService.loggedInUser.ClockInType == 0 && this.DBService.systemSettings.BarTenderShareChecks)
                this.myChecksHeader = "All Bar Checks"
            else
                this.myChecksHeader = this.DBService.loggedInUser.FirstName + "'s Checks";

        this.userName = 'USER: ' + this.DBService.loggedInUser.FirstName;

        this.loadOrderTypeDetails();

    }

    getGroupedChecks()
    {
        if (this.closedChecks)
            this.viewChecksText = 'View All Checks';
        else
            this.viewChecksText = 'View Closed Checks';

        this.apiSvc.getGroupedChecks(this.DBService.loggedInUser.AccessType == AccessType.Manager ? 0 : this.DBService.loggedInUser.PriKey, 
            this.DBService.loggedInUser.AccessType, this.closedChecks).subscribe(checks => {
            this.checks = checks;
            let i: number = 1;  

            this.checks.forEach( check => {
                let currentTime: number = this.utilSvc.getJSONDate(check.CurrentDate).getTime();    
                let checkTime: number = this.utilSvc.getJSONDate(check.CheckTime).getTime();    
                let elapsedTime: number = Math.ceil(( currentTime - checkTime) / (this.oneMinute));
                let hours = Math.floor(elapsedTime / 60);
                let minutes = elapsedTime % 60;
                check.ElapsedTime = hours.toString() + ':' + this.utilSvc.padLeft(minutes.toString(), '0', 2);
                check.Row = (Math.floor((i - 1) / 4));
                check.Col = (i - 1) % 4;     
                i++;
            })
        });
    }

    loadOrderTypeDetails() {
        switch (this.DBService.loggedInUser.Module) {
            case 1:
                this.orderTypeDetails.push(
                    {
                        Name: 'Table', OrderType: OrderType.DineIn, Col: 0, Row: 0
                    },
                    {
                        Name: 'Take Out', OrderType: OrderType.TakeOut, Col: 0, Row: 1
                    }
                );
                break;
            case 2:
                this.orderTypeDetails.push(
                    {
                        Name: 'Quick Sale', OrderType: OrderType.BarQuickSale, Col: 0, Row: 0
                    },
                    {
                        Name: 'Bar Tab', OrderType: OrderType.BarTab, Col: 0, Row: 1
                    }
                );
                break;
            case 3:
                this.orderTypeDetails.push(
                    {
                        Name: 'Phone In', OrderType: OrderType.PhoneIn, Col: 0, Row: 0
                    },
                    {
                        Name: 'Walk In', OrderType: OrderType.Walkin, Col: 0, Row: 1
                    },
                    {
                        Name: 'Drive Thru', OrderType: OrderType.DriveThru, Col: 0, Row: 2
                    },
                    {
                        Name: 'Quick Sale', OrderType: OrderType.FastFood, Col: 0, Row: 3
                    }
                );
                break;
        }
    }

    orderByEmployee()
    {
        this.employeeOrderASC = !this.employeeOrderASC;

        if (this.employeeOrderASC)
            {
                this.checks.sort((leftSide, rightSide): number => {
                    if (leftSide.FirstName < rightSide.FirstName) return -1;
                    if (leftSide.FirstName > rightSide.FirstName) return 1;
                    return 0;
                });
            }
         else
         {
            this.checks.sort((leftSide, rightSide): number => {
                if (leftSide.FirstName > rightSide.FirstName) return -1;
                if (leftSide.FirstName < rightSide.FirstName) return 1;
                return 0;
            });
         } 
         
         this.employeeOrderText = this.employeeOrderASC ? 'Employee A > Z': 'Employee Z > A';
    }

    orderTypeSelected(orderType : OrderType)
    {

    }

    cancel() {
        this.router.back();
    }

    viewChecks()
    {
        this.closedChecks = !this.closedChecks;
        this.getGroupedChecks();
    }

    constructor(
        private router: RouterExtensions, private DBService: SQLiteService,
        private page: Page, private utilSvc: UtilityService, private apiSvc: APIService,
        private route: ActivatedRoute
    ) {
        page.actionBarHidden = true;
        this.route.queryParams.subscribe(params => {
            this.closedChecks = params['closed'];                  
        });
    }
}
