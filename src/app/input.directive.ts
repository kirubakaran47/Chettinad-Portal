import { Directive, HostBinding, HostListener, ElementRef, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[jxInput]'
})
export class InputDirective {

  @HostListener('blur') onblur() {
    let oldValue = parseFloat((this.el.nativeElement as HTMLInputElement).value);
    (this.el.nativeElement as HTMLInputElement).value = oldValue.toFixed(2);
  }

 @HostListener('keydown', ['$event']) public onKeyup(event: KeyboardEvent): void {
   if((this.el.nativeElement as HTMLInputElement).value.includes(".")){
  let splits = (this.el.nativeElement as HTMLInputElement).value.split(".");
    let oldValue = (this.el.nativeElement as HTMLInputElement).value;
     console.log(oldValue);
    console.log(splits[1]);
    if(splits[1].length >= 2){
        (this.el.nativeElement as HTMLInputElement).value = parseFloat(oldValue).toFixed(2);
    }
    console.log((this.el.nativeElement as HTMLInputElement).value);
   }
  
    }
    
  constructor(private el: ElementRef) { }



}