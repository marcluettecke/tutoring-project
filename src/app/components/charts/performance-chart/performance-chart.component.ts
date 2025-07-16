import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartComponent } from '../base-chart/base-chart.component';
import { SectionProgressData } from '../../../models/progress.model';

@Component({
  selector: 'app-performance-chart',
  standalone: true,
  imports: [CommonModule, BaseChartComponent],
  template: `
    <div class="chart-wrapper">
      <h5 class="chart-title">
        {{ title }}
        @if (subtitle) {
          <span class="chart-subtitle">{{ subtitle }}</span>
        }
      </h5>
      <app-base-chart 
        [config]="chartConfig" 
        [height]="height"
        [loading]="loading"
        [error]="error">
      </app-base-chart>
    </div>
  `,
  styles: [`
    .chart-wrapper {
      margin-bottom: 1.5rem;
    }

    .chart-title {
      margin: 0 0 1rem 0;
      color: #495057;
      font-size: 1.1rem;
      font-weight: 600;
      text-align: center;
    }

    .chart-subtitle {
      display: block;
      font-size: 0.85rem;
      font-weight: 400;
      color: #6c757d;
      margin-top: 0.25rem;
    }
  `]
})
export class PerformanceChartComponent implements OnChanges {
  @Input() data: SectionProgressData[] = [];
  @Input() title: string = 'Rendimiento por Sección';
  @Input() subtitle?: string;
  @Input() height: string = '300px';
  @Input() chartType: string = 'bar';

  chartConfig!: ChartConfiguration;
  loading: boolean = false;
  error: string | null = null;

  ngOnChanges(changes: SimpleChanges) {
    // Regenerate chart when chartType changes
    if (changes['chartType'] || changes['data']) {
      this.generateChartConfig();
    }
  }

  private generateChartConfig() {
    try {
      // Force new config object to trigger change detection
      const prevConfig = this.chartConfig;
      
      if (this.chartType === 'pie') {
        this.generatePieChart();
      } else {
        this.generateBarChart();
      }
      
      // Force change detection by creating new reference
      if (prevConfig === this.chartConfig) {
        this.chartConfig = { ...this.chartConfig };
      }
    } catch (error) {
      console.error('Error generating performance chart:', error);
      this.error = 'Error al generar el gráfico de rendimiento';
    }
  }

  private generateBarChart() {
    const labels = this.data.map(item => this.getSectionDisplayName(item.sectionName));
    const correctData = this.data.map(item => item.correctAnswers);
    const incorrectData = this.data.map(item => item.incorrectAnswers);
    const blankData = this.data.map(item => item.blankAnswers || 0);

    this.chartConfig = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Correctas',
            data: correctData,
            backgroundColor: 'rgba(40, 167, 69, 0.8)',
            borderColor: 'rgba(40, 167, 69, 1)',
            borderWidth: 1
          },
          {
            label: 'Incorrectas',
            data: incorrectData,
            backgroundColor: 'rgba(220, 53, 69, 0.8)',
            borderColor: 'rgba(220, 53, 69, 1)',
            borderWidth: 1
          },
          {
            label: 'En blanco',
            data: blankData,
            backgroundColor: 'rgba(108, 117, 125, 0.8)',
            borderColor: 'rgba(108, 117, 125, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = correctData[context.dataIndex] + 
                            incorrectData[context.dataIndex] + 
                            blankData[context.dataIndex];
                const percentage = total > 0 ? ((context.parsed.y / total) * 100).toFixed(1) : '0.0';
                return `${context.dataset.label}: ${context.parsed.y} (${percentage}%)`;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Secciones'
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: true,
              text: 'Número de preguntas'
            }
          }
        }
      }
    };
  }

  private generatePieChart() {
    // Calculate totals across all sections
    const totals = this.data.reduce(
      (acc, item) => ({
        correct: acc.correct + item.correctAnswers,
        incorrect: acc.incorrect + item.incorrectAnswers,
        blank: acc.blank + (item.blankAnswers || 0)
      }),
      { correct: 0, incorrect: 0, blank: 0 }
    );

    this.chartConfig = {
      type: 'pie',
      data: {
        labels: ['Correctas', 'Incorrectas', 'En blanco'],
        datasets: [
          {
            data: [totals.correct, totals.incorrect, totals.blank],
            backgroundColor: [
              'rgba(40, 167, 69, 0.8)',
              'rgba(220, 53, 69, 0.8)',
              'rgba(108, 117, 125, 0.8)'
            ],
            borderColor: [
              'rgba(40, 167, 69, 1)',
              'rgba(220, 53, 69, 1)',
              'rgba(108, 117, 125, 1)'
            ],
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = totals.correct + totals.incorrect + totals.blank;
                const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0.0';
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
    };
  }


  private getSectionDisplayName(sectionName: string): string {
    const displayNames: { [key: string]: string } = {
      'administrativo': 'Administrativo',
      'medio ambiente': 'Medio Ambiente',
      'costas': 'Costas',
      'aguas': 'Aguas',
      'total': 'Total'
    };
    return displayNames[sectionName] || sectionName;
  }
}