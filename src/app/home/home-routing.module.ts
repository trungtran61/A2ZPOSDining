import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { HomeComponent } from "./home.component";
import { MyTablesComponent } from "~/app/home/mytables/my-tables.component";
import { TableGuestsComponent } from "~/app/home/tableguests/table-guests.component";
import { MenuComponent } from "~/app/home/menu/menu.component";
import { ModifyCheckItemComponent } from "~/app/home/menu/modify-check-item.component";
import { MenuItemsComponent } from "./menu/menu-items/menu-items.component";

const routes: Routes = [
    { path: "", component: HomeComponent },
    { path: "mytables", component: MyTablesComponent },
    { path: "tableguests/:table", component: TableGuestsComponent },
    { path: "menu", component: MenuComponent },
    { path: "menuitems", component: MenuItemsComponent }
];

@NgModule({
    imports: [NativeScriptRouterModule.forChild(routes)],
    exports: [NativeScriptRouterModule]
})
export class HomeRoutingModule { }
