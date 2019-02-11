import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptHttpClientModule } from "nativescript-angular/http-client";
import { platformNativeScriptDynamic } from "nativescript-angular/platform";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { TNSFontIconModule, TNSFontIconService } from "nativescript-ngx-fonticon";

import { HomeRoutingModule } from "./home-routing.module";
import { HomeComponent } from "./home.component";
import { AreaComponent } from "~/app/home/area/area.component";
import { TableGuestsComponent } from "~/app/home/tableguests/table-guests.component";
import { OrderComponent } from "./order/order.component";
import { ModifyOrderItemComponent } from "./order/modify-order-item.component";
import { ModifiersComponent } from "./order/modifiers/modifiers.component";
import { ForcedModifiersComponent } from "./order/forced-modifiers/forced-modifiers.component";
import { OpenProductComponent } from "./order/open-product/open-product.component";
import { PizzaComponent } from "./order/pizza/pizza.component";
import { PromptQtyComponent } from "./order/prompt-qty.component";
import { MemoComponent } from "./order/memo.component";
import { MyChecksComponent } from "./my-checks/my-checks.component";
import { ReasonComponent } from "./order/reason.component";
import { CloseCheckComponent } from "./order/close-check/close-check.component";
import { SearchComponent } from "./order/search.component";
//import { GuestsComponent } from "./order/guests.component";
import { KitchenMessageComponent } from "./order/kitchen-message.component";
import { HoldComponent } from "./order/hold.component";
import { SelectPrinterComponent } from "./order/select-printer.component";

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
        AreaComponent,
        TableGuestsComponent,
        OrderComponent,
        ModifyOrderItemComponent,
        ModifiersComponent,
        ForcedModifiersComponent,
        OpenProductComponent,
        PizzaComponent,
        PromptQtyComponent,
        MemoComponent,
        SearchComponent,
        MyChecksComponent,
        ReasonComponent,
        CloseCheckComponent,
        //GuestsComponent,
        HoldComponent,
        KitchenMessageComponent,
        SelectPrinterComponent            
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ],    
    entryComponents: [
        ModifyOrderItemComponent,
        ForcedModifiersComponent, 
        OpenProductComponent,
        PromptQtyComponent,
        MemoComponent,
        ReasonComponent,
        SearchComponent,
        //GuestsComponent,
        KitchenMessageComponent,
        SelectPrinterComponent
    ]  
})
export class HomeModule { }
