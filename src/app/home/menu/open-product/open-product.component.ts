import { Component, OnInit, ViewContainerRef, ViewChild, ElementRef } from "@angular/core";
import { ModalDialogParams, ModalDialogOptions, ModalDialogService } from "nativescript-angular/modal-dialog";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { MenuProduct, ProductGroup, OpenProductItem } from "~/app/models/products";
import { SQLiteService } from "~/app/services/sqlite/sqlite.service";


@Component({
    selector: "open-product.component",
    moduleId: module.id,
    templateUrl: "./open-product.component.html",
    styleUrls: ['./open-product.component.css']
})
export class OpenProductComponent implements OnInit {
    @ViewChild("productNameModel") productNameModel: ElementRef;
    productGroups: ProductGroup[] = [];
    productGroupCols: number[] = [];
    productGroupRows: number[] = [];
    selectedGroup: ProductGroup = null;
    showEditPanel: boolean = false;
    productName: string = '';
    quantity: number;
    price: number;
    pageTitle: string = 'Choose a Product Group';

    groupSelected(group: ProductGroup) {
        this.selectedGroup = group;
        this.showEditPanel = true;
        this.pageTitle = group.Description;

        setTimeout(() => {
            this.productNameModel.nativeElement.focus();
        }, 600);
    }

    cancel() {
        this.params.closeCallback(null);
    }

    done() {
        if (this.selectedGroup != null && this.productName != null &&
            this.quantity != null && this.price != null)
            if (this.productName != '' &&
                this.quantity > 0 && this.price > 0) {
                let openProductItem: OpenProductItem = {
                    ProductGroupId: this.selectedGroup.PriKey,
                    ProductName: this.productName,
                    Quantity: this.quantity,
                    UnitPrice: this.price
                }
                this.params.closeCallback(openProductItem);
            }
            else {
                this.params.closeCallback(null);
            }
            else
            {
                this.params.closeCallback(null);
            }
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
