import {
  ICollectionProvider,
  CollectionMetrics,
  CollectionRawData,
} from './ICollectionProvider';
import {
  CollectionSourceConfig,
  DriveFolderItem,
  DriveSourceCandidate,
  GoogleWorkspaceBinding,
} from '../../domain/types';
import { mockGoogleWorkspaceProvider } from './MockGoogleWorkspaceProvider';

/**
 * Provedor de Infraestrutura do Google Forms / Google Sheets.
 * Esta classe isola a tecnologia da Google da camada de domínio da aplicação,
 * implementando navegação do Drive, descoberta de formulários e leitura de planilhas.
 */
export class GoogleFormsProvider implements ICollectionProvider {
  public readonly providerId = 'GOOGLE_FORMS';
  public readonly providerName = 'Google Workspace Forms & Sheets';

  public async listFolders(parentFolderId = 'root'): Promise<DriveFolderItem[]> {
    return mockGoogleWorkspaceProvider.listFolders(parentFolderId);
  }

  public async discoverSources(folderId: string): Promise<DriveSourceCandidate[]> {
    return mockGoogleWorkspaceProvider.discoverSources(folderId);
  }

  public async fetchMetrics(
    binding: GoogleWorkspaceBinding | undefined,
    sources: CollectionSourceConfig[],
    currentEmployeeTarget: number
  ): Promise<CollectionMetrics> {
    return mockGoogleWorkspaceProvider.fetchMetrics(binding, sources, currentEmployeeTarget);
  }

  public async fetchRawData(
    sources: CollectionSourceConfig[],
    binding?: GoogleWorkspaceBinding
  ): Promise<CollectionRawData> {
    return mockGoogleWorkspaceProvider.fetchRawData(sources, binding);
  }
}
