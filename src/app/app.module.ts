import { NgModule, NgModuleFactoryLoader, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { HttpClientModule } from "@angular/common/http";
//import { SocketIOModule } from "nativescript-socketio/angular";

//import { TNSFontIconModule, TNSFontIconService } from 'nativescript-ngx-fonticon';
//import { BadgeButtonModule } from "nativescript-badge-button";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { SQLiteService } from "~/app/services/sqlite.service";
import { SplashComponent } from "~/app/home/splash/splash.component";
import { APIService } from "./services/api.service";
import { UtilityService } from "./services/utility.service";
import { OrderService } from "./services/order.service";

//TNSFontIconService.debug = true;

@NgModule({
    bootstrap: [
        AppComponent
    ],
    imports: [
        NativeScriptModule,
        AppRoutingModule,
        HttpClientModule,
        //SocketIOModule.forRoot('192.168.8.131')
       // BadgeButtonModule              
    ],
    declarations: [
        AppComponent,
        SplashComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ],   
    providers: [
        SQLiteService,
        APIService,
        UtilityService,
        OrderService
    ] 
})
export class AppModule { }
