import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AlertFinding {
  id: string;
  growId: string;
  plantId: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  recommendation: string;
  status: 'active' | 'resolved';
  createdAt: any;
}

interface AlertsContextType {
  findings: AlertFinding[];
  loading: boolean;
  resolveFinding: (id: string) => Promise<void>;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export function AlertsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [findings, setFindings] = useState<AlertFinding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFindings([]);
      setLoading(false);
      return;
    }

    if (!db) return;

    setLoading(true);
    const q = query(
      collection(db, 'plant_findings'),
      where('userId', '==', user.uid),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(20),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setFindings(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AlertFinding));
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to findings', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const resolveFinding = async (id: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'plant_findings', id), { status: 'resolved' });
      // Optimistic update
      setFindings((prev) => prev.filter((f) => f.id !== id));
    } catch (e) {
      console.error('Failed to resolve finding', e);
    }
  };

  return (
    <AlertsContext.Provider value={{ findings, loading, resolveFinding }}>
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertsContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
}
