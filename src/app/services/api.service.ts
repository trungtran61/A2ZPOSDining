import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Countdown, Order, OrderResponse } from "~/app/models/orders";
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class APIService {

    private apiUrl = "http://a2zpos.azurewebsites.net/DBService.svc/";

    public constructor(private http: HttpClient) {
    }

    public reloadCountdowns() {
        let that = this;
        let headers = this.createRequestHeader();
        let promise = new Promise(function (resolve, reject) {
            that.http.get(that.apiUrl + 'GetProductCountdowns', { headers: headers })
                .subscribe(
                    data => {
                        let countdowns = <Countdown[]>data;
                        resolve(countdowns);
                    },
                    err => {
                        reject("Error occurred while retrieving Countdowns from API.");
                    }
                );
        });

        return promise;
    }

    public createRequestHeader() {
        let headers = new HttpHeaders({
            "AuthKey": "my-key",
            "AuthToken": "my-token",
            "Content-Type": "application/json"
        });

        return headers;
    }

    getOrder(orderFilter: number, ph1: boolean, ph2: boolean): Order {
        let order: Order;
        return order;
    }

    getFullOrder(orderFilter: number): Observable<any> {
        let headers = this.createRequestHeader();
        return this.http.get(this.apiUrl + 'GetFullOrder?OrderFilter=' + orderFilter,
           { headers: headers });

        /*
        return this.http.get(this.apiUrl + 'GetFullOrder?OrderFilter=' + orderFilter,
            { headers: headers })
            .pipe(map(res => res));
            */
    }

    getFullOrderP(orderFilter: number): Promise<any> {
        let promise = new Promise((resolve, reject) => {
            let headers = this.createRequestHeader();
            this.http.get(this.apiUrl + 'GetFullOrder?OrderFilter=' + orderFilter,
                { headers: headers })
                .toPromise()
                .then(
                    res => { // Success
                        resolve();
                    }
                );
        });
        return promise;
    }

    getCheckNumber(tableName: string, employeeID: number): Observable<any> {
        let headers = this.createRequestHeader();
        return this.http.get(this.apiUrl + 'getCheckNumber?Name=' + tableName + '&EmployeeID=' + employeeID,
            { headers: headers }).pipe(map(res => res));
    }

    public getTablesDetails(areaID: number, employeeID: number, clockInType: number, serverViewAll: boolean): Observable<any> {
        let headers = this.createRequestHeader();
        return this.http.get(this.apiUrl + 'GetTableDetail?AreaId=' + areaID +
            '&EmployeeID=' + employeeID +
            '&ClockInType=' + clockInType +
            '&ServerViewAll=' + serverViewAll,
            { headers: headers }).pipe(map(res => res));
    }

    public getOccupiedTables(): Observable<any> {
        let headers = this.createRequestHeader();
        return this.http.get(this.apiUrl + 'GetOccupiedTables',
            { headers: headers }).pipe(map(res => res));
    }
}