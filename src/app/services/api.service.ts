import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpEvent } from "@angular/common/http";
import { Countdown, OrderResponse, OrderHeader, OrderUpdate } from "~/app/models/orders";
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AccessType } from "../models/employees";
import { Order } from "tns-core-modules/ui/layouts/flexbox-layout/flexbox-layout";

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

    public createHttpOptions() {
        return ({ headers : this.createHttpOptions()});
    }

    getOrder(orderFilter: number, ph1: boolean, ph2: boolean): OrderHeader {
        let order: OrderHeader;
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
/*
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
*/
    getCheckNumber(tableName: string, employeeID: number): Observable<any> {
        let headers = this.createRequestHeader();
        return this.http.get(this.apiUrl + 'getCheckNumber?Name=' + tableName + '&EmployeeID=' + employeeID,
            { headers: headers }).pipe(map(res => res));
    }

    getTablesDetails(areaID: number, employeeID: number, clockInType: number, serverViewAll: boolean): Observable<any> {
        let headers = this.createRequestHeader();
        return this.http.get(this.apiUrl + 'GetTableDetail?AreaId=' + areaID +
            '&EmployeeID=' + employeeID +
            '&ClockInType=' + clockInType +
            '&ServerViewAll=' + serverViewAll,
            { headers: headers }).pipe(map(res => res));
    }

    getOccupiedTables(): Observable<any> {
        let headers = this.createRequestHeader();
        return this.http.get(this.apiUrl + 'GetOccupiedTables',
            { headers: headers }).pipe(map(res => res));
    }

    getGroupedChecks(employeeID: number, accessType: AccessType, closed: boolean): Observable<any>
    {
        //http://a2zpos.azurewebsites.net/DBService.svc/GetGroupedChecks?employeeID=105&module=1&closed=false&multiicheck=false&name=
        let headers = this.createRequestHeader();
        return this.http.get(this.apiUrl + 'GetGroupedChecks?employeeID=' + employeeID + 
            '&module=1&closed=' + closed + '&multicheck=false&name=',
            { headers: headers }).pipe(map(res => res));
    }

    updateOrder(order: OrderUpdate): Observable<any>
    {
        let options = this.createHttpOptions();
        return this.http.post<Order>(this.apiUrl + 'UpdateOrder',
            order, options); //.pipe(catchError(this.handleError('updateOrder', order)));
    }

    private handleError(apiCall: string, error: HttpErrorResponse) {
        if (error.error instanceof ErrorEvent) {
          // A client-side or network error occurred. Handle it accordingly.
          console.error('An error occurred:', error.error.message);
        } else {
          // The backend returned an unsuccessful response code.
          // The response body may contain clues as to what went wrong,
          console.error(
            'Backend returned code ${error.status}, ' +
            'body was: ${error.error}');
        }
        // return an observable with a user-facing error message
        alert('Error occurred, please contact technical support or try again later.');
      };
      
    postToPrint(text: string)
    {
        let httpOptions = {
            headers: new HttpHeaders({
              'Content-Type':  'text/plain',
              'Authorization': 'my-auth-token'
            })
          };
        this.http.post<string>('192.168.0.125:9100', text, httpOptions);             
          
    }
}