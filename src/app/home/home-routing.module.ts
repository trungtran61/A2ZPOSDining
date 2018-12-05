import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { HomeComponent } from "./home.component";
import { TableGuestsComponent } from "~/app/home/tableguests/table-guests.component";
import { OrderComponent } from "./order/order.component";
import { PizzaComponent } from "./order/pizza/pizza.component";
import { AreaComponent } from "./area/area.component";
import { MyChecksComponent } from "./my-checks/my-checks.component";
import { CloseCheckComponent } from "./order/close-check/close-check.component";

const routes: Routes = [
    { path: "", component: HomeComponent },
    { path: "area", component: AreaComponent },
    { path: "tableguests/:table", component: TableGuestsComponent },
    { path: "order", component: OrderComponent },
    { path: "closeCheck", component: CloseCheckComponent },
    { path: "mychecks", component: MyChecksComponent },
    { path: "pizza", component: PizzaComponent }
];

@NgModule({
    imports: [NativeScriptRouterModule.forChild(routes)],
    exports: [NativeScriptRouterModule]
})
export class HomeRoutingModule { }
