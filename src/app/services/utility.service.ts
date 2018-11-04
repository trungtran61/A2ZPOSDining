import { Injectable } from "@angular/core";
import { interval, Observable } from 'rxjs'
import { RouterExtensions } from "nativescript-angular";
import { SQLiteService } from "./sqlite.service";

@Injectable()
export class UtilityService {
    timeoutInSecs: number = 15;
    idleTimer: number;

    public constructor(private router: RouterExtensions, private DBService: SQLiteService,) {
    }

    startTimer() {
        this.idleTimer = 0;
        const subscription = interval(1000)
            .subscribe(() => {
                this.idleTimer++;
                if (this.idleTimer >= this.timeoutInSecs)
                {
                    subscription.unsubscribe();
                    this.DBService.logoff().subscribe(res => {
                        this.router.navigate(['/home/']);              
                    });    
                }
            });
    }

    resetIdleTImer()
    {
        this.idleTimer = 0;
    }

    
}
