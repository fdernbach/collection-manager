import { ChangeDetectionStrategy, Component, model } from '@angular/core';
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

}
