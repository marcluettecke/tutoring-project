import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration } from 'chart.js';
import { BaseChartComponent } from '../base-chart/base-chart.component';
import { SectionProgressData } from '../../../models/progress.model';
import { formatSpanishPercentage } from '../../../utils/number-format.utils';

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
  @Input() title: string = 'Resultados en respuestas totales';
  @Input() subtitle?: string;
  @Input() height: string = '300px';
  @Input() chartType: string = 'bar';
  @Input() isProgressTracking: boolean = false;

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

    // Prepare datasets - exclude blank for practice mode
    const datasets = [
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
      }
    ];

    // Only add blank data for test mode (not progress tracking)
    if (!this.isProgressTracking) {
      datasets.push({
        label: 'En blanco',
        data: blankData,
        backgroundColor: 'rgba(108, 117, 125, 0.8)',
        borderColor: 'rgba(108, 117, 125, 1)',
        borderWidth: 1
      });
    }

    this.chartConfig = {
      type: 'bar',
      data: {
        labels,
        datasets
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
                const dataIndex = context.dataIndex;
                const correct = correctData[dataIndex];
                const incorrect = incorrectData[dataIndex];
                const blank = !this.isProgressTracking ? blankData[dataIndex] : 0;
                const total = correct + incorrect + blank;
                const percentage = total > 0 ? formatSpanishPercentage((context.parsed.y / total) * 100, 1) : formatSpanishPercentage(0, 1);
                return `${context.dataset.label}: ${context.parsed.y} (${percentage})`;
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

    // Prepare data and labels based on mode
    const labels: string[] = ['Correctas', 'Incorrectas'];
    const data: number[] = [totals.correct, totals.incorrect];
    const backgroundColor: string[] = [
      'rgba(40, 167, 69, 0.8)',
      'rgba(220, 53, 69, 0.8)'
    ];
    const borderColor: string[] = [
      'rgba(40, 167, 69, 1)',
      'rgba(220, 53, 69, 1)'
    ];

    // Only include blank data for test mode (not progress tracking)
    if (!this.isProgressTracking) {
      labels.push('En blanco');
      data.push(totals.blank);
      backgroundColor.push('rgba(108, 117, 125, 0.8)');
      borderColor.push('rgba(108, 117, 125, 1)');
    }

    this.chartConfig = {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor,
            borderColor,
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
                const total = !this.isProgressTracking 
                  ? totals.correct + totals.incorrect + totals.blank
                  : totals.correct + totals.incorrect;
                const percentage = total > 0 ? formatSpanishPercentage((context.parsed / total) * 100, 1) : formatSpanishPercentage(0, 1);
                return `${context.label}: ${context.parsed} (${percentage})`;
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