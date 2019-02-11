import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";

import { SQLiteService } from "~/app/services/sqlite.service";
import { Page } from "tns-core-modules/ui/page/page";
import { Printer } from "~/app/models/orders";
import { ModalDialogParams } from "nativescript-angular/modal-dialog";
import { APIService } from "~/app/services/api.service";

@Component({
    selector: "message",
    moduleId: module.id,
    templateUrl: "./select-printer.component.html",
    styleUrls: ['./select-printer.component.css']
})

export class SelectPrinterComponent implements OnInit {
    printers: Printer[] = [];    
    selectedPrinter: Printer;
    
    ngOnInit(): void {
       this.printers = this.apiSvc.getPrinters();
    }
       
    printerSelected(printer: Printer)
    {
        this.selectedPrinter = printer;
        
    }

    accept()
    {
        this.params.closeCallback(this.selectedPrinter);
    }   
    
    close()
    {
        this.params.closeCallback(null);
    }   

    constructor ( private DBService: SQLiteService, private page: Page, private params: ModalDialogParams, private apiSvc: APIService ) 
    {
        page.actionBarHidden = true;
    }
}
