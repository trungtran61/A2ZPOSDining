import "globals";
import { OrderUpdate, DirectPrintJobsRequest, PrintType } from "~/app/models/orders";
import { HttpHeaders } from "@angular/common/http";

const context: Worker = self as any;
const apiUrl = "http://a2zpos.azurewebsites.net/DBService.svc/";

context.onmessage = orderUpdateMessage => {
      setTimeout(() => {
            let responseMessage: string;
            //let orderUpdate: OrderUpdate = JSON.parse(orderUpdateMessage.data);
            //console.log(orderUpdate.order);           

            (<any>global).postMessage(responseMessage);
      }, 500)
};

