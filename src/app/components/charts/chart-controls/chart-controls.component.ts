import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faChartBar, 
  faChartPie,
  faBullseye,
  faClock,
  faList
} from '@fortawesome/free-solid-svg-icons';

export type StatisticType = 'accuracy' | 'performance';
export type VisualizationType = 'bar' | 'pie';

export interface ChartSelection {
  statistic: StatisticType;
  visualization: VisualizationType;
}

@Component({
  selector: 'app-chart-controls',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  template: `
    <div class="chart-controls">
      <!-- Statistic Selector -->
      <div class="control-group">
        <label>Métrica:</label>
        <select 
          [(ngModel)]="selectedStatistic" 
          (change)="onSelectionChange()"
          class="statistic-select">
          @for (stat of statisticOptions; track stat.value) {
            <option [value]="stat.value">{{ stat.label }}</option>
          }
        </select>
      </div>

      <!-- Visualization Type Selector -->
      <div class="control-group">
        <label>Tipo:</label>
        <div class="visualization-buttons">
          @for (viz of getAvailableVisualizations(); track viz.value) {
            <button
              type="button"
              class="viz-button"
              [class.active]="selectedVisualization === viz.value"
              (click)="setVisualization(viz.value)"
              [title]="viz.label">
              <fa-icon [icon]="viz.icon"></fa-icon>
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-controls {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 8px 12px;
      background: #f8f9fa;
      border-radius: 6px;
      border: 1px solid #e9ecef;
      margin-bottom: 12px;
    }

    .control-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    label {
      font-size: 0.8rem;
      font-weight: 500;
      color: #495057;
      white-space: nowrap;
    }

    .statistic-select {
      padding: 4px 8px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 0.8rem;
      background: white;
      min-width: 120px;
    }

    .visualization-buttons {
      display: flex;
      gap: 2px;
    }

    .viz-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      border: 1px solid #ced4da;
      background: white;
      color: #6c757d;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.9rem;

      &:first-child {
        border-radius: 4px 0 0 4px;
      }

      &:last-child {
        border-radius: 0 4px 4px 0;
      }

      &:only-child {
        border-radius: 4px;
      }

      &:not(:first-child) {
        border-left: none;
      }

      &:hover {
        background: #e9ecef;
        color: #495057;
      }

      &.active {
        background: #007bff;
        border-color: #007bff;
        color: white;
      }
    }

    @media (max-width: 768px) {
      .chart-controls {
        flex-direction: column;
        gap: 8px;
        align-items: stretch;
      }

      .control-group {
        justify-content: space-between;
      }

      .statistic-select {
        min-width: 0;
        flex: 1;
      }
    }
  `]
})
export class ChartControlsComponent {
  @Input() selectedStatistic: StatisticType = 'accuracy';
  @Input() selectedVisualization: VisualizationType = 'bar';
  @Output() selectionChanged = new EventEmitter<ChartSelection>();

  // FontAwesome icons
  faChartBar = faChartBar;
  faChartPie = faChartPie;
  faBullseye = faBullseye;
  faClock = faClock;
  faList = faList;

  statisticOptions = [
    { value: 'accuracy' as StatisticType, label: 'Resultados en %' },
    { value: 'performance' as StatisticType, label: 'Resultados en respuestas totales' }
  ];

  visualizationOptions = [
    { value: 'bar' as VisualizationType, label: 'Gráfico de barras', icon: this.faChartBar },
    { value: 'pie' as VisualizationType, label: 'Gráfico circular', icon: this.faChartPie }
  ];

  setVisualization(type: VisualizationType) {
    this.selectedVisualization = type;
    this.onSelectionChange();
  }

  onSelectionChange() {
    // Reset to bar chart if current visualization is not available for new statistic
    const availableViz = this.getAvailableVisualizations();
    if (!availableViz.find(v => v.value === this.selectedVisualization)) {
      this.selectedVisualization = 'bar';
    }
    
    this.selectionChanged.emit({
      statistic: this.selectedStatistic,
      visualization: this.selectedVisualization
    });
  }

  getAvailableVisualizations() {
    // Pie chart only makes sense for performance (distribution of answers)
    // For accuracy and time, bar chart is better to show per-section breakdown
    if (this.selectedStatistic === 'performance') {
      return this.visualizationOptions;
    } else {
      // Only bar chart for accuracy and time metrics
      return this.visualizationOptions.filter(v => v.value === 'bar');
    }
  }
}