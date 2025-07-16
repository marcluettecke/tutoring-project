import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faChartBar, 
  faChartPie, 
  faChartLine, 
  faClock,
  faBullseye,
  faChartArea,
  IconDefinition
} from '@fortawesome/free-solid-svg-icons';

export type ChartType = 'accuracy' | 'performance' | 'time' | 'distribution' | 'trends' | 'comparison';

export interface ChartOption {
  type: ChartType;
  name: string;
  icon: IconDefinition;
  description: string;
  enabled: boolean;
}

@Component({
  selector: 'app-chart-selector',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="chart-selector">
      <h4>Seleccionar gráficos a mostrar:</h4>
      <div class="chart-options">
        @for (option of chartOptions; track option.type) {
          <div 
            class="chart-option"
            [class.enabled]="option.enabled"
            [class.disabled]="!option.enabled"
            (click)="toggleChart(option.type)"
            [title]="option.description">
            <div class="option-icon">
              <fa-icon [icon]="option.icon"></fa-icon>
            </div>
            <div class="option-content">
              <div class="option-name">{{ option.name }}</div>
              <div class="option-description">{{ option.description }}</div>
            </div>
            <div class="option-toggle">
              <input 
                type="checkbox" 
                [checked]="option.enabled"
                (change)="toggleChart(option.type)"
                readonly>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .chart-selector {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    h4 {
      margin: 0 0 1rem 0;
      color: #495057;
      font-size: 1rem;
      font-weight: 600;
    }

    .chart-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 0.75rem;
    }

    .chart-option {
      display: flex;
      align-items: center;
      padding: 0.75rem;
      background: white;
      border: 2px solid #e9ecef;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .chart-option:hover {
      border-color: #007bff;
      box-shadow: 0 2px 4px rgba(0, 123, 255, 0.1);
    }

    .chart-option.enabled {
      border-color: #007bff;
      background: #f8f9ff;
    }

    .chart-option.disabled {
      opacity: 0.6;
    }

    .option-icon {
      margin-right: 0.75rem;
      color: #007bff;
      font-size: 1.2rem;
    }

    .option-content {
      flex: 1;
    }

    .option-name {
      font-weight: 600;
      color: #212529;
      margin-bottom: 0.25rem;
    }

    .option-description {
      font-size: 0.85rem;
      color: #6c757d;
    }

    .option-toggle {
      margin-left: 0.5rem;
    }

    input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
  `]
})
export class ChartSelectorComponent {
  @Input() enabledCharts: Set<ChartType> = new Set(['accuracy', 'performance']);
  @Output() chartsChanged = new EventEmitter<Set<ChartType>>();

  // FontAwesome icons
  faChartBar = faChartBar;
  faChartPie = faChartPie;
  faChartLine = faChartLine;
  faClock = faClock;
  faBullseye = faBullseye;
  faChartArea = faChartArea;

  chartOptions: ChartOption[] = [
    {
      type: 'accuracy',
      name: 'Precisión por sección',
      icon: faBullseye,
      description: 'Porcentaje de respuestas correctas por sección',
      enabled: true
    },
    {
      type: 'performance',
      name: 'Rendimiento general',
      icon: faChartBar,
      description: 'Comparación de correctas vs incorrectas',
      enabled: true
    },
    {
      type: 'time',
      name: 'Tiempo por sección',
      icon: faClock,
      description: 'Tiempo promedio empleado por sección',
      enabled: false
    },
    {
      type: 'distribution',
      name: 'Distribución de respuestas',
      icon: faChartPie,
      description: 'Distribución circular de tipos de respuestas',
      enabled: false
    },
    {
      type: 'trends',
      name: 'Tendencias de rendimiento',
      icon: faChartLine,
      description: 'Evolución del rendimiento a lo largo del tiempo',
      enabled: false
    },
    {
      type: 'comparison',
      name: 'Comparación detallada',
      icon: faChartArea,
      description: 'Comparación directa entre sesiones',
      enabled: false
    }
  ];

  ngOnInit() {
    // Initialize chart options based on enabled charts
    this.chartOptions.forEach(option => {
      option.enabled = this.enabledCharts.has(option.type);
    });
  }

  toggleChart(chartType: ChartType) {
    const option = this.chartOptions.find(opt => opt.type === chartType);
    if (option) {
      option.enabled = !option.enabled;
      
      if (option.enabled) {
        this.enabledCharts.add(chartType);
      } else {
        this.enabledCharts.delete(chartType);
      }
      
      this.chartsChanged.emit(new Set(this.enabledCharts));
    }
  }
}