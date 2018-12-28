import { Component, OnInit, ViewContainerRef, ViewChild, ElementRef, AfterViewInit } from "@angular/core";
import { ModalDialogParams, ModalDialogOptions, ModalDialogService } from "nativescript-angular/modal-dialog";

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
    price: string = '0';
    priceWithDecimal: string = '0.00';
    pageTitle: string = 'Enter Memo';
    memoClass: string = 'textEntryActive';
    priceClass: string = 'textEntry';
    showingNumericKeyPad: boolean = false; 

    showNumericKeyPad() {
        this.showingNumericKeyPad = true;
    }

    cancel() {
        this.params.closeCallback(null);
    }

    done() {

        if (this.memo != '') {
            let openProductItem: Memo = {
                Memo: this.memo,
                Price: Number(this.price) / 100
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
 
    addDigit(digit: string) {
        if (this.price.length > 0)
            this.price += digit;
        else if (digit != '0' && digit != '00')
            this.price += digit;

        let price: number = Number(this.price) / 100;
        this.priceWithDecimal = price.toFixed(2);
    }

    constructor(private params: ModalDialogParams,
        private viewContainerRef: ViewContainerRef,
        private page: Page) {

    }

    ngOnInit() {
        this.page.actionBarHidden = true;
    }

    ngAfterViewInit() {
        this.vcMemo.nativeElement.focus();
    }

}
