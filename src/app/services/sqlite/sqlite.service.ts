import { Injectable } from "@angular/core";
import { Employee } from "~/app/models/employees";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { CategoryCode, Product, ProductCategory, Area, Table, MenuCategory, MenuSubCategory, MenuProduct, TableDetail, ChoiceOption, ForcedModifier } from "~/app/models/products";
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
//import { Observable } from "tns-core-modules/ui/page/page";

var Sqlite = require("nativescript-sqlite");

@Injectable()
export class SQLiteService {

    private static database: any;
    public categories: Array<any>;
    public products: Array<any>;
    private apiUrl = "http://a2zpos.azurewebsites.net/DBService.svc/";
    //, private http: HttpClient
    public loggedInUser: Employee = Object();

    public static isInstantiated: boolean;

    public constructor(private http: HttpClient) {
        /*
        require("nativescript-localstorage");
        let loggedInUser: string = localStorage.getItem("loggedInUser");
        if (loggedInUser != null)
            this.loggedInUser = JSON.parse(loggedInUser);
        */
        if (!SQLiteService.isInstantiated) {
            (new Sqlite("FullServiceDining.db")).then(db => {
                SQLiteService.database = db;
                SQLiteService.isInstantiated = true;
                console.log("FullServiceDining DB opened.");

                db.execSQL("CREATE TABLE IF NOT EXISTS Employees (EmployeeID TEXT PRIMARY KEY, FirstName TEXT);").then(id => {
                    console.log("Employees table created");
                    this.getRecordCount('Employees');
                }, error => {
                    console.log("CREATE TABLE Employees ERROR", error);
                });

                db.execSQL("CREATE TABLE IF NOT EXISTS CategoryCodes (PriKey INTEGER PRIMARY KEY, CategoryCode1 TEXT, Description TEXT, PrintGroup INTEGER);").then(id => {
                    console.log("categorycodes table created");
                    this.getRecordCount('CategoryCodes');
                }, error => {
                    console.log("CREATE TABLE CategoryCodes ERROR", error);
                });

                db.execSQL("CREATE TABLE IF NOT EXISTS Products (ProductName TEXT, ProductFilter INTEGER, UnitPrice REAL ,PrintCode TEXT,Taxable INTEGER,CategoryCode INTEGER,ProductGroup INTEGER,PrintCode1 TEXT,CouponCode TEXT,GeneralCode TEXT,Description TEXT,AutoOption TEXT,PrintName TEXT,ForcedModifier TEXT,UseForcedModifier INTEGER,ShowAutoOption INTEGER,UseUnitPrice2 INTEGER,UnitPrice2 REAL,Toppings INTEGER,Pizza INTEGER,ProductType TEXT,TaxRate TEXT,PromptQuantity TEXT,ModifierIgnoreQuantity TEXT,FractionalQuantity INTEGER);").then(id => {
                    console.log("Products table created");
                    this.getRecordCount('Products');
                }, error => {
                    console.log("CREATE TABLE Products ERROR", error);
                });

                db.execSQL("CREATE TABLE IF NOT EXISTS ProductCategories (PriKey INTEGER PRIMARY KEY, ProductFilter INTEGER, Category INTEGER, SubCategory INTEGER, Position INTEGER, ButtonColor TEXT, ButtonForeColor TEXT);").then(id => {
                    console.log("ProductCategories table created");
                    this.getRecordCount('ProductCategories');
                }, error => {
                    console.log("CREATE TABLE CategoryCodes ERROR", error);
                });

                db.execSQL("CREATE TABLE IF NOT EXISTS Areas (AreaID INTEGER, Name TEXT, Position INTEGER, ImageURL TEXT);").then(id => {
                    console.log("Table Areas created");
                    this.getRecordCount('Areas');
                }, error => {
                    console.log("CREATE TABLE Areas ERROR", error);
                });

                db.execSQL("CREATE TABLE IF NOT EXISTS Tables (AreaID INTEGER, Name TEXT, Height INTEGER, Width INTEGER, PosX INTEGER, PosY INTEGER, TableType INTEGER);").then(id => {
                    this.getRecordCount('Tables');
                }, error => {
                    console.log("CREATE TABLE Tables ERROR", error);
                });

                db.execSQL("CREATE TABLE IF NOT EXISTS MenuCategories (CategoryID INTEGER, Name TEXT, Position INTEGER, ButtonColor INTEGER, ButtonColorHex TEXT, ButtonForeColor INTEGER, ButtonForeColorHex TEXT);").then(id => {
                    console.log("Tables MenuCategories created");
                    this.getRecordCount('MenuCategories');
                }, error => {
                    console.log("CREATE TABLE MenuCategories ERROR", error);
                });

                db.execSQL("CREATE TABLE IF NOT EXISTS MenuSubCategories (CategoryID INTEGER, SubCategoryID INTEGER, Name TEXT, Position INTEGER, ButtonColor INTEGER, ButtonColorHex TEXT, ButtonForeColor INTEGER, ButtonForeColorHex TEXT);").then(id => {
                    console.log("Tables MenuSubCategories created");
                    this.getRecordCount('MenuSubCategories');
                }, error => {
                    console.log("CREATE TABLE MenuSubCategories ERROR", error);
                });

                db.execSQL("CREATE TABLE IF NOT EXISTS MenuProducts (CategoryID INTEGER, SubCategoryID INTEGER,ProductID INTEGER,Name TEXT,Position INTEGER,ProductCode INTEGER,ButtonColor INTEGER,ButtonColorHex TEXT,ButtonForeColor INTEGER, ButtonForeColorHex TEXT);").then(id => {
                    console.log("Tables Products created");
                    this.getRecordCount('MenuProducts');
                }, error => {
                    console.log("CREATE TABLE Products ERROR", error);
                });

                db.execSQL("CREATE TABLE IF NOT EXISTS ForcedModifiers (ProductCode INTEGER, OptionCode INTEGER, Charge REAL, Layer INTEGER, Position INTEGER,ForcedOption INTEGER,OptionFilter INTEGER, ChoiceName TEXT,ReportProductMix INTEGER);").then(id => {
                    console.log("Table ForcedModifier screated");
                    this.getRecordCount('ForcedModifiers');
                }, error => {
                    console.log("CREATE TABLE ForcedModifier ERROR", error);
                });

                db.execSQL("CREATE TABLE IF NOT EXISTS ChoiceOptions (PriKey INTEGER, Name TEXT, Price REAL, PrintName TEXT, CategoryCode INTEGER);").then(id => {
                    console.log("Table ChoiceOptions created");
                    this.getRecordCount('ChoiceOptions');
                }, error => {
                    console.log("CREATE TABLE ChoiceOptions ERROR", error);
                });

            }, error => {
                console.log("OPEN DB ERROR", error);
            });
        }
    }

