import { Component, OnInit, ViewContainerRef, ViewChild, ElementRef } from "@angular/core";
import { ModalDialogParams, ModalDialogOptions, ModalDialogService } from "nativescript-angular/modal-dialog";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { Memo } from "~/app/models/products";

@Component({
    selector: "memo",
    moduleId: module.id,
    templateUrl: "./memo.component.html",
    styleUrls: []
})
export class MemoComponent implements OnInit {
    @ViewChild("memoModel") memoModel: ElementRef;
    memo: string = '';
    price: number;
    pageTitle: string = 'Enter Memo';

    cancel() {
        this.params.closeCallback(null);
    }

    done() {

        let openProductItem: Memo = {
            Memo: this.memo,
            Price: this.price
        }
        this.params.closeCallback(openProductItem);

    }

    constructor(private params: ModalDialogParams,
        private viewContainerRef: ViewContainerRef) {

    }

    ngOnInit() {
        setTimeout(() => {
            this.memoModel.nativeElement.focus();
        }, 600);
    }
}
