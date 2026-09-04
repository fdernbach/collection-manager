import { ChangeDetectionStrategy, Component, model, output, OutputDecorator, OutputEmitterRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule],
  selector: 'app-search-bar',
  styleUrl: './search-bar.scss',
  templateUrl: './search-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBar {
  
  search = model("Initial");
  searchButtonClicked: OutputEmitterRef<void> = output<void>({
    alias: 'submit'
  });

  searchClicked() {
    this.searchButtonClicked.emit();
  }

}
