import { Component, OnInit, ViewContainerRef, ViewChild, ElementRef, AfterViewInit } from "@angular/core";
import { ModalDialogParams, ModalDialogOptions, ModalDialogService } from "nativescript-angular/modal-dialog";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { TextField } from "tns-core-modules/ui/text-field";

import { Memo } from "~/app/models/products";
import { Page } from "tns-core-modules/ui/page/page";

@Component({
    selector: "memo",
    moduleId: module.id,
    templateUrl: "./memo.component.html",
    styleUrls: []
})
export class MemoComponent implements OnInit, AfterViewInit {
    @ViewChild("vcMemo") vcMemo: ElementRef;
    memo: string = '';
    price: number = 0;
    pageTitle: string = 'Enter Memo';
    memoClass: string = 'textEntryActive';
    priceClass: string = 'textEntry';

    cancel() {
        this.params.closeCallback(null);
    }

    done() {

        if (this.memo != '') {
            let openProductItem: Memo = {
                Memo: this.memo,
                Price: this.price
            }
            this.params.closeCallback(openProductItem);
        }
        else {
            this.cancel();
        }
    }

    activateMemo() {  
        this.memoClass = 'textEntryActive';
        this.priceClass = 'textEntry';
    }

    activatePrice() {
        this.memoClass = 'textEntry';
        this.priceClass = 'textEntryActive';
    }

    addDecimal(newPrice: any)
    {    
        this.price = newPrice.value * .01; 
    }

    constructor(private params: ModalDialogParams,
        private viewContainerRef: ViewContainerRef,
        private page: Page) {

    }

    ngOnInit() {

    }

    ngAfterViewInit() {
        this.vcMemo.nativeElement.focus();
    }

}
