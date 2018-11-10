import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { HomeComponent } from "./home.component";
import { MyTablesComponent } from "~/app/home/mytables/my-tables.component";
import { TableGuestsComponent } from "~/app/home/tableguests/table-guests.component";
import { OrderComponent } from "./order/order.component";
import { PizzaComponent } from "./order/pizza/pizza.component";

const routes: Routes = [
    { path: "", component: HomeComponent },
    { path: "mytables", component: MyTablesComponent },
    { path: "tableguests/:table", component: TableGuestsComponent },
    { path: "order", component: OrderComponent },
    { path: "pizza", component: PizzaComponent }
];

@NgModule({
    imports: [NativeScriptRouterModule.forChild(routes)],
    exports: [NativeScriptRouterModule]
})
export class HomeRoutingModule { }
