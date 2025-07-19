import { Component, ElementRef, Input, OnDestroy, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Chart,
  ChartConfiguration,
  registerables
} from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-base-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container" [style.height]="height">
      <canvas #chartCanvas></canvas>
      @if (loading) {
        <div class="chart-loading">
          <div class="loading-spinner"></div>
          <p>Cargando gráfico...</p>
        </div>
      }
      @if (error) {
        <div class="chart-error">
          <p>Error al cargar el gráfico</p>
          <small>{{ error }}</small>
        </div>
      }
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      width: 100%;
      background: white;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    canvas {
      width: 100% !important;
      height: 100% !important;
    }

    .chart-loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      z-index: 10;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .chart-error {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: #dc3545;
      z-index: 10;
    }

    .chart-loading p,
    .chart-error p {
      margin: 0;
      color: #6c757d;
      font-size: 0.9rem;
    }

    .chart-error small {
      color: #dc3545;
      font-size: 0.8rem;
    }
  `]
})
export class BaseChartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() config!: ChartConfiguration;
  @Input() height: string = '300px';
  @Input() loading: boolean = false;
  @Input() error: string | null = null;

  protected chart: Chart | null = null;

  ngOnInit() {
    if (this.config && !this.loading && !this.error && !this.chart) {
      this.createChart();
    }
  }

  ngOnDestroy() {
    this.destroyChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['config'] && this.config && !this.loading && !this.error) {
      // Always recreate chart when config changes to handle type changes properly
      this.createChart();
    }
  }

  private createChart() {
    try {
      // Ensure any existing chart is destroyed first
      this.destroyChart();
      
      const ctx = this.chartCanvas.nativeElement.getContext('2d');
      if (ctx) {
        this.chart = new Chart(ctx, this.config);
      }
    } catch (error) {
      console.error('Error creating chart:', error);
      this.error = 'Error al crear el gráfico';
    }
  }


  private destroyChart() {
    if (this.chart) {
      try {
        this.chart.destroy();
      } catch (error) {
        console.warn('Error destroying chart:', error);
      } finally {
        this.chart = null;
      }
    }
  }
}