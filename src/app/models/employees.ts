export interface Employee {
    PriKey: number,
    EmployeeID: string;
    FirstName: string;   
    AccessType?: AccessType;    
}

export interface LoginResponse {
    AccessType: AccessType;
    PriKey: number;
    Cashout: boolean;
}

export enum AccessType
{
    NotFound = -1,
    NotClockedIn = -2, 
    AlreadyLoggedIn = -3,
    Manager = 1,
    WaitStaff = 2, 
    Hostess = 3
}    