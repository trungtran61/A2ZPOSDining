import { Component, OnInit } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { SQLiteService } from "~/app/services/sqlite.service";
import { Area, TableDetail, Check } from "~/app/models/products";
import { Page } from "tns-core-modules/ui/page/page";
import { UtilityService } from "~/app/services/utility.service";
import { APIService } from "~/app/services/api.service";
import { FunctionTypeDetail, FunctionType } from "~/app/models/orders";
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
    functionTypeDetails: FunctionTypeDetail[] = [];
    closedChecks: boolean = false;

    filterByClass: string = 'glass btnBlackSquare';
    filterOn: boolean = false;
    filter: FunctionType;

    ngOnInit(): void {
        
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

        this.loadFunctionTypeDetails();

    }

    getGroupedChecks() {
        this.viewChecksText = this.closedChecks ? 'View All Checks' : 'View Closed Checks';

        this.apiSvc.getGroupedChecks(this.DBService.loggedInUser.AccessType == AccessType.Manager ? 0 : this.DBService.loggedInUser.PriKey,
            this.DBService.loggedInUser.AccessType, this.closedChecks).subscribe(checks => {
                this.checks = checks;
                if (this.filterOn && this.filter != null) {
                    this.checks = this.checks.filter(c => c.TransType == this.filter)
                }

                let i: number = 1;
                let now = new Date().getTime();

                this.checks.forEach(check => {
                    //let currentTime: number = this.utilSvc.getJSONDate(check.CurrentDate).getTime();
                    let checkTime: number = this.utilSvc.getJSONDate(check.CheckTime).getTime();
                    let elapsedTime: number = Math.ceil((now - checkTime) / (this.oneMinute));
                    let hours = Math.floor(elapsedTime / 60);
                    let minutes = elapsedTime % 60;
                    check.ElapsedTime = hours.toString() + ':' + this.utilSvc.padLeft(minutes.toString(), '0', 2);
                    check.Row = (Math.floor((i - 1) / 4));
                    check.Col = (i - 1) % 4;
                    i++;
                })
            });
    }

    loadFunctionTypeDetails() {
        switch (this.DBService.loggedInUser.Module) {
            case 1:
                this.functionTypeDetails.push(
                    {
                        Name: 'Table', FunctionType: FunctionType.DineIn, Col: 0, Row: 0
                    },
                    {
                        Name: 'Take Out', FunctionType: FunctionType.TakeOut, Col: 0, Row: 1
                    }
                );
                break;
            case 2:
                this.functionTypeDetails.push(
                    {
                        Name: 'Quick Sale', FunctionType: FunctionType.BarQuickSale, Col: 0, Row: 0
                    },
                    {
                        Name: 'Bar Tab', FunctionType: FunctionType.BarTab, Col: 0, Row: 1
                    }
                );
                break;
            case 3:
                this.functionTypeDetails.push(
                    {
                        Name: 'Phone In', FunctionType: FunctionType.PhoneIn, Col: 0, Row: 0
                    },
                    {
                        Name: 'Walk In', FunctionType: FunctionType.WalkIn, Col: 0, Row: 1
                    },
                    {
                        Name: 'Drive Thru', FunctionType: FunctionType.DriveThru, Col: 0, Row: 2
                    },
                    {
                        Name: 'Quick Sale', FunctionType: FunctionType.FastFood, Col: 0, Row: 3
                    }
                );
                break;
        }

        this.functionTypeDetails.forEach(otd => otd.Class = 'glass btnGreenSquare');
    }

    orderByEmployee() {
        let that = this;
        this.employeeOrderASC = !this.employeeOrderASC;

        if (this.employeeOrderASC) {
            this.checks.sort(function (a, b) {
                var nameA = a.FirstName.toLowerCase(), nameB = b.FirstName.toLowerCase()
                if (nameA < nameB) //sort string ascending
                    return -1;
                if (nameA > nameB)
                    return 1;
                return 0;
            })
        }
        else {
            this.checks.sort(function (a, b) {
                var nameA = a.FirstName.toLowerCase(), nameB = b.FirstName.toLowerCase()
                if (nameA > nameB) //sort string descending
                    return -1;
                if (nameA < nameB)
                    return 1;
                return 0;
            })
        }

        this.employeeOrderText = this.employeeOrderASC ? 'Employee A > Z' : 'Employee Z > A';
    }

    functionTypeSelected(functionTypeDetail: FunctionTypeDetail) {

        if (this.filterOn) {
            this.functionTypeDetails.forEach(ftd => ftd.Class = ftd.Class = 'glass btnBrownSquare');
            functionTypeDetail.Class += ' thickRedBorder';
            this.filter = functionTypeDetail.FunctionType;
            this.getGroupedChecks();
        }
    }

    filterByClicked() {
        this.toggleFiltering();
    }

    resetFilters() {
        this.filterByClass = 'glass btnBlackSquare';
        this.functionTypeDetails.forEach(ftd => ftd.Class = ftd.Class = 'glass btnGreenSquare');
        this.filterOn = false;
    }

    toggleFiltering() {
        this.filterOn = !this.filterOn;

        if (this.filterOn) {
            this.filterByClass = 'glass btnBlackSquare thickRedBorder';
            this.functionTypeDetails.forEach(otd => otd.Class = 'glass btnBrownSquare');
        }
        else {
            this.filterByClass = 'glass btnBlackSquare';
            this.functionTypeDetails.forEach(otd => otd.Class = 'glass btnGreenSquare');
        }
        this.getGroupedChecks();
    }

    cancel() {
        this.router.back();
    }

    viewChecks() {
        //this.toggleFiltering();
        this.resetFilters();
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
            this.closedChecks = params['closed'] == 'true' ? true : false;
        });
    }
}
