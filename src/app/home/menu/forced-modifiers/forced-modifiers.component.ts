import { Component, OnInit, ViewContainerRef } from "@angular/core";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { MenuChoice, ForcedModifier } from "~/app/models/products";
import { SQLiteService } from "~/app/services/sqlite/sqlite.service";
import { ModalDialogParams } from "nativescript-angular";

@Component({
    selector: "choices",   
    moduleId: module.id,
    templateUrl: "./modifiers.component.html",
	styleUrls: ['./modifiers.component.css']
})
export class ForcedModifiersComponent implements OnInit {
    currentChoices: ForcedModifier[] = [];        
    choiceLayers: string[] = [];
    choiceItems: ForcedModifier[] = [];
    productCode: number = parseInt(localStorage.getItem("ProductCode"));
    
    getChoiceLayers(layer: number)
    {
        this.DBService.getLocalMenuChoices(this.productCode, layer).then((choiceLayers) => {
            if (choiceLayers.length == 0) {
                dialogs.alert("Menu Choices not loaded.");
            } 
            else
            {           
                this.choiceLayers = choiceLayers;
                this.choiceLayerSelected(this.choiceLayers[0]);
            }
        });
    }

    choiceLayerSelected(layerName: string)
    {
        this.DBService.getLocalMenuChoiceItems(parseInt(localStorage.getItem("ProductCode")), layerName).then((items) => {
            if (items.length == 0) {
                dialogs.alert("Menu Choice Items not loaded.");
            }
            else {
                this.choiceItems = items;                
            }
        });
    }

    choiceSelected(choice: MenuChoice)
    {
        this.DBService.getLocalMenuChoiceItems(parseInt(localStorage.getItem("ProductCode")), choice.ChoiceName).then((items) => {
            if (items.length == 0) {
                dialogs.alert("Menu Choice Items not loaded.");
            }
            else {
                this.choiceItems = items;                
            }
        });
    }

    constructor(private DBService: SQLiteService, private params: ModalDialogParams, private viewContainerRef: ViewContainerRef) { }

    ngOnInit() { 
        this.productCode = this.params.context.productCode;
        this.currentChoices = this.params.context.currentChoices;
        this.getChoiceLayers(1);          
    }
 
    close() {
        this.params.closeCallback(this.currentChoices);
    }

}
