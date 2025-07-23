import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseMaintenanceService, SubsectionAnalysis } from '../../services/database-maintenance.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDatabase, faDownload, faSearch, faWrench, faExclamationTriangle, faCheckCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-database-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './database-maintenance.component.html',
  styleUrls: ['./database-maintenance.component.scss']
})
export class DatabaseMaintenanceComponent implements OnInit {
  // Icons
  faDatabase = faDatabase;
  faDownload = faDownload;
  faSearch = faSearch;
  faWrench = faWrench;
  faExclamationTriangle = faExclamationTriangle;
  faCheckCircle = faCheckCircle;
  faInfoCircle = faInfoCircle;

  // State
  isLoading = false;
  message = '';
  messageType: 'success' | 'error' | 'info' = 'info';
  
  // Analysis results
  analysis: SubsectionAnalysis | null = null;
  
  // Backup data
  backupData: Record<string, unknown>[] | null = null;
  backupTimestamp = '';

  constructor(private maintenanceService: DatabaseMaintenanceService) {}

  ngOnInit(): void {
    // Initial message
    this.showMessage('Utiliza esta página para mantener la base de datos de preguntas.', 'info');
  }

  async verifyTotalCount(): Promise<void> {
    this.isLoading = true;
    this.showMessage('Verificando total de preguntas...', 'info');
    
    try {
      const totalCount = await this.maintenanceService.getTotalQuestionCount();
      this.showMessage(`Total de preguntas en la base de datos: ${totalCount}`, 'info');
      
      // If analysis was already run, compare counts
      if (this.analysis) {
        if (totalCount !== this.analysis.totalQuestions) {
          this.showMessage(
            `ADVERTENCIA: Discrepancia - Total real: ${totalCount}, Análisis muestra: ${this.analysis.totalQuestions}`, 
            'error'
          );
        }
      }
    } catch (error) {
      console.error('Error verifying count:', error);
      this.showMessage('Error al verificar el total de preguntas', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  async createBackup(): Promise<void> {
    this.isLoading = true;
    this.showMessage('Creando copia de seguridad...', 'info');
    
    try {
      const result = await this.maintenanceService.backupQuestions();
      this.backupData = result.data;
      this.backupTimestamp = result.timestamp;
      
      // Verify the count matches
      const totalInDb = result.totalCount;
      const backupCount = result.data.length;
      
      if (totalInDb !== backupCount) {
        this.showMessage(`ADVERTENCIA: Discrepancia en el conteo - DB: ${totalInDb}, Backup: ${backupCount}`, 'error');
      } else {
        this.showMessage(`Copia de seguridad creada con éxito: ${backupCount} preguntas`, 'success');
      }
      
      // Trigger download
      this.downloadBackup();
    } catch (error) {
      console.error('Error creating backup:', error);
      this.showMessage('Error al crear la copia de seguridad', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  downloadBackup(): void {
    if (!this.backupData) return;
    
    try {
      // For large datasets, use minimal JSON formatting
      const dataStr = JSON.stringify(this.backupData);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `questions-backup-${this.backupTimestamp.replace(/[:.]/g, '-')}.json`;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Use timeout to ensure browser processes the download
      setTimeout(() => {
        link.click();
        document.body.removeChild(link);
        // Clean up the URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }, 0);
      
      this.showMessage(`Descargando backup con ${this.backupData.length} preguntas...`, 'info');
    } catch (error) {
      console.error('Error downloading backup:', error);
      this.showMessage('Error al descargar el backup. Por favor, intenta de nuevo.', 'error');
    }
  }

  async analyzeSubsections(): Promise<void> {
    this.isLoading = true;
    this.showMessage('Analizando subsecciones...', 'info');
    
    try {
      this.analysis = await this.maintenanceService.analyzeSubsections();
      
      const issueCount = this.analysis.duplicateGroups.length + this.analysis.capitalizationIssues.length;
      if (issueCount > 0) {
        this.showMessage(`Análisis completo: ${issueCount} problemas encontrados`, 'error');
      } else {
        this.showMessage('Análisis completo: No se encontraron problemas', 'success');
      }
    } catch (error) {
      console.error('Error analyzing subsections:', error);
      this.showMessage('Error al analizar las subsecciones', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  async fixSubsections(dryRun: boolean = true): Promise<void> {
    this.isLoading = true;
    const action = dryRun ? 'Simulando' : 'Aplicando';
    this.showMessage(`${action} correcciones...`, 'info');
    
    try {
      const result = await this.maintenanceService.fixSubsections(dryRun);
      
      if (dryRun) {
        this.showMessage(`Simulación completa: ${result.updated} preguntas serían actualizadas`, 'info');
      } else {
        this.showMessage(result.message, 'success');
        // Re-run analysis after fix
        await this.analyzeSubsections();
      }
    } catch (error) {
      console.error('Error fixing subsections:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.showMessage(`Error al corregir las subsecciones: ${errorMessage}`, 'error');
    } finally {
      this.isLoading = false;
    }
  }

  private showMessage(text: string, type: 'success' | 'error' | 'info'): void {
    this.message = text;
    this.messageType = type;
  }

  getUniqueCapitalizationIssues() {
    if (!this.analysis) return [];
    
    // Remove duplicates based on current + suggested combination
    const seen = new Set<string>();
    return this.analysis.capitalizationIssues.filter(issue => {
      const key = `${issue.current}::${issue.suggested}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}