import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Countdown, Order } from "~/app/models/orders";

@Injectable()
export class APIService {

    private apiUrl = "http://a2zpos.azurewebsites.net/DBService.svc/";
    
    public constructor(private http: HttpClient) {
    }
/*
public getTaxTotal(orderFilter:number, remote: boolean, grouped: boolean, order: Order, g: any, taxrates: TaxRate[],out decimal taxTotal)
        {
            taxTotal = 0;
            if (orderDetails == null)
                return true;

            orderDetails = OrderData.OrderDetail.Where(x => x.tag == null).ToList();

            decimal Discount = 0, lineDiscount = 0, itemTotal = 0;

            if (remote)
            {
                if(!DynamicData.GetOrder(orderFilter, false,out order,false))
                    return false;
                DynamicData.GetOrderDetail(orderFilter, false,out orderDetails);
                orderDetails=orderDetails.Where(x => x.tag == null).ToList();
            }
            Discount = (decimal)order.Discount;
            if ((bool)order.TaxExempt)
                return true;

            itemTotal = (decimal)orderDetails.Where(x => x.Refund == false && x.Voided == null && x.Comped == false && x.ExtPrice != null).Sum(x => x.ExtPrice);
            if (itemTotal == 0)
                return true;

            var linediscounts = from orderdetail in orderDetails
                                join taxrate in taxrates on (byte)orderdetail.TaxRate equals (byte)taxrate.TaxID
                                select new { orderdetail.ExtPrice, taxrate.EffectiveRate, orderdetail.Refund, orderdetail.Voided, orderdetail.Comped, orderdetail.ProductType, orderdetail.Taxable,orderdetail.IgnoreTax };
            if (g.setSmartTax)
            {
                int counts = (int)orderDetails.Where(x => x.Refund == false && x.Voided == null && x.Comped == false && x.ProductType != 4 && x.ProductType != 5 && x.Taxable == 0).Count();
                if (counts > 0)
                {
                    linediscounts = linediscounts.Where(x => (bool)x.Refund == false && x.IgnoreTax==false && x.Voided == null && x.Comped == false && (byte)x.ProductType != 4 && (byte)x.ProductType != 5 && (byte)x.Taxable != 2 && x.ExtPrice != null && x.ExtPrice != 0);
                    if (linediscounts.Count() == 0)
                        return true;
                    lineDiscount = (((decimal)linediscounts.Where(x => x.ExtPrice != null).Sum(x => x.ExtPrice) / itemTotal) * Discount) / linediscounts.Count();
                    taxTotal = linediscounts.Where(x => x.ExtPrice != null).Sum(x => ((decimal)x.ExtPrice - lineDiscount) * (decimal)x.EffectiveRate);
                }
                else
                {
                    linediscounts = linediscounts.Where(x => (bool)x.Refund == false && x.IgnoreTax == false && x.Voided == null && x.Comped == false && (byte)x.Taxable == 0);
                    try
                    {
                        lineDiscount = (((decimal)linediscounts.Where(x => x.ExtPrice != null).Sum(x => x.ExtPrice) / itemTotal) * Discount) / linediscounts.Count();
                    }
                    catch (Exception ex)
                    { }
                    taxTotal = linediscounts.Where(x => x.ExtPrice != null).Sum(x => ((decimal)x.ExtPrice - lineDiscount) * (decimal)x.EffectiveRate);
                }
            }
            else
            {
                linediscounts = linediscounts.Where(x => (bool)x.Refund == false && x.Voided == null && x.Comped == false && (byte)x.Taxable == 0 && x.ExtPrice != null && x.ExtPrice != 0);
                try
                {
                    lineDiscount = (((decimal)linediscounts.Where(x => x.ExtPrice != null).Sum(x => x.ExtPrice) / itemTotal) * Discount) / linediscounts.Count();
                }
                catch (Exception ex)
                { }
                taxTotal = linediscounts.Where(x => x.ExtPrice != null).Sum(x => ((decimal)x.ExtPrice - lineDiscount) * (decimal)x.EffectiveRate);
            }

            if (g.setTaxGratuity)
                taxTotal += ((decimal)order.Gratuity * (decimal)g.setGratuityTaxRate);

            taxTotal= Math.Round(taxTotal, 2, MidpointRounding.AwayFromZero);
                
            return true;
        }
*/
    }
  