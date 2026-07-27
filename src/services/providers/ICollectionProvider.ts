import {
  CollectionSourceConfig,
  DriveFolderItem,
  DriveSourceCandidate,
  GoogleWorkspaceBinding,
} from '../../domain/types';

export interface CollectionMetrics {
  totalResponses: number;
  lastResponseDate: string | null;
  collabResponses: number;
  managerResponses: number;
  participationRate: number;
  hasManagerResponse: boolean;
  isReadyForTabulation: boolean;
}

export interface CollectionRawData {
  collabRows: Array<Record<string, any>>;
  managerRows: Array<Record<string, any>>;
}

/**
 * Interface Neutra para Fontes de Coleta (Abstração do Provedor Externa).
 * Focada na sincronização de pastas no Google Drive, descoberta automática e ingestão para tabulação.
 */
export interface ICollectionProvider {
  /**
   * Identificador do provedor de coleta (ex: 'GOOGLE_WORKSPACE', 'GOOGLE_FORMS')
   */
  readonly providerId: string;

  /**
   * Nome amigável do provedor de coleta
   */
  readonly providerName: string;

  /**
   * Navega na estrutura de pastas no Google Drive (ou provedor similar) para localizar pastas de pesquisas
   */
  listFolders(parentFolderId?: string): Promise<DriveFolderItem[]>;

  /**
   * Explora uma pasta no Drive e identifica automaticamente formulários e planilhas vinculados via convenção de nomes
   */
  discoverSources(folderId: string): Promise<DriveSourceCandidate[]>;

  /**
   * Consulta as métricas em tempo real calculadas dinamicamente contra o quadro atual da empresa
   */
  fetchMetrics(
    binding: GoogleWorkspaceBinding | undefined,
    sources: CollectionSourceConfig[],
    currentEmployeeTarget: number
  ): Promise<CollectionMetrics>;

  /**
   * Extrai os dados brutos das respostas diretamente do Google Sheets para processamento no TabulationService
   */
  fetchRawData(
    sources: CollectionSourceConfig[],
    binding?: GoogleWorkspaceBinding
  ): Promise<CollectionRawData>;
}
