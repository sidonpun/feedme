import { Component } from '@angular/core';

@Component({
  selector: 'app-hello',
  standalone: true,
  templateUrl: './hello.component.html',
  styleUrls: ['./hello.component.css'],
})
export class HelloComponent {
  count = 0;

  onClick(): void {
    this.count++;
  }
}
