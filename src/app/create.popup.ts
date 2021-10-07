import {Component} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {HttpClient} from "@angular/common/http";
import {MatDialogRef} from "@angular/material/dialog";


@Component({
  selector: 'dialog-elements-example-dialog',
  template: `
    <h1 mat-dialog-title>Dialog with elements</h1>
    <div mat-dialog-content>
      <form [formGroup]="options" (ngSubmit)="onSubmit()" #myForm="ngForm">
        <mat-form-field>
          <mat-label>Athlete</mat-label>
          <input matInput required type="text" formControlName="athlete"/>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Age</mat-label>
          <input matInput required type="number" formControlName="age"/>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Country</mat-label>
          <input matInput required type="text" formControlName="country"/>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Sport</mat-label>
          <input matInput required type="text" formControlName="sport"/>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Gold</mat-label>
          <input matInput required type="text" formControlName="gold"/>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Silver</mat-label>
          <input matInput required type="text" formControlName="silver"/>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Bronze</mat-label>
          <input matInput required type="text" formControlName="bronze"/>
        </mat-form-field>
        <div>
          <button mat-raised-button type="submit" [disabled]="!myForm.valid">Submit</button>
          <button mat-raised-button mat-dialog-close>Close</button>
        </div>
      </form>
    </div>

  `
})
export class DialogElementsExampleDialog {
  options: FormGroup;

  constructor(
    fb: FormBuilder,
    private http: HttpClient,
    private dialogRef: MatDialogRef<DialogElementsExampleDialog>
) {
    this.options = fb.group({
      athlete: new FormControl('', [Validators.required]),
      age: new FormControl('', [Validators.required]),
      country: new FormControl('', [Validators.required]),
      sport: new FormControl('', [Validators.required]),
      gold: new FormControl('', [Validators.required]),
      silver: new FormControl('', [Validators.required]),
      bronze: new FormControl('', [Validators.required]),
    });
  }

  public onSubmit() {
    this.dialogRef.close(this.options.value);
  }
}
