class FormControl {
  constructor(value){ this.value = value; }
  setValue(next){ this.value = next; }
  markAsDirty(){}
  markAsTouched(){}
}
class Component {
  constructor(){
    this.form={
      controls:{
        flagCodes:new FormControl([]),
        packagingRequired:new FormControl(false),
        spoilsAfterOpening:new FormControl(false),
      }
    };
  }
  areArraysEqual(left,right){
    if(left.length!==right.length) return false;
    left=[...left].sort();
    right=[...right].sort();
    return left.every((v,i)=>v===right[i]);
  }
  syncFlagCodesFromLinkedControls(){
    const control = this.form.controls.flagCodes;
    const current = control.value ?? [];
    const baseFlags = new Set(current);
    baseFlags.delete('pack');
    baseFlags.delete('spoil_open');
    if(this.form.controls.packagingRequired.value){
      baseFlags.add('pack');
    }
    if(this.form.controls.spoilsAfterOpening.value){
      baseFlags.add('spoil_open');
    }
    const next = Array.from(baseFlags);
    if(!this.areArraysEqual(current,next)){
      control.setValue(next);
    }
  }
  syncLinkedBooleanControls(flags){
    const requiresPackaging = flags.includes('pack');
    const spoilsAfterOpen = flags.includes('spoil_open');
    if(this.form.controls.packagingRequired.value !== requiresPackaging){
      this.form.controls.packagingRequired.setValue(requiresPackaging);
      this.syncFlagCodesFromLinkedControls();
    }
    if(this.form.controls.spoilsAfterOpening.value !== spoilsAfterOpen){
      this.form.controls.spoilsAfterOpening.setValue(spoilsAfterOpen);
      this.syncFlagCodesFromLinkedControls();
    }
  }
  toggleFlag(code){
    const control = this.form.controls.flagCodes;
    const current = control.value ?? [];
    const index = current.indexOf(code);
    const next = index>=0 ? [...current.slice(0,index), ...current.slice(index+1)] : [...current, code];
    if(!this.areArraysEqual(current, next)){
      control.setValue(next);
      this.syncLinkedBooleanControls(next);
    }
  }
}
const comp = new Component();
comp.toggleFlag('temp');
console.log('after temp', comp.form.controls.flagCodes.value);
comp.toggleFlag('fragile');
console.log('after fragile', comp.form.controls.flagCodes.value);
comp.toggleFlag('pack');
console.log('after pack', comp.form.controls.flagCodes.value);
comp.toggleFlag('pack');
console.log('after pack off', comp.form.controls.flagCodes.value);
comp.toggleFlag('spoil_open');
console.log('after spoil', comp.form.controls.flagCodes.value);