    padZeroes(num: string, size: number): string {
        let s = num;
        while (s.length < size) s = "0" + s;
        return s;
    }

    public getMenuCategories() {
        console.log('getMenuCategories');

        let headers = this.createRequestHeader();
        this.http.get(this.apiUrl + 'GetMenuCategory', { headers: headers })
            .subscribe(
                data => {
                    console.log('got MenuCategories from API');
                    this.loadMenuCategories(<MenuCategory[]>data);
                },
                err => {
                    console.log("Error occured while retrieving MenuCategories from API.");
                    console.log(err);
                }
            );

    }

    public loadMenuCategories(menuCategories: any[]) {
        menuCategories.forEach(function (menuCategory: MenuCategory) {
            SQLiteService.database.execSQL("INSERT INTO MenuCategories (CategoryID, Name, Position, ButtonColor, ButtonForeColor) VALUES (?, ?, ?, ?, ?)",
                [menuCategory.CategoryID, menuCategory.Name, menuCategory.Position,
                menuCategory.ButtonColor, menuCategory.ButtonForeColor]);
            console.log('added ' + menuCategory.Name);
        }
        );
    }

    public getLocalMenuCategories(): Promise<MenuCategory[]> {
        let that = this;
        return SQLiteService.database.all("SELECT CategoryID, Name, Position, ButtonColor, ButtonColorHex, ButtonForeColor, ButtonForeColorHex FROM MenuCategories ORDER BY Position")
            .then(function (rows) {
                let menuCategories: MenuCategory[] = [];
                for (var row in rows) {
                    menuCategories.push({
                        CategoryID: rows[row][0],
                        Name: rows[row][1],
                        Position: rows[row][2],
                        ButtonColor: rows[row][3],
                        ButtonColorHex: that.padZeroes(parseInt(rows[row][3]).toString(16), 6),
                        ButtonForeColor: rows[row][5],
                        ButtonForeColorHex: that.padZeroes(parseInt(rows[row][5]).toString(16), 6)
                    });
                }
                return (menuCategories);
            });
    }

