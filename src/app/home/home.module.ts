import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptHttpClientModule } from "nativescript-angular/http-client";
import { platformNativeScriptDynamic } from "nativescript-angular/platform";
import { NativeScriptFormsModule } from "nativescript-angular/forms";

import { HomeRoutingModule } from "./home-routing.module";
import { HomeComponent } from "./home.component";
import { MyTablesComponent } from "~/app/home/mytables/my-tables.component";
import { TableGuestsComponent } from "~/app/home/tableguests/table-guests.component";
import { MenuComponent } from "~/app/home/menu/menu.component";
import { ModifyOrderItemComponent } from "~/app/home/menu/modify-check-item.component";
import { ModifiersComponent } from "~/app/home/menu/modifiers/modifiers.component";
import { ForcedModifiersComponent } from "~/app/home/menu/forced-modifiers/forced-modifiers.component";
import { TNSFontIconModule, TNSFontIconService } from "nativescript-ngx-fonticon";
import { OpenProductComponent } from "./menu/open-product/open-product.component";
import { PizzaComponent } from "./menu/pizza/pizza.component";
import { PromptQtyComponent } from "./menu/prompt-qty.component";
import { MemoComponent } from "./menu/memo.component";

//import { SplashComponent } from "~/app/home/splash/splash.component";
TNSFontIconService.debug = true;

@NgModule({
    imports: [
        NativeScriptCommonModule,
        NativeScriptHttpClientModule,
        NativeScriptFormsModule,
        HomeRoutingModule, 
        TNSFontIconModule.forRoot({
			'fa': './assets/font-awesome.css'
		})
    ],
    declarations: [
        HomeComponent,
        MyTablesComponent,
        TableGuestsComponent,
        MenuComponent,
        ModifyOrderItemComponent,
        ModifiersComponent,
        ForcedModifiersComponent,
        OpenProductComponent,
        PizzaComponent,
        PromptQtyComponent,
        MemoComponent            
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ],    
    entryComponents: [
        ModifyOrderItemComponent,
        ForcedModifiersComponent, 
        OpenProductComponent,
        PromptQtyComponent,
        MemoComponent
    ]  
})
export class HomeModule { }
