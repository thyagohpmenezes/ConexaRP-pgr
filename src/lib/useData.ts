import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';
import { 
  Assessment, 
  Company,
  AssessmentStatus
} from '../types';

export function useData() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const parseJsonSafely = (val: any, defaultVal: any) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return defaultVal; }
    }
    return val || defaultVal;
  };

  const mapFromDB = (data: any): Assessment => ({
    ...data,
    companyId: data.organization_id,
    domains: parseJsonSafely(data.domains, []),
    checklist: parseJsonSafely(data.checklist, { conforming: 0, partial: 0, nonConforming: 0, notApplicable: 0 }),
    sectorBreakdown: parseJsonSafely(data.sector_breakdown, {}),
    actions: parseJsonSafely(data.actions, []),
    triangulationScore: Number(data.triangulation_score) || 0,
    riskScore: Number(data.risk_score) || 0,
    updatedAt: data.updated_at
  });

  const mapToDB = (data: Partial<Assessment>) => {
    const payload: any = { ...data };
    if (data.companyId) payload.organization_id = data.companyId;
    if (data.sectorBreakdown) payload.sector_breakdown = data.sectorBreakdown;
    if (data.triangulationScore !== undefined) payload.triangulation_score = data.triangulationScore;
    if (data.riskScore !== undefined) payload.risk_score = data.riskScore;
    if (data.createdAt) payload.created_at = data.createdAt;
    
    delete payload.companyId;
    delete payload.sectorBreakdown;
    delete payload.triangulationScore;
    delete payload.riskScore;
    delete payload.updatedAt;
    delete payload.createdAt;
    
    return payload;
  };

  useEffect(() => {
    async function loadInitialData() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data: orgs, error: orgsError } = await supabase.from('organizations').select('*').order('name');
        if (orgsError) {
           console.error('[ConexaRP] Erro ao carregar empresas:', orgsError);
           alert(`Erro de leitura (Empresas): ${orgsError.message}. Verifique as políticas RLS no Supabase.`);
        }
        setCompanies(orgs || []);

        const { data: assts, error: asstsError } = await supabase.from('assessments').select('*').order('updated_at', { ascending: false });
        if (asstsError) {
           console.error('[ConexaRP] Erro ao carregar avaliações:', asstsError);
           alert(`Erro de leitura (Avaliações): ${asstsError.message}.`);
        }
        setAssessments((assts || []).map(mapFromDB));

        const { data: rpts } = await supabase.from('saved_reports').select('*').order('created_at', { ascending: false });
        setReports(rpts || []);
      } catch (err: any) {
        console.error('[ConexaRP] Erro fatal ao carregar dados:', err);
        alert(`Erro de conexão com o banco de dados: ${err.message || 'Desconhecido'}`);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [user]);

  const saveAssessment = async (assessment: Partial<Assessment> & { id: string }) => {
    try {
      const payload = mapToDB(assessment);
      const { error } = await supabase
        .from('assessments')
        .upsert({ 
          ...payload, 
          user_id: user?.id,
          updated_at: new Date().toISOString() 
        });

      if (error) throw error;

      setAssessments(prev => {
        const exists = prev.find(a => a.id === assessment.id);
        if (exists) {
          return prev.map(a => a.id === assessment.id ? { ...a, ...assessment } : a);
        }
        return [{ ...assessment } as Assessment, ...prev];
      });
    } catch (e: any) {
      alert(`Erro ao salvar avaliação: ${e.message || 'Erro desconhecido'}`);
      console.error(e);
    }
  };

  const createCompany = async (company: Partial<Company>) => {
    try {
      const { error, data } = await supabase
        .from('organizations')
        .insert({ 
          ...company, 
          user_id: user?.id,
          updated_at: new Date().toISOString() 
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setCompanies(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        return data;
      }
    } catch (e: any) {
      alert(`Erro ao criar empresa: ${e.message || 'Erro desconhecido'}`);
      console.error(e);
    }
  };

  const updateCompany = async (id: string, updates: Partial<Company>) => {
    try {
      const { error, data } = await supabase
        .from('organizations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) setCompanies(prev => prev.map(c => c.id === id ? data : c));
      return data;
    } catch (e) {
      console.error(e);
    }
  };

  const saveReport = async (report: any) => {
    try {
      const { assessmentId, organizationId, ...rest } = report;
      const payload = {
        ...rest,
        assessment_id: assessmentId,
        organization_id: organizationId,
        user_id: user?.id, // Garantir vínculo com o usuário
        created_at: new Date().toISOString()
      };
      const { error, data } = await supabase.from('saved_reports').insert([payload]).select().single();
      if (error) throw error;
      if (data) setReports(prev => [data, ...prev]);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteAssessment = async (id: string) => {
    try {
      await supabase.from('assessments').delete().eq('id', id);
      setAssessments(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const deleteCompany = async (id: string) => {
    try {
      await supabase.from('organizations').delete().eq('id', id);
      setCompanies(prev => prev.filter(c => c.id !== id));
      setAssessments(prev => prev.filter(a => a.companyId !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return {
    assessments,
    companies,
    reports,
    loading,
    saveAssessment,
    createCompany,
    updateCompany,
    saveReport,
    deleteAssessment,
    deleteCompany,
    resetDatabase: async () => {}
  };
}
