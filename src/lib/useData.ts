import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Company, Unit, Sector, Assessment, ActionPlan } from '../types';
import { useAuth } from './AuthContext';

export function useData() {
  const { user, profile } = useAuth();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) {
      setCompanies([]);
      setAssessments([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const qCompanies = profile.role === 'Client' && profile.companyId 
      ? query(collection(db, 'companies'), where('id', '==', profile.companyId))
      : collection(db, 'companies');
      
    const unsubs: (() => void)[] = [];

    const unsubComp = onSnapshot(qCompanies, 
      (snap) => {
        const comps = snap.docs.map(d => ({ ...d.data(), id: d.id } as Company));
        setCompanies(comps);
        setLoading(false);
      }, 
      (err) => {
        setLoading(false);
        handleFirestoreError(err, OperationType.LIST, 'companies');
      }
    );
    unsubs.push(unsubComp);

    let qAssessments = collection(db, 'assessments');
    if (profile.role === 'Client' && profile.companyId) {
      qAssessments = query(collection(db, 'assessments'), where('companyId', '==', profile.companyId)) as ReturnType<typeof collection>;
    }
    
    const unsubAsses = onSnapshot(qAssessments, 
      (snap) => {
        const acts = snap.docs.map(d => ({ ...d.data(), id: d.id } as Assessment));
        setAssessments(acts);
      },
      (err) => {
        setLoading(false);
        handleFirestoreError(err, OperationType.LIST, 'assessments');
      }
    );
    unsubs.push(unsubAsses);

    return () => {
      unsubs.forEach(fn => fn());
    };
  }, [user, profile]);

  const saveAssessment = async (assessment: Partial<Assessment> & { id: string }) => {
    try {
      const docRef = doc(db, 'assessments', assessment.id);
      
      // we need to inject updatedAt
      await setDoc(docRef, {
        ...assessment,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `assessments/${assessment.id}`);
    }
  };

  const createAssessment = async (assessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt' | 'creatorId'>) => {
     try {
        if (!user?.uid) throw new Error('User not authenticated');
        
        const docRef = doc(collection(db, 'assessments'));
        const newAssessment = {
          ...assessment,
          id: docRef.id,
          creatorId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(docRef, newAssessment);
       return docRef.id;
     } catch (e) {
       handleFirestoreError(e, OperationType.CREATE, 'assessments');
     }
  };

  const createCompany = async (company: Omit<Company, 'id'>) => {
    try {
      if (!user?.uid) throw new Error('User not authenticated');

      const docRef = doc(collection(db, 'companies'));
      await setDoc(docRef, {
        ...company,
        id: docRef.id,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'companies');
    }
  }

  const updateCompany = async (id: string, data: Partial<Company>) => {
    try {
      const docRef = doc(db, 'companies', id);
      await setDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `companies/${id}`);
    }
  }

  const deleteCompany = async (id: string) => {
    try {
      const docRef = doc(db, 'companies', id);
      await deleteDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `companies/${id}`);
    }
  }

  const resetDatabase = async () => {
    try {
      setLoading(true);
      
      // Clear Assessments
      const { getDocs } = await import('firebase/firestore');
      const assessmentsSnap = await getDocs(collection(db, 'assessments'));
      for (const d of assessmentsSnap.docs) {
        await deleteDoc(doc(db, 'assessments', d.id));
      }

      // Clear Action Plans
      const actionPlansSnap = await getDocs(collection(db, 'actionPlans'));
      for (const d of actionPlansSnap.docs) {
        await deleteDoc(doc(db, 'actionPlans', d.id));
      }

      setLoading(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'all collections');
    }
  }

  return {
    companies,
    assessments,
    loading,
    saveAssessment,
    createAssessment,
    createCompany,
    updateCompany,
    deleteCompany,
    resetDatabase
  };
}

