import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Countdown } from "~/app/models/orders";

@Injectable()
export class APIService {

    private apiUrl = "http://a2zpos.azurewebsites.net/DBService.svc/";
    
    public constructor(private http: HttpClient) {
    }
/*
    public getCountDowns(products: MenuProduct[]) {
        let promise = new Promise(((resolve, reject) => {
            let headers = this.createRequestHeader();
            this.http.get(this.apiUrl + 'GetProductCountDowns', { headers: headers })
                .toPromise()
                .then(res => {
                    let _countDowns = <Countdown[]>res;
                    let result = products.map(mp => {
                        return Object.assign({}, mp, _countDowns.filter(cd => cd.PriKey === mp.ProductID)[0]);
                    });
                    resolve(result);
                },
                    err => {
                        reject("Error occurred while retrieving CountDowns from API.");
                    }
                );
        }));

        return promise;
    }
*/
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

    private createRequestHeader() {
        let headers = new HttpHeaders({
            "AuthKey": "my-key",
            "AuthToken": "my-token",
            "Content-Type": "application/json"
        });

        return headers;
    }
}