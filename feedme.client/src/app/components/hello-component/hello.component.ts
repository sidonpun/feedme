import { Component } from '@angular/core'
import { count } from 'rxjs';

@Component({
  selector: 'hello-component',
  standalone: true,
  styleUrls: ['./hello.component.css'],
  templateUrl: './hello.component.html',
})

export class HelloComponent {
  count: number = 0;
  OnClick() {
    this.count++;
  }
}
