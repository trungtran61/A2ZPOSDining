import { Component, OnInit, ViewContainerRef } from "@angular/core";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { MenuChoice, ForcedModifier } from "~/app/models/products";
import { SQLiteService } from "~/app/services/sqlite/sqlite.service";
import { ModalDialogParams } from "nativescript-angular";

@Component({
    selector: "forced-modifiers",   
    moduleId: module.id,
    templateUrl: "./forced-modifiers.component.html",
	styleUrls: ['./forced-modifiers.component.css']
})
export class ForcedModifiersComponent implements OnInit {
    currentChoices: ForcedModifier[] = [];        
    choiceLayers: MenuChoice[] = [];
    choiceItems: ForcedModifier[] = [];
    productCode: number = parseInt(localStorage.getItem("ProductCode"));
    choiceLayerClasses: string[] = [];
    itemCols: number[] = [];
    itemRows: number[] = [];
    
    getChoiceLayers()
    {
        let that = this;

        this.DBService.getLocalMenuChoices(this.productCode).then((choiceLayers) => {
            if (choiceLayers.length == 0) {
                dialogs.alert("Menu Choices Layers not loaded.");
            } 
            else
            {           
                this.choiceLayers = choiceLayers;

                this.choiceLayers.forEach(function (menuChoice: MenuChoice) {
                    that.choiceLayerClasses.push('choiceLayer');
                });

                that.choiceLayerClasses[0] = 'choiceLayerActive';
                this.choiceLayerSelected(this.choiceLayers[0]);
            }
        });
    }

    choiceLayerSelected(menuChoice: MenuChoice)
    {
        let that = this;
        
        this.DBService.getLocalMenuChoiceItems(menuChoice, this.productCode).then((items) => {
            if (items.length == 0) {
                dialogs.alert("Menu Choice Items not loaded.");
            }
            else {
                this.choiceItems = items;
                this.choiceItems.forEach(function (menuChoice: MenuChoice) {
                    that.itemRows.push(Math.floor((menuChoice.Position - 1) / 4) );
                    that.itemCols.push((menuChoice.Position % 4) - 1);
                });
            }
        });
    }

    choiceSelected(choice: MenuChoice)
    {
        console.log(choice.Name);
    }

    constructor(private DBService: SQLiteService, private params: ModalDialogParams, private viewContainerRef: ViewContainerRef) { }

    ngOnInit() { 
        this.productCode = this.params.context.productCode;
        this.currentChoices = this.params.context.currentChoices;
        this.getChoiceLayers();          
    }
 
    close() {
        this.params.closeCallback(this.currentChoices);
    }

}
