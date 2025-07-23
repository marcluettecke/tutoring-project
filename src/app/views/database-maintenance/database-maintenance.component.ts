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
  backupData: any = null;
  backupTimestamp = '';

  constructor(private maintenanceService: DatabaseMaintenanceService) {}

  ngOnInit(): void {
    // Initial message
    this.showMessage('Utiliza esta página para mantener la base de datos de preguntas.', 'info');
  }

  async createBackup(): Promise<void> {
    this.isLoading = true;
    this.showMessage('Creando copia de seguridad...', 'info');
    
    try {
      const result = await this.maintenanceService.backupQuestions();
      this.backupData = result.data;
      this.backupTimestamp = result.timestamp;
      
      this.showMessage(`Copia de seguridad creada con éxito: ${result.data.length} preguntas`, 'success');
      
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
    
    const dataStr = JSON.stringify(this.backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `questions-backup-${this.backupTimestamp.replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
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
      this.showMessage('Error al corregir las subsecciones', 'error');
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