import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Countdown, Order } from "~/app/models/orders";

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

    GetOrder(orderFilter: number, ph1: boolean, ph2: boolean): Order
    {
        let order: Order;
        return order;
    }
}