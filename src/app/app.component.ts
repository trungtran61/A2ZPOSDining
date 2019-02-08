import { Component, OnInit, OnDestroy } from "@angular/core";

import { SQLiteService } from "~/app/services/sqlite.service";
import { ApplicationEventData } from "tns-core-modules/application/application";
//import { SocketIO } from "nativescript-socketio/socketio";
//import * as appSettings from "application-settings";

var Sqlite = require("nativescript-sqlite");

@Component({
    moduleId: module.id,
    selector: "ns-app",
    templateUrl: "app.component.html"
})


export class AppComponent implements OnInit, OnDestroy {

    loadingStyle: string = 'display:none';

    public constructor(private DBService: SQLiteService, 
        //private socketIO: SocketIO
        ) {
    }

    ngOnInit() {
        // this.DBService.getLocalSystemSettings().then((systemSettings) => {
        //     if (systemSettings == null) {
        //         console.log("SystemSettings not loaded.")
        //     }
        // }); 
        /* 
        const iqKeyboard = IQKeyboardManager.sharedManager();
        iqKeyboard.overrideKeyboardAppearance = true;
        iqKeyboard.keyboardAppearance = UIKeyboardAppearance.Dark;
        iqKeyboard.shouldResignOnTouchOutside = true;
        */
        //this.socketIO.connect();
    }

    ngOnDestroy() {
        //this.socketIO.disconnect();
    }

}


