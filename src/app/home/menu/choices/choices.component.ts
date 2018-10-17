import { Component, OnInit } from "@angular/core";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { MenuChoice, CurrentChoice } from "~/app/models/products";
import { SQLiteService } from "~/app/services/sqlite/sqlite.service";

@Component({
    selector: "choices",   
    moduleId: module.id,
    templateUrl: "./modifiers.component.html",
	styleUrls: ['./modifiers.component.css']
})
export class ChoicesComponent implements OnInit {
    currentChoices: CurrentChoice[] = [];        
    choices: string[] = [];
    choiceItems: MenuChoice[] = [];
    productCode: number = parseInt(localStorage.getItem("ProductCode"));
    constructor(private DBService: SQLiteService) { }

    ngOnInit() { 
        this.getChoices(1);       
    }

    getChoices(layer: number)
    {
        this.DBService.getLocalMenuChoices(this.productCode, layer).then((choices) => {
            if (choices.length == 0) {
                dialogs.alert("Menu Choices not loaded.");
            }
            else {
                this.choices = choices;
                this.choiceSelected(this.choices[0]);
            }
        });
    }

    choiceSelected(choiceName: string)
    {
        this.DBService.getLocalMenuChoiceItems(parseInt(localStorage.getItem("ProductCode")), choiceName).then((items) => {
            if (items.length == 0) {
                dialogs.alert("Menu Choice Items not loaded.");
            }
            else {
                this.choiceItems = items;                
            }
        });
    }
}
