import { Injectable } from "@angular/core";
import { Employee } from "~/app/models/employees";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { CategoryCode, Product, ProductCategory, Area, Table, MenuCategory, MenuSubCategory, MenuProduct, TableDetail, Option, MenuChoice, OptionCategory, MenuSubOption, MenuOption, ProductGroup, MenuTimer } from "~/app/models/products";
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import { SystemSettings, Logos } from "~/app/models/settings";
import { CountDown } from "~/app/models/orders";
//import { Observable } from "tns-core-modules/ui/page/page";

@Injectable()
export class APIService {

    private apiUrl = "http://a2zpos.azurewebsites.net/DBService.svc/";

    public constructor(private http: HttpClient) {
    }

    public getCountDowns(): Observable<CountDown[]>{            
        let headers = this.createRequestHeader();       
        return this.http.get<CountDown[]>(this.apiUrl + 'GetCountDowns', { headers: headers });          
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