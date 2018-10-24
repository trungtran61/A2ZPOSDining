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

    constructor(private params: ModalDialogParams, 
        private viewContainerRef: ViewContainerRef,
        private DBService: SQLiteService) { 
        
    }

    ngOnInit() {
        this.DBService.getLocalProductGroups().then((productGroups) => {
            if (productGroups.length == 0) {
                dialogs.alert("Product Groups not loaded.")
            }
            else {
                this.productGroups = productGroups;                
                this.productGroups.forEach(function (productGroup: ProductGroup) {                    
                });
            }
        });  
    } 
}
