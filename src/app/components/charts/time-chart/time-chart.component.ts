import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartType, ChartDataset } from 'chart.js';
import { BaseChartComponent } from '../base-chart/base-chart.component';
import { SectionProgressData } from '../../../models/progress.model';

@Component({
  selector: 'app-time-chart',
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
export class TimeChartComponent implements OnChanges {
  @Input() data: SectionProgressData[] = [];
  @Input() title: string = 'Tiempo por Sección';
  @Input() subtitle?: string;
  @Input() height: string = '300px';
  @Input() chartType: string = 'bar';
  @Input() showAvgTimePerQuestion: boolean = true;

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
      // Check if we have any time data
      const hasTimeData = this.data.some(item => (item.timeSpent || 0) > 0);
      
      if (!hasTimeData) {
        this.error = 'Los datos de tiempo no están disponibles para exámenes de prueba. Esta funcionalidad está disponible durante las sesiones de práctica con seguimiento de progreso activado.';
        return;
      }
      
      this.error = null; // Clear any previous error
      
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
      console.error('Error generating time chart:', error);
      this.error = 'Error al generar el gráfico de tiempo';
    }
  }

  private generateBarChart() {
    const labels = this.data.map(item => this.getSectionDisplayName(item.sectionName));
    const totalTimeData = this.data.map(item => this.convertToMinutes(item.timeSpent || 0));
    const avgTimeData = this.data.map(item => this.calculateAvgTimePerQuestion(item));

    const datasets: ChartDataset<'bar', number[]>[] = [
      {
        label: 'Tiempo total (minutos)',
        data: totalTimeData,
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        yAxisID: 'y'
      }
    ];

    if (this.showAvgTimePerQuestion) {
      datasets.push({
        label: 'Tiempo promedio por pregunta (seg)',
        data: avgTimeData,
        backgroundColor: 'rgba(255, 206, 86, 0.8)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 2,
        yAxisID: 'y1'
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
        interaction: {
          mode: 'index',
          intersect: false
        },
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
                
                if (context.datasetIndex === 0) {
                  // Total time
                  const totalSeconds = sectionData.timeSpent || 0;
                  return [
                    `Tiempo total: ${this.formatTime(totalSeconds)}`,
                    `Preguntas: ${sectionData.questionsAnswered}`
                  ];
                } else {
                  // Average time per question
                  const avgSeconds = this.calculateAvgTimePerQuestion(sectionData);
                  return `Promedio por pregunta: ${avgSeconds.toFixed(1)}s`;
                }
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Secciones'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: true,
            title: {
              display: true,
              text: 'Tiempo total (minutos)'
            }
          },
          ...(this.showAvgTimePerQuestion ? {
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              beginAtZero: true,
              title: {
                display: true,
                text: 'Tiempo promedio (segundos)'
              },
              grid: {
                drawOnChartArea: false
              }
            }
          } : {})
        }
      }
    };
  }

  private generatePieChart() {
    // Calculate total time across all sections
    const totalTime = this.data.reduce((sum, item) => sum + (item.timeSpent || 0), 0);
    
    this.chartConfig = {
      type: 'pie',
      data: {
        labels: this.data.map(item => this.getSectionDisplayName(item.sectionName)),
        datasets: [
          {
            data: this.data.map(item => this.convertToMinutes(item.timeSpent || 0)),
            backgroundColor: [
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(255, 99, 132, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)'
            ],
            borderColor: [
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(255, 99, 132, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)'
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
                const dataIndex = context.dataIndex;
                const sectionData = this.data[dataIndex];
                const timeInMinutes = this.convertToMinutes(sectionData.timeSpent || 0);
                const percentage = totalTime > 0 ? ((sectionData.timeSpent || 0) / totalTime * 100).toFixed(1) : '0.0';
                return [
                  `${context.label}: ${timeInMinutes.toFixed(1)} min (${percentage}%)`,
                  `Preguntas: ${sectionData.questionsAnswered}`
                ];
              }
            }
          }
        }
      }
    };
  }


  private convertToMinutes(timeInMilliseconds: number): number {
    return timeInMilliseconds / (1000 * 60);
  }

  private calculateAvgTimePerQuestion(section: SectionProgressData): number {
    if (section.questionsAnswered === 0) return 0;
    const timeInSeconds = (section.timeSpent || 0) / 1000;
    return timeInSeconds / section.questionsAnswered;
  }

  private formatTime(timeInMilliseconds: number): string {
    const totalSeconds = Math.floor(timeInMilliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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