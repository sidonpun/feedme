import { Component } from '@angular/core';
import { HeaderComponent } from './header.component';
import { ContentComponent } from './content.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, ContentComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Feedme Angular';
}
