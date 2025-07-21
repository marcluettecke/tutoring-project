import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faExchangeAlt, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { ChartControlsComponent, StatisticType, VisualizationType, ChartSelection } from '../chart-controls/chart-controls.component';
import { AccuracyChartComponent } from '../accuracy-chart/accuracy-chart.component';
import { PerformanceChartComponent } from '../performance-chart/performance-chart.component';
import { TimeChartComponent } from '../time-chart/time-chart.component';
import { SectionProgressData, TestSession } from '../../../models/progress.model';
import { ChartDataService } from '../../../services/chart-data.service';

@Component({
  selector: 'app-charts-container',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    ChartControlsComponent,
    AccuracyChartComponent,
    PerformanceChartComponent,
    TimeChartComponent
  ],
  template: `
    <div class="charts-container">
      <!-- Compact Chart Controls -->
      <app-chart-controls
        [selectedStatistic]="selectedStatistic"
        [selectedVisualization]="selectedVisualization"
        (selectionChanged)="onChartSelectionChanged($event)">
      </app-chart-controls>

      <!-- Charts Display -->
      <div class="charts-display">
        @if (comparisonMode === 'compare' && selectedSession && canCompare) {
          <!-- Comparison Mode: Two columns side by side -->
          <div class="comparison-layout">
            <div class="comparison-column">
              <h4 class="column-title">Primera sesión</h4>
              <div class="chart-content">
                @if (selectedStatistic === 'accuracy') {
                  <app-accuracy-chart
                    [data]="currentData"
                    [title]="'Precisión por sección'"
                    [chartType]="selectedVisualization"
                    [height]="'400px'">
                  </app-accuracy-chart>
                } @else if (selectedStatistic === 'performance') {
                  <app-performance-chart
                    [data]="currentData"
                    [title]="'Distribución de respuestas'"
                    [chartType]="selectedVisualization"
                    [height]="'400px'"
                    [isProgressTracking]="isProgressTracking">
                  </app-performance-chart>
                } @else if (selectedStatistic === 'time') {
                  <app-time-chart
                    [data]="currentData"
                    [title]="'Tiempo por sección'"
                    [chartType]="selectedVisualization"
                    [height]="'400px'">
                  </app-time-chart>
                }
              </div>
            </div>
            
            <div class="comparison-column">
              <h4 class="column-title">Segunda sesión</h4>
              <div class="chart-content">
                @if (selectedStatistic === 'accuracy') {
                  <app-accuracy-chart
                    [data]="selectedData"
                    [title]="'Precisión por sección'"
                    [chartType]="selectedVisualization"
                    [height]="'400px'">
                  </app-accuracy-chart>
                } @else if (selectedStatistic === 'performance') {
                  <app-performance-chart
                    [data]="selectedData"
                    [title]="'Distribución de respuestas'"
                    [chartType]="selectedVisualization"
                    [height]="'400px'"
                    [isProgressTracking]="isProgressTracking">
                  </app-performance-chart>
                } @else if (selectedStatistic === 'time') {
                  <app-time-chart
                    [data]="selectedData"
                    [title]="'Tiempo por sección'"
                    [chartType]="selectedVisualization"
                    [height]="'400px'">
                  </app-time-chart>
                }
              </div>
            </div>
          </div>
        } @else {
          <!-- Individual Mode: Single chart -->
          <div class="single-chart-layout">
            @if (selectedStatistic === 'accuracy') {
              <app-accuracy-chart
                [data]="displayData"
                [title]="'Precisión por Sección'"
                [subtitle]="getChartSubtitle()"
                [chartType]="selectedVisualization"
                [height]="'500px'">
              </app-accuracy-chart>
            } @else if (selectedStatistic === 'performance') {
              <app-performance-chart
                [data]="displayData"
                [title]="'Distribución de Respuestas'"
                [subtitle]="getChartSubtitle()"
                [chartType]="selectedVisualization"
                [height]="'500px'"
                [isProgressTracking]="isProgressTracking">
              </app-performance-chart>
            } @else if (selectedStatistic === 'time') {
              <app-time-chart
                [data]="displayData"
                [title]="'Tiempo por Sección'"
                [subtitle]="getChartSubtitle()"
                [chartType]="selectedVisualization"
                [height]="'500px'">
              </app-time-chart>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .charts-container {
      width: 100%;
    }

    .charts-display {
      margin-top: 1.5rem;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .comparison-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .comparison-column {
      min-width: 0; /* Prevents overflow */
    }

    .column-title {
      margin: 0 0 1rem 0;
      padding: 0.75rem;
      background: #e9ecef;
      border-radius: 6px;
      text-align: center;
      color: #495057;
      font-size: 1rem;
      font-weight: 600;
    }

    .comparison-mode .charts-grid {
      grid-template-columns: 1fr;
    }

    .no-charts-message {
      text-align: center;
      padding: 3rem 1rem;
      color: #6c757d;
    }

    .no-charts-message fa-icon {
      color: #dee2e6;
      margin-bottom: 1rem;
    }

    .no-charts-message h4 {
      margin: 1rem 0 0.5rem 0;
      color: #495057;
    }

    .no-charts-message p {
      margin: 0;
      font-size: 0.9rem;
    }

    @media (max-width: 1200px) {
      .comparison-layout {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
      
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ChartsContainerComponent implements OnChanges {
  @Input() currentData: SectionProgressData[] = [];
  @Input() previousSessions: TestSession[] = [];
  @Input() selectedSessionId: string = 'current';
  @Input() selectedSession: TestSession | null = null;
  @Input() showComparison: boolean = true;
  @Input() comparisonMode: 'individual' | 'compare' | 'overlay' = 'individual';
  @Input() canCompare: boolean = false;
  @Input() comparisonTooltip: string = '';
  @Input() isProgressTracking: boolean = false;

  // Chart configuration
  selectedStatistic: StatisticType = 'accuracy';
  selectedVisualization: VisualizationType = 'bar';
  
  // Display data
  displayData: SectionProgressData[] = [];
  selectedData: SectionProgressData[] = [];
  comparisonData: SectionProgressData[] = [];

  // FontAwesome icons
  faExchangeAlt = faExchangeAlt;
  faChartLine = faChartLine;

  constructor(private chartDataService: ChartDataService) {}

  ngOnChanges() {
    this.updateDisplayData();
  }

  @Output() sessionChanged: EventEmitter<string> = new EventEmitter<string>();
  @Output() comparisonModeChanged: EventEmitter<'individual' | 'compare'> = new EventEmitter<'individual' | 'compare'>();

  onChartSelectionChanged(selection: ChartSelection) {
    this.selectedStatistic = selection.statistic;
    this.selectedVisualization = selection.visualization;
    // Don't reset comparison mode or session selection when chart type changes
  }

  private updateDisplayData() {
    // Always use currentData as the primary data source
    this.displayData = this.currentData;
    
    // Set selected data for comparison mode
    if (this.comparisonMode === 'compare' && this.selectedSession) {
      this.selectedData = this.chartDataService.convertSessionToChartData(this.selectedSession);
    } else {
      this.selectedData = [];
    }
    
    this.comparisonData = [];
  }


  formatSessionForDropdown(session: TestSession): string {
    return this.chartDataService.formatSessionForDropdown(session);
  }

  getChartSubtitle(): string {
    return 'Análisis de sesión';
  }
}