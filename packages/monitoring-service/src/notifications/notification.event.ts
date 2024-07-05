export class Notification {

    static PREFIX = "notify";
    constructor(private typeSuffix: string) {}
    
    type() {
        return `${Notification.PREFIX}.${this.typeSuffix}`;
    }

}