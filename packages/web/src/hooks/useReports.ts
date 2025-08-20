import { useState, useEffect } from 'react';
import { api, Report, ReportDetail } from '../lib/api';

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getReports();
      setReports(data.reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : '리포트를 불러오는데 실패했습니다.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return { reports, loading, error, refresh: fetchReports };
}

export function useLatestReport() {
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getLatestReport();
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : '최신 리포트를 불러오는데 실패했습니다.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestReport();
  }, []);

  return { report, loading, error, refresh: fetchLatestReport };
}