import { useState, useMemo, useCallback } from 'react';
import {
  CompanySurveyMetric,
  SurveyFilterOptions,
  SurveyKpiData,
  SurveyStatus,
} from '../types/survey';
import { INITIAL_MOCK_SURVEYS, calculateStatus } from '../data/mockSurveys';

const EMPLOYEE_COUNTS_KEY = 'conexarp_survey_employee_counts_v2';

export function useSurveyMetrics() {
  // Load saved employee counts overrides from localStorage
  const [storedCounts, setStoredCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(EMPLOYEE_COUNTS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // State for all 30 mock metrics
  const [rawMetrics, setRawMetrics] = useState<CompanySurveyMetric[]>(() => {
    return INITIAL_MOCK_SURVEYS.map((item) => {
      const count = storedCounts[item.id] ?? item.employeeCount;
      const total = item.collabResponses + item.managerResponses;
      const pct = count > 0 ? (total / count) * 100 : 0;
      const missing = Math.max(0, count - total);
      const status = calculateStatus(item.collabResponses, item.managerResponses, count);

      return {
        ...item,
        employeeCount: count,
        totalResponses: total,
        participationPercentage: pct,
        missingResponses: missing,
        status,
      };
    });
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Filters State
  const [filters, setFilters] = useState<SurveyFilterOptions>({
    client: 'ALL',
    economicGroup: 'ALL',
    company: 'ALL',
    status: 'ALL',
    onlyReady: false,
    searchQuery: '',
  });

  // Update employee count for a company
  const updateEmployeeCount = useCallback((companyId: string, count: number) => {
    const validCount = Math.max(0, isNaN(count) ? 0 : count);

    setStoredCounts((prev) => {
      const updated = { ...prev, [companyId]: validCount };
      try {
        localStorage.setItem(EMPLOYEE_COUNTS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Error storing employee count', e);
      }
      return updated;
    });

    setRawMetrics((prevMetrics) =>
      prevMetrics.map((item) => {
        if (item.id === companyId) {
          const total = item.collabResponses + item.managerResponses;
          const pct = validCount > 0 ? (total / validCount) * 100 : 0;
          const missing = Math.max(0, validCount - total);
          const status = calculateStatus(item.collabResponses, item.managerResponses, validCount);

          return {
            ...item,
            employeeCount: validCount,
            totalResponses: total,
            participationPercentage: pct,
            missingResponses: missing,
            status,
          };
        }
        return item;
      })
    );
  }, []);

  // Simulate refresh / recalculation
  const refreshMetrics = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setLastRefreshedAt(new Date());
      setLoading(false);
    }, 500);
  }, []);

  // Unique options for dropdowns
  const uniqueClients = useMemo(() => {
    const set = new Set<string>();
    rawMetrics.forEach((m) => set.add(m.clientName));
    return Array.from(set).sort();
  }, [rawMetrics]);

  const uniqueEconomicGroups = useMemo(() => {
    const set = new Set<string>();
    rawMetrics.forEach((m) => {
      if (m.economicGroup) set.add(m.economicGroup);
    });
    return Array.from(set).sort();
  }, [rawMetrics]);

  const uniqueCompanies = useMemo(() => {
    return rawMetrics.map((m) => m.companyName).sort();
  }, [rawMetrics]);

  // Filtered metrics
  const filteredMetrics = useMemo(() => {
    return rawMetrics.filter((item) => {
      // Filter by Client
      if (filters.client !== 'ALL' && item.clientName !== filters.client) {
        return false;
      }

      // Filter by Economic Group
      if (filters.economicGroup !== 'ALL') {
        if (filters.economicGroup === 'DIRECT') {
          if (item.economicGroup) return false;
        } else if (item.economicGroup !== filters.economicGroup) {
          return false;
        }
      }

      // Filter by Company
      if (filters.company !== 'ALL' && item.companyName !== filters.company) {
        return false;
      }

      // Filter by Status
      if (filters.status !== 'ALL' && item.status !== filters.status) {
        return false;
      }

      // Filter "Only Ready"
      if (filters.onlyReady && item.status !== 'READY') {
        return false;
      }

      // Search Query
      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase();
        const matchName = item.companyName.toLowerCase().includes(query);
        const matchGroup = item.economicGroup?.toLowerCase().includes(query);
        const matchClient = item.clientName.toLowerCase().includes(query);
        if (!matchName && !matchGroup && !matchClient) return false;
      }

      return true;
    });
  }, [rawMetrics, filters]);

  // Calculated KPIs
  const kpis: SurveyKpiData = useMemo(() => {
    let totalCompanies = rawMetrics.length;
    let readyCompanies = 0;
    let waitingManagerCompanies = 0;
    let inProgressCompanies = 0;
    let noResponseCompanies = 0;
    let totalResponses = 0;

    rawMetrics.forEach((item) => {
      totalResponses += item.totalResponses;
      switch (item.status) {
        case 'READY':
          readyCompanies++;
          break;
        case 'WAITING_MANAGER':
          waitingManagerCompanies++;
          break;
        case 'IN_PROGRESS':
          inProgressCompanies++;
          break;
        case 'NONE':
          noResponseCompanies++;
          break;
      }
    });

    return {
      totalCompanies,
      readyCompanies,
      waitingManagerCompanies,
      inProgressCompanies,
      noResponseCompanies,
      totalResponses,
    };
  }, [rawMetrics]);

  // Selected company for detail drawer
  const selectedCompany = useMemo(() => {
    if (!selectedCompanyId) return null;
    return rawMetrics.find((m) => m.id === selectedCompanyId) || null;
  }, [rawMetrics, selectedCompanyId]);

  return {
    metrics: filteredMetrics,
    rawMetrics,
    kpis,
    loading,
    lastRefreshedAt,
    filters,
    setFilters,
    uniqueClients,
    uniqueEconomicGroups,
    uniqueCompanies,
    updateEmployeeCount,
    refreshMetrics,
    selectedCompany,
    setSelectedCompanyId,
  };
}
