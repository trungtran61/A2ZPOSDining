import { Component, OnInit, ViewContainerRef, ViewChild, ElementRef } from "@angular/core";
import { ModalDialogParams, ModalDialogOptions, ModalDialogService } from "nativescript-angular/modal-dialog";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { MenuProduct, ProductGroup, OpenProductItem } from "~/app/models/products";
import { SQLiteService } from "~/app/services/sqlite.service";


@Component({
    selector: "open-product.component",
    moduleId: module.id,
    templateUrl: "./open-product.component.html",
    styleUrls: ['./open-product.component.css']
})
export class OpenProductComponent implements OnInit {
    @ViewChild("vcProductName") vcProductName: ElementRef;
    //@ViewChild("vcPrice") vcPrice: ElementRef;

    productGroups: ProductGroup[] = [];
    selectedGroup: ProductGroup = null;
    showEditPanel: boolean = false; 
    productName: string = '';
    quantity: string = '0';
    price: string = '0';
    priceWithDecimal: string = '0.00';
    showingNumericKeyPad: boolean = false;
    pageTitle: string = 'Choose a Product Group';
    activeTextField: string = '';    

    groupSelected(group: ProductGroup) {
        this.selectedGroup = group;
        this.showEditPanel = true;
        this.pageTitle = group.Description;
        this.vcProductName.nativeElement.focus();         
    }

    cancel() {
        this.params.closeCallback(null);
    }

    done() { 
        if (this.selectedGroup != null && this.productName != null &&
            this.quantity != null && this.price != null)
            if (this.productName != '' ) {
                let openProductItem: OpenProductItem = {
                    ProductGroupId: this.selectedGroup.PriKey,
                    ProductName: this.productName,
                    Quantity: Number(this.quantity),
                    UnitPrice:  Number(this.price) / 100,  
                    Taxable: this.selectedGroup.Taxable ? 0 : 1,
                    TaxRate: this.selectedGroup.TaxRate                  
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
  
    showNumericKeyPad(textField: string)
    {        
        this.showingNumericKeyPad = true;
        this.activeTextField = textField;
    }

    acceptNumericInput()
    {
        this.done();
        //this.showingNumericKeyPad = false;
    }

    cancelNumericInput()
    {
        this.cancel();
        //this.showingNumericKeyPad = false;
    } 
 
    addDigit(digit: string)
    {
        if (this.activeTextField == 'quantity') 
        {
            if (this.quantity == '0')            
                {
                if (digit != '0' && digit != '00') 
                    this.quantity = digit;            
                }
            else 
                this.quantity +=  digit;        
        }
        else
        {        
            if (this.price.length > 0)
                this.price +=  digit;
            else if (digit != '0' && digit != '00')    
                this.price +=  digit;  
                
            let price: number = Number(this.price) / 100;
            this.priceWithDecimal = price.toFixed(2);           
        }        
    }

    constructor(private params: ModalDialogParams,
        private viewContainerRef: ViewContainerRef,
        private DBService: SQLiteService) {
    }
     
    ngOnInit() {  
        let that = this;
        //this.vcPrice.nativeElement.dismissSoftInput();

        this.DBService.getLocalProductGroups().then((productGroups) => {
            if (productGroups.length == 0) {
                dialogs.alert("Product Groups not loaded.")
            }
            else {
                this.productGroups = productGroups;
                let i: number = 1;
                this.productGroups.forEach(function (productGroup: ProductGroup) {
                    productGroup.Col = (i - 1) % 3;
                    productGroup.Row = Math.floor((i - 1) / 3) + 1;
                    i++;
                });
            }
        });
    }    
}