    public getMenuSubCategories() {
        console.log('getMenuSubCategories');

        let headers = this.createRequestHeader();
        this.http.get(this.apiUrl + 'GetMenuSubCategory', { headers: headers })
            .subscribe(
                data => {
                    console.log('got MenuSubCategories from API');
                    this.loadMenuSubCategories(<MenuSubCategory[]>data);
                },
                err => {
                    console.log("Error occured while retrieving MenuSubCategories from API.");
                    console.log(err);
                }
            );

    }

    public loadMenuSubCategories(MenuSubCategories: any[]) {
        MenuSubCategories.forEach(function (menuSubCategory: MenuSubCategory) {
            SQLiteService.database.execSQL("INSERT INTO MenuSubCategories (CategoryID, SubCategoryID, Name, Position, ButtonColor, ButtonForeColor) VALUES (?, ?, ?, ?, ?, ?)",
                [menuSubCategory.CategoryID, menuSubCategory.SubCategoryID, menuSubCategory.Name, menuSubCategory.Position, menuSubCategory.ButtonColor, menuSubCategory.ButtonForeColor]);
            console.log('added ' + menuSubCategory.Name + ':' + menuSubCategory.CategoryID);
        }
        );
    }

    public getLocalMenuSubCategories(categoryID: number): Promise<MenuSubCategory[]> {

        let that = this;
        //SQLiteService.database.execSQL("DROP TABLE IF EXISTS MenuSubCategories;");
        return SQLiteService.database.all("SELECT CategoryID, SubCategoryID, Name, Position, ButtonColor, ButtonColorHex, ButtonForeColor, ButtonForeColorHex FROM MenuSubCategories WHERE CategoryID=? ORDER BY Position", [categoryID])
            .then(function (rows) {
                let menuSubCategories: MenuSubCategory[] = [];
                for (var row in rows) {
                    menuSubCategories.push({
                        CategoryID: rows[row][0],
                        SubCategoryID: rows[row][1],
                        Name: rows[row][2],
                        Position: rows[row][3],
                        ButtonColor: rows[row][4],
                        ButtonColorHex: that.padZeroes(parseInt(rows[row][4]).toString(16), 6),
                        ButtonForeColor: rows[row][6],
                        ButtonForeColorHex: that.padZeroes(parseInt(rows[row][6]).toString(16), 6)
                    });
                }
                return (menuSubCategories);
            });
    }

    public getMenuProducts() {
        console.log('getMenuProducts');

        let headers = this.createRequestHeader();
        this.http.get(this.apiUrl + 'GetMenuProduct', { headers: headers })
            .subscribe(
                data => {
                    console.log('got MenuProducts from API: ' + data);
                    this.loadMenuProducts(<MenuProduct[]>data);
                },
                err => {
                    console.log("Error occured while retrieving MenuProducts from API.");
                    console.log(err);
                }
            );

    }

