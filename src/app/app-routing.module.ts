import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import { SplashComponent } from "~/app/home/splash/splash.component";

const routes: Routes = [
    { path: "", redirectTo: "/splash", pathMatch: "full" },  
    { path: "splash", component: SplashComponent }, 
    { path: "home", loadChildren: "~/app/home/home.module#HomeModule" }   
];

@NgModule({
    imports: [NativeScriptRouterModule.forRoot(routes)],
    exports: [NativeScriptRouterModule]
})
export class AppRoutingModule { }
