import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent {
  @Input() tabs: string[] = [];
  @Input() selectedTab: string = '';

  @Output() selectedTabChange = new EventEmitter<string>();

  selectTab(tab: string) {
    this.selectedTab = tab;
    this.selectedTabChange.emit(tab);
  }
}
