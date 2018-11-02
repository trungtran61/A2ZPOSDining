import { Injectable } from "@angular/core";
import { Employee } from "~/app/models/employees";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { CategoryCode, Product, ProductCategory, Area, Table, MenuCategory, MenuSubCategory, MenuProduct, TableDetail, Option, MenuChoice, OptionCategory, MenuSubOption, MenuOption, ProductGroup, MenuTimer } from "~/app/models/products";
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import { SystemSettings, Logos } from "~/app/models/settings";
import { Countdown } from "~/app/models/orders";
//import { Observable } from "tns-core-modules/ui/page/page";

@Injectable()
export class APIService {

    private apiUrl = "http://a2zpos.azurewebsites.net/DBService.svc/";
    
    public constructor(private http: HttpClient) {
    }

    public getCountDowns(products: MenuProduct[]) {
        let promise = new Promise(((resolve, reject) => {
            let headers = this.createRequestHeader();
            this.http.get(this.apiUrl + 'GetCountDowns', { headers: headers })
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

    public reloadCountdowns() {
        let that = this;
        let headers = this.createRequestHeader();
        let promise = new Promise(function (resolve, reject) {           
            that.http.get(that.apiUrl + 'GetCountdowns', { headers: headers })
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