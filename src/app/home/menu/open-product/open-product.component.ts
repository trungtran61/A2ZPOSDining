import { Component, OnInit, ViewContainerRef } from "@angular/core";
import { ModalDialogParams, ModalDialogOptions, ModalDialogService } from "nativescript-angular/modal-dialog";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { MenuProduct, ProductGroup } from "~/app/models/products";
import { SQLiteService } from "~/app/services/sqlite/sqlite.service";

@Component({
    selector: "open-product.component",   
    moduleId: module.id,
    templateUrl: "./open-product.component.html",
    styleUrls: ['./open-product.component.css']
})
export class OpenProductComponent implements OnInit {
    
    productGroups: ProductGroup[] = [];    
    productGroupCols: number[] = [];
    productGroupRows: number[] = [];
    selectedGroup: string = '';
    showEditPanel: boolean = false;

    groupSelected(group)
    {
        this.selectedGroup = group;

    }

    constructor(private params: ModalDialogParams, 
        private viewContainerRef: ViewContainerRef,
        private DBService: SQLiteService) { 
        
    }

    ngOnInit() {
        let that = this;

        this.DBService.getLocalProductGroups().then((productGroups) => {
            if (productGroups.length == 0) {
                dialogs.alert("Product Groups not loaded.")
            }
            else {
                this.productGroups = productGroups;                
                let i: number = 1;
                this.productGroups.forEach(function (productGroup: ProductGroup) {                       
                    that.productGroupCols.push((i - 1) % 3);
                    that.productGroupRows.push(Math.floor((i - 1) / 3) + 1);
                    i++;
                });
            }
        });  
    } 
}
