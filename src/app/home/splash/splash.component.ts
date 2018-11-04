import { Component, OnInit } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { SQLiteService } from "~/app/services/sqlite.service";

@Component({
    selector: "splash-screen",
    moduleId: module.id,
    templateUrl: "./splash.component.html",
    styleUrls: ['./splash.component.css']
})
export class SplashComponent implements OnInit {
    

    constructor(private router: RouterExtensions, private DBService: SQLiteService,) {        
    }

    ngOnInit(): void {    
        this.router.navigate(['/home'], { clearHistory: true })
    }
}