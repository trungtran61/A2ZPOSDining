import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from "@angular/core";
import { ModalDialogParams } from "nativescript-angular/modal-dialog";

@Component({
    selector: "search",
    moduleId: module.id,
    templateUrl: "./search.component.html",
    styleUrls: []
})
export class SearchComponent implements OnInit, AfterViewInit {
    @ViewChild("vcSearchTerm") vcSearchTerm: ElementRef;
    searchTerm: string = '';
    pageTitle: string = 'Enter Search Term';
    
    cancel() {
        this.params.closeCallback(null);
    }

    done() {
        this.params.closeCallback(this.searchTerm);
    }

    constructor(private params: ModalDialogParams,        
        ) {

    }

    ngOnInit() {

    }

    ngAfterViewInit() {
        this.vcSearchTerm.nativeElement.focus();
    }

}
