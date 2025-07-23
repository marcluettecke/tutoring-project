import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddQuestionComponent } from '../add-question/add-question.component';
import { DatabaseMaintenanceComponent } from '../database-maintenance/database-maintenance.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faShieldAlt, faPlus, faDatabase } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, AddQuestionComponent, DatabaseMaintenanceComponent],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss']
})
export class AdminPanelComponent implements OnInit {
  // Icons
  faShieldAlt = faShieldAlt;
  faPlus = faPlus;
  faDatabase = faDatabase;

  // Active tab
  activeTab: 'add-questions' | 'database-maintenance' = 'add-questions';

  ngOnInit(): void {
    // Check if there's a saved tab preference
    const savedTab = localStorage.getItem('adminPanelActiveTab');
    if (savedTab && this.isValidTab(savedTab)) {
      this.activeTab = savedTab as 'add-questions' | 'database-maintenance';
    }
  }

  setActiveTab(tab: 'add-questions' | 'database-maintenance'): void {
    this.activeTab = tab;
    // Save tab preference
    localStorage.setItem('adminPanelActiveTab', tab);
  }

  private isValidTab(tab: string): boolean {
    return ['add-questions', 'database-maintenance'].includes(tab);
  }
}