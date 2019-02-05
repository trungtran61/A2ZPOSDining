import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";

import * as dialogs from "tns-core-modules/ui/dialogs";

import { SQLiteService } from "~/app/services/sqlite.service";
import { Page } from "tns-core-modules/ui/page/page";
import { KitchenMessage } from "~/app/models/orders";
import { ModalDialogParams } from "nativescript-angular/modal-dialog";

@Component({
    selector: "message",
    moduleId: module.id,
    templateUrl: "./kitchen-message.component.html",
    styleUrls: ['./kitchen-message.component.css']
})

export class KitchenMessageComponent implements OnInit {
    @ViewChild('vcMessage') vcMessage: ElementRef; 
    messages: KitchenMessage[] = [];    
    message: string;
    otherMessage: string;
    isOtherMessage: boolean = false;
    
    ngOnInit(): void {
        this.getMessages();
    }

    getMessages() {
        this.DBService.getLocalKitchenMessages().then((data) => {
            if (data.length == 0) {
                dialogs.alert("Kitchen Messages not loaded").then(() => {
                    console.log("Dialog closed!");
                });
            }
            else {
                this.messages = data; 
                let i: number = 1;
                this.messages.forEach(message =>
                    {
                        message.Class = 'glass' 
                        message.Row = (Math.floor((i - 1) / 3));
                        message.Col = (i - 1) % 3;     
                        i++;
                    });                         
            }
        });
    }

    setActiveMessage(message: KitchenMessage)
    {
        this.message = message.Extra;

        this.messages.forEach( message => {
            message.Class = 'glass'            
        });

        message.Class = 'glass activeMessage';
    }

    showOtherMessage()
    {
        this.vcMessage.nativeElement.focus();
        this.isOtherMessage = true;
    }
   
    acceptMessage(message: string)
    {
        //if (message != '')
        this.params.closeCallback(message);
    }   

    keyPressed(event)
    {
        console.log(event);
    }

    cancel()
    {
        this.params.closeCallback(null);
    }   

    constructor ( private DBService: SQLiteService, private page: Page, private params: ModalDialogParams ) 
    {
        page.actionBarHidden = true;
    }
}
