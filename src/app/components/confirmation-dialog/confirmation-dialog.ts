import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirmation-dialog',
  imports: [MatButtonModule],
  styleUrl: './confirmation-dialog.scss',
  templateUrl: './confirmation-dialog.html',
})
export class ConfirmationDialog {

  title = input.required<string>();
  message = input.required<string>();

  confirmed = output<void>();
  cancelled = output<void>();

}
