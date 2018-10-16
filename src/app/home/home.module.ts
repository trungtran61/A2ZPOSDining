import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptHttpClientModule } from "nativescript-angular/http-client";
import { platformNativeScriptDynamic } from "nativescript-angular/platform";

import { HomeRoutingModule } from "./home-routing.module";
import { HomeComponent } from "./home.component";
import { MyTablesComponent } from "~/app/home/mytables/my-tables.component";
import { TableGuestsComponent } from "~/app/home/tableguests/table-guests.component";
import { MenuComponent } from "~/app/home/menu/menu.component";
import { ModifyCheckItemComponent } from "~/app/home/menu/modify-check-item.component";
import { ModifiersComponent } from "~/app/home/menu/modifiers.component";
//import { SplashComponent } from "~/app/home/splash/splash.component";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        NativeScriptHttpClientModule,
        HomeRoutingModule 
    ],
    declarations: [
        HomeComponent,
        MyTablesComponent,
        TableGuestsComponent,
        MenuComponent,
        ModifyCheckItemComponent,
        ModifiersComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ],    
    entryComponents: [
        ModifyCheckItemComponent
    ]  
})
export class HomeModule { }
