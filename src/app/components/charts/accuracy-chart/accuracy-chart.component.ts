import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartDataset } from 'chart.js';
import { BaseChartComponent } from '../base-chart/base-chart.component';
import { SectionProgressData } from '../../../models/progress.model';
import { formatSpanishPercentage } from '../../../utils/number-format.utils';
import { getSectionBackgroundColors, getSectionBorderColors } from '../../../constants/chart-colors';

@Component({
  selector: 'app-accuracy-chart',
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
export class AccuracyChartComponent implements OnChanges {
  @Input() data: SectionProgressData[] = [];
  @Input() title: string = 'Resultados en %';
  @Input() subtitle?: string;
  @Input() height: string = '300px';
  @Input() chartType: string = 'bar';
  @Input() comparisonData?: SectionProgressData[];
  @Input() comparisonLabel?: string;

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
      console.error('Error generating accuracy chart:', error);
      this.error = 'Error al generar el gráfico de precisión';
    }
  }

  private generateBarChart() {
    const labels = this.data.map(item => this.getSectionDisplayName(item.sectionName));
    const accuracyData = this.data.map(item => this.calculateAccuracy(item));
    const sectionNames = this.data.map(item => item.sectionName);

    const datasets: ChartDataset<'bar', number[]>[] = [
      {
        label: 'Precisión (%)',
        data: accuracyData,
        backgroundColor: getSectionBackgroundColors(sectionNames),
        borderColor: getSectionBorderColors(sectionNames),
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false
      }
    ];

    // Add comparison data if provided
    if (this.comparisonData && this.comparisonData.length > 0) {
      const comparisonAccuracy = this.comparisonData.map(item => this.calculateAccuracy(item));
      datasets.push({
        label: this.comparisonLabel || 'Comparación (%)',
        data: comparisonAccuracy,
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false
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
                const sectionData = this.data[dataIndex];
                if (sectionData) {
                  return [
                    `${context.dataset.label}: ${formatSpanishPercentage(context.parsed.y, 1)}`,
                    `Correctas: ${sectionData.correctAnswers}`,
                    `Total: ${sectionData.questionsAnswered}`
                  ];
                }
                return `${context.dataset.label}: ${formatSpanishPercentage(context.parsed.y, 1)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            },
            title: {
              display: true,
              text: 'Precisión (%)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Secciones'
            }
          }
        }
      }
    };
  }

  private generatePieChart() {
    // Check if this is overall data (single total section) for correct/incorrect pie
    if (this.data.length === 1 && this.data[0].sectionName === 'total') {
      this.generateCorrectIncorrectPie();
      return;
    }

    // Regular section-based pie chart
    const labels = this.data.map(item => this.getSectionDisplayName(item.sectionName));
    const accuracyData = this.data.map(item => this.calculateAccuracy(item));
    const sectionNames = this.data.map(item => item.sectionName);

    this.chartConfig = {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data: accuracyData,
            backgroundColor: getSectionBackgroundColors(sectionNames),
            borderColor: getSectionBorderColors(sectionNames),
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
                const dataIndex = context.dataIndex;
                const sectionData = this.data[dataIndex];
                if (sectionData) {
                  return [
                    `${context.label}: ${formatSpanishPercentage(context.parsed, 1)}`,
                    `Correctas: ${sectionData.correctAnswers}`,
                    `Total: ${sectionData.questionsAnswered}`
                  ];
                }
                return `${context.label}: ${formatSpanishPercentage(context.parsed, 1)}`;
              }
            }
          }
        }
      }
    };
  }

  private generateCorrectIncorrectPie() {
    const totalData = this.data[0];
    const correctAnswers = totalData.correctAnswers;
    const incorrectAnswers = totalData.incorrectAnswers;
    const total = correctAnswers + incorrectAnswers;

    this.chartConfig = {
      type: 'pie',
      data: {
        labels: ['Correctas', 'Incorrectas'],
        datasets: [
          {
            data: [correctAnswers, incorrectAnswers],
            backgroundColor: [
              'rgba(75, 192, 192, 0.8)',
              'rgba(255, 99, 132, 0.8)'
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)',
              'rgba(255, 99, 132, 1)'
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
                const value = context.parsed;
                const percentage = total > 0 ? formatSpanishPercentage((value / total) * 100, 1) : formatSpanishPercentage(0, 1);
                return [
                  `${context.label}: ${value}`,
                  `Porcentaje: ${percentage}%`
                ];
              }
            }
          }
        }
      }
    };
  }


  private calculateAccuracy(section: SectionProgressData): number {
    if (section.questionsAnswered === 0) return 0;
    return (section.correctAnswers / section.questionsAnswered) * 100;
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