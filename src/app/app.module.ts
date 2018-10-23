import { NgModule, NgModuleFactoryLoader, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { HttpClientModule } from "@angular/common/http";
//import { BadgeButtonModule } from "nativescript-badge-button";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { SQLiteService } from "~/app/services/sqlite/sqlite.service";
import { SplashComponent } from "~/app/home/splash/splash.component";

@NgModule({
    bootstrap: [
        AppComponent
    ],
    imports: [
        NativeScriptModule,
        AppRoutingModule,
        HttpClientModule,  
       // BadgeButtonModule              
    ],
    declarations: [
        AppComponent,
        SplashComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ],   
    providers: [SQLiteService] 
})
export class AppModule { }