    public loadMenuProducts(MenuProducts: any[]) {
        let that = this;
        MenuProducts.forEach(function (menuProduct: MenuProduct) {
            SQLiteService.database.execSQL("INSERT INTO MenuProducts (CategoryID, SubCategoryID, ProductID, Name, Position, ProductCode, ButtonColor, ButtonColorHex, ButtonForeColor, ButtonForeColorHex) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [menuProduct.CategoryID, menuProduct.SubCategoryID, menuProduct.ProductID, menuProduct.Name, menuProduct.ProductCode, menuProduct.Position,
                menuProduct.ButtonColor, that.padZeroes(parseInt(menuProduct.ButtonColor.toString()).toString(16), 6),
                menuProduct.ButtonForeColor, that.padZeroes(parseInt(menuProduct.ButtonForeColor.toString()).toString(16), 6)]);
        }
        );
    }

    public getLocalMenuProducts(categoryID: number, subCategoryID: number): Promise<MenuProduct[]> {

        let that = this;

        return SQLiteService.database.all("SELECT mp.CategoryID, mp.SubCategoryID, mp.ProductId, mp.Name, mp.Position, mp.ProductCode, mp.ButtonColor, mp.ButtonColorHex, mp.ButtonForeColor, mp.ButtonForeColorHex, p.UnitPrice FROM MenuProducts AS mp INNER JOIN Products AS p ON mp.ProductId=p.ProductFilter WHERE mp.CategoryID=? AND mp.SubCategoryID=? ORDER BY mp.Position", [categoryID, subCategoryID])
            .then(function (rows) {
                let menuProducts: MenuProduct[] = [];
                for (var row in rows) {
                    menuProducts.push({
                        CategoryID: rows[row][0],
                        SubCategoryID: rows[row][1],
                        ProductID: rows[row][2],
                        Name: rows[row][3],
                        Position: rows[row][4],
                        ProductCode: rows[row][5],
                        ButtonColor: rows[row][6],
                        ButtonColorHex: rows[row][7],
                        ButtonForeColor: rows[row][8],
                        ButtonForeColorHex: rows[row][9],
                        UnitPrice: rows[row][10]
                    });
                }
                return (menuProducts);
            });
    }

    public getChoiceOptions() {
        let headers = this.createRequestHeader();
        this.http.get(this.apiUrl + 'GetOption', { headers: headers })
            .subscribe(
                data => {
                    console.log('got Options from API: ' + data);
                    this.loadChoiceOptions(<ChoiceOption[]>data);
                },
                err => {
                    console.log("Error occured while retrieving Options from API.");
                    console.log(err);
                }
            );

    }

    public loadChoiceOptions(choiceOptions: any[]) {
        let that = this;
        choiceOptions.forEach(function (choiceOption: ChoiceOption) {
            SQLiteService.database.execSQL("INSERT INTO ChoiceOptions (PriKey, Name,Price,PrintName,CategoryCode) VALUES (?, ?, ?, ?, ?)",
                [choiceOption.PriKey, choiceOption.Name,choiceOption.Price,choiceOption.PrintName,choiceOption.CategoryCode]);
        }
        );
    }

    public getForcedModifiers() {
        let headers = this.createRequestHeader();
        this.http.get(this.apiUrl + 'GetOption', { headers: headers })
            .subscribe(
                data => {
                    console.log('got Options from API: ' + data);
                    this.loadForcedModifiers(<ForcedModifier[]>data);
                },
                err => {
                    console.log("Error occured while retrieving Options from API.");
                    console.log(err);
                }
            );

    }

    public loadForcedModifiers(forcedModifiers: any[]) {
        let that = this;
        forcedModifiers.forEach(function (forcedModifier: ForcedModifier) {
            SQLiteService.database.execSQL("INSERT INTO ForcedModifiers (Charge, ChoiceName,ForcedOption,Layer,OptionCode, OptionFilter, Position,ProductCode,ReportProductMix) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ? )",
                [forcedModifier.Charge, forcedModifier.ChoiceName,forcedModifier.ForcedOption,forcedModifier.Layer,forcedModifier.OptionCode,
                 forcedModifier.OptionFilter, forcedModifier.Position,forcedModifier.ProductCode,forcedModifier.ReportProductMix]);
        }
        );
    }

    public getEmployees() {
        console.log('getEmployees');

        let headers = this.createRequestHeader();
        this.http.get(this.apiUrl + 'GetEmployees', { headers: headers })
            .subscribe(
                data => {
                    console.log('got employees from API');
                    this.loadEmployees(<Employee[]>data);
                },
                err => {
                    console.log("Error occured while retrieving employees from API.");
                    console.log(err);
                }
            );

    }

    public loadEmployees(employees: any[]) {
        employees.forEach(function (employee: Employee) {
            SQLiteService.database.execSQL("INSERT INTO employees (EmployeeID, FirstName) VALUES (?, ?)", [employee.EmployeeID, employee.FirstName]);
            //console.log('added ' + employee.FirstName);
        }
        );
    }

    public getCategoryCodes() {
        let headers = this.createRequestHeader();
        this.http.get(this.apiUrl + 'GetCategoryCodes', { headers: headers })
            .subscribe(
                data => {
                    console.log('got Category Codes from API');
                    this.loadCategoryCodes(<CategoryCode[]>data);
                },
                err => {
                    console.log("Error occured while retrieving category codes from API.");
                    console.log(err);
                }
            );
    }

    public loadCategoryCodes(categoryCodes: any[]) {
        categoryCodes.forEach(function (categoryCode: CategoryCode) {
            SQLiteService.database.execSQL("INSERT INTO CategoryCodes (PriKey, CategoryCode1, Description, PrintGroup) VALUES (?, ?, ?, ?)",
                [categoryCode.PriKey, categoryCode.CategoryCode1, categoryCode.Description, categoryCode.PrintGroup]);
        }
        );
    }

    public getProducts() {
        let headers = this.createRequestHeader();
        this.http.get(this.apiUrl + 'GetProducts', { headers: headers })
            .subscribe(
                data => {
                    console.log('got Products from API');
                    this.loadProducts(<Product[]>data);
                },
                err => {
                    console.log("Error occured while retrieving products from API.");
                    console.log(err);
                }
            );
    }

    public loadProducts(products: any[]) {
        products.forEach(function (product: Product) {
            SQLiteService.database.execSQL("INSERT INTO Products (ProductName, ProductFilter,UnitPrice,PrintCode,Taxable,CategoryCode,ProductGroup,PrintCode1,CouponCode,GeneralCode,Description,AutoOption,PrintName,ForcedModifier,UseForcedModifier,ShowAutoOption,UseUnitPrice2,UnitPrice2,Toppings,Pizza,ProductType,TaxRate,PromptQuantity,ModifierIgnoreQuantity,FractionalQuantity) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                [product.ProductName,
                product.ProductFilter,
                product.UnitPrice,
                product.PrintCode,
                product.Taxable,
                product.CategoryCode,
                product.ProductGroup,
                product.PrintCode1,
                product.CouponCode,
                product.GeneralCode,
                product.Description,
                product.AutoOption,
                product.PrintName,
                product.ForcedModifier,
                product.UseForcedModifier,
                product.ShowAutoOption,
                product.UseUnitPrice2,
                product.UnitPrice2,
                product.Toppings,
                product.Pizza,
                product.ProductType,
                product.TaxRate,
                product.PromptQuantity,
                product.ModifierIgnoreQuantity,
                product.FractionalQuantity]);
        }
        );
    }

    public getAreas() {
        let headers = this.createRequestHeader();
        this.http.get(this.apiUrl + 'Getareas2', { headers: headers })
            .subscribe(
                data => {
                    console.log('got Areas2 from API' + data);
                    this.loadAreas(<Area[]>data);
                },
                err => {
                    console.log("Error occured while retrieving Areas from API.");
                    console.log(err);
                }
            );
    }

    public loadAreas(areas: any[]) {

        areas.forEach(function (area: Area) {
            SQLiteService.database.execSQL("INSERT INTO Areas (AreaID, Name, Position, ImageURL) VALUES (?,?,?,?)",
                [area.AreaID, area.Name, area.Position, area.ImageURL]).then(id => {
                    console.log('added ' + area.ImageURL + ' to Areas');
                });
        });

    }

    public getLocalAreas(): Promise<Area[]> {
        let sql: string = "SELECT * FROM Areas;"
        return SQLiteService.database.all(sql)
            .then(function (rows) {
                console.log("SELECT * FROM Areas;");
                let areas: Area[] = [];
                for (var row in rows) {
                    areas.push({
                        AreaID: rows[row][0],
                        Name: rows[row][1],
                        Position: rows[row][2],
                        ImageURL: rows[row][3],
                    });
                }
                return (areas);
            });
    }

    getBase64IntArray(arr: number[]) {
        return btoa(JSON.stringify(arr))
    }

    public getTables() {
        let headers = this.createRequestHeader();
        this.http.get(this.apiUrl + 'GetTableLayout', { headers: headers })
            .subscribe(
                data => {
                    console.log('got Tables from API');
                    this.loadTables(<Table[]>data);
                },
                err => {
                    console.log("Error occured while retrieving Tables from API.");
                    console.log(err);
                }
            );
    }

    public loadTables(tables: any[]) {
        tables.forEach(function (table: Table) {
            SQLiteService.database.execSQL("INSERT INTO Tables (AreaID,  Name, Height, Width, PosX, PosY, TableType) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [table.AreaID, table.Name, table.Height, table.Width, table.PosX, table.PosY, table.TableType]);
        }
        );
    }

    public getTablesDetails(areaID: number, employeeID: number, serverViewAll: boolean): Observable<any> {
        let headers = this.createRequestHeader();
        return this.http.get(this.apiUrl + 'GetTableDetail?AreaId=' + areaID + '&EmployeeID=' + employeeID,
            { headers: headers }).pipe(map(res => res));
    }

    public getLocalTables(areaID: number): Promise<Table[]> {

        return SQLiteService.database.all("SELECT AreaID, Name, Height, Width, PosX, PosY FROM Tables WHERE AreaID =?", [areaID])
            .then(function (rows) {
                let tables: Table[] = [];
                for (var row in rows) {
                    tables.push({
                        AreaID: rows[row][0],
                        Name: rows[row][1],
                        Height: rows[row][2],
                        Width: rows[row][3],
                        PosX: rows[row][4],
                        PosY: rows[row][5]
                    });
                }
                return (tables);
            });
    }

    /*
        private loadTablesDetails(tables) : TableDetail[]
        {
            let tablesDetails: TableDetail[] = [];
    
            tables.forEach(function (tableDetail: TableDetail) {
                
            });
    
            return (tablesDetails);
          
        }
    */
    public getProductCategories() {
        let headers = this.createRequestHeader();
        this.http.get(this.apiUrl + 'GetProductCategories', { headers: headers })
            .subscribe(
                data => {
                    console.log('got ProductCategories from API');
                    this.loadProductCategories(<ProductCategory[]>data);
                },
                err => {
                    console.log("Error occured while retrieving ProductCategories from API.");
                    console.log(err);
                }
            );
    }

    public loadProductCategories(productCategories: any[]) {
        let sql: string = "";
        productCategories.forEach(function (productCategory: ProductCategory) {
            SQLiteService.database.execSQL("INSERT INTO ProductCategories (PriKey, ProductFilter, Category, SubCategory, Position, ButtonColor, ButtonForeColor) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [productCategory.PriKey, productCategory.Category, productCategory.SubCategory, productCategory.Position,
                parseInt(productCategory.ButtonColor).toString(16), parseInt(productCategory.ButtonForeColor).toString(16)]);
        }
        );
    }

    public getEmployee(employeeID: string): Promise<any> {
        return SQLiteService.database.get("SELECT EmployeeID, FirstName FROM employees WHERE EmployeeID=?", [employeeID])
            .then(function (employee) {
                return (employee);
            });
    }

    public login(employeeID: string): Observable<any> {
        let headers = this.createRequestHeader();
        return this.http.get(this.apiUrl + 'login?EmployeeID=' + employeeID,
            { headers: headers }).pipe(map(res => res));
    }

    public logoff(): Observable<any> {
        let headers = this.createRequestHeader();
        return this.http.get(this.apiUrl + 'logoff?EmployeeID=' + this.loggedInUser.PriKey,
            { headers: headers }).pipe(map(res => res));
    }

    public getLocalCategoryCodes(): Promise<CategoryCode[]> {
        return SQLiteService.database.all("SELECT PriKey, Description FROM CategoryCodes;")
            .then(function (rows) {
                let categoryCodes: CategoryCode[] = [];
                for (var row in rows) {
                    categoryCodes.push({
                        PriKey: rows[row][0],
                        Description: rows[row][1]
                    });
                }
                return (categoryCodes);
            });
    }

    public getLocalProducts(categoryCodeKey: number): Promise<Product[]> {
        return SQLiteService.database.all("SELECT ProductName, UnitPrice FROM Products WHERE CategoryCode =?", [categoryCodeKey])
            .then(function (rows) {
                let products: Product[] = [];
                for (var row in rows) {
                    products.push({
                        ProductName: rows[row][0],
                        UnitPrice: rows[row][1]
                    });
                }
                return (products);
            });
    }

    public getRecordCount(tableName): Promise<number> {
        let that = this; // needed to access 'this' from callback    

        return SQLiteService.database.all('SELECT * FROM ' + tableName)
            .then(function (rows) {
                console.log(tableName + " row:", rows);
                // only load data if table is empty
                if (rows == "")
                    switch (tableName) {
                        case 'Employees': {
                            that.getEmployees();
                            break;
                        }
                        case 'CategoryCodes': {
                            that.getCategoryCodes();
                            break;
                        }
                        case 'Products': {
                            that.getProducts();
                            break;
                        }
                        case 'ProductCategories':
                            {
                                that.getProductCategories();
                                break;
                            }
                        case 'Areas':
                            {
                                that.getAreas();
                                break;
                            }
                        case 'Tables':
                            {
                                that.getTables();
                                break;
                            }
                        case 'MenuCategories':
                            {
                                that.getMenuCategories();
                                break;
                            }
                        case 'MenuSubCategories':
                            {
                                that.getMenuSubCategories();
                                break;
                            }
                        case 'MenuProducts':
                            {
                                that.getMenuProducts();
                                break;
                            }
                        case 'ForcedModifiers':
                            {
                                that.getForcedModifiers();
                                break;
                            }
                        case 'ChoiceOptions':
                            {
                                that.getChoiceOptions();
                                break;
                            }
                    }
            });
    }

    public getAllEmployees() {
        var promise = SQLiteService.database.all('SELECT * FROM employees;');
        promise.then(function (resultSet) {
            console.log("Result set is:", resultSet);
        });
    }

    public dropTables() {
        var promise = SQLiteService.database.execSQL('DROP TABLE IF EXISTS MenuCategories;');
        promise.then(function (resultSet) {
            console.log("Result set is:", resultSet);
        });

        var promise = SQLiteService.database.execSQL('DROP TABLE IF EXISTS MenuSubCategories;');
        promise.then(function (resultSet) {
            console.log("Result set is:", resultSet);
        });

        var promise = SQLiteService.database.execSQL('DROP TABLE IF EXISTS Products;');
        promise.then(function (resultSet) {
            console.log("Result set is:", resultSet);
        });
    }

    private createRequestHeader() {
        let headers = new HttpHeaders({
            "AuthKey": "my-key",
            "AuthToken": "my-token",
            "Content-Type": "application/json"
        });

        return headers;
    }
}