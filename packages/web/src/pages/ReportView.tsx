import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  SparklesIcon,
  LightBulbIcon,
  CpuChipIcon,
  CheckBadgeIcon,
  TagIcon,
  CalendarIcon,
  BeakerIcon,
  ChartBarIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  FolderIcon,
  CogIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface AIAnalysisReport {
  projectId: string;
  sessionId?: string;
  analysis: {
    summary: string;
    keyInsights: string[];
    technicalDetails: string[];
    recommendations: string[];
    complexity: 'low' | 'medium' | 'high';
    topics: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    codeChanges?: string[];
    filesModified?: string[];
    technologies?: string[];
    errors?: string[];
    performance?: string;
  };
  analyzedAt: string;
  model: string;
}

function ReportView() {
  const { projectId, sessionId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<AIAnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReport();
  }, [projectId, sessionId]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const url = sessionId 
        ? `http://localhost:3001/api/projects/${projectId}/ai-analysis?sessionId=${sessionId}`
        : `http://localhost:3001/api/projects/${projectId}/ai-analysis`;
        
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('리포트를 불러올 수 없습니다.');
      }
      
      const data = await response.json();
      setReport(data.aiAnalysis);
      setError('');
    } catch (err: any) {
      setError(err.message || '리포트 로드 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportAsPDF = () => {
    window.print();
  };

  const exportAsJSON = () => {
    if (!report) return;
    
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = sessionId 
      ? `report-${projectId}-${sessionId}.json`
      : `report-${projectId}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getProjectDisplayName = (name: string) => {
    if (name.startsWith('-Users-')) {
      const parts = name.split('-');
      return parts.slice(-2).join('/');
    }
    return name;
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 dark:text-green-400';
      case 'negative': return 'text-red-600 dark:text-red-400';
      case 'neutral': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-dark-700 border-t-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">리포트 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-8 max-w-md">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300 text-center mb-6">
            {error || '리포트를 찾을 수 없습니다.'}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 print:bg-white">
      {/* 헤더 */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 sticky top-0 z-10 print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI 분석 리포트
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getProjectDisplayName(projectId)}
                  {sessionId && ` / ${sessionId.replace('.jsonl', '')}`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportAsJSON}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
              >
                <DocumentArrowDownIcon className="h-4 w-4 inline mr-1" />
                JSON
              </button>
              <button
                onClick={exportAsPDF}
                className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <PrinterIcon className="h-4 w-4 inline mr-1" />
                인쇄
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Check if summary contains MDX/Markdown content */}
        {report.analysis.summary && (report.analysis.summary.includes('#') || report.analysis.summary.includes('##') || report.analysis.summary.includes('---')) ? (
          /* Render MDX content */
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-8">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              className="prose prose-lg dark:prose-invert max-w-none"
              components={{
                h1: ({children}) => <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 mt-8 first:mt-0">{children}</h1>,
                h2: ({children}) => <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-6">{children}</h2>,
                h3: ({children}) => <h3 className="text-xl font-medium text-gray-700 dark:text-gray-200 mb-3 mt-4">{children}</h3>,
                p: ({children}) => <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">{children}</p>,
                ul: ({children}) => <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700 dark:text-gray-300">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-700 dark:text-gray-300">{children}</ol>,
                li: ({children}) => <li className="ml-4">{children}</li>,
                code: ({inline, children}) => 
                  inline ? 
                    <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-dark-700 text-gray-800 dark:text-gray-200 rounded text-sm font-mono">{children}</code> :
                    <code className="block p-4 bg-gray-100 dark:bg-dark-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-mono overflow-x-auto">{children}</code>,
                blockquote: ({children}) => <blockquote className="border-l-4 border-primary-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4">{children}</blockquote>,
                hr: () => <hr className="my-8 border-t border-gray-200 dark:border-dark-700" />,
                em: ({children}) => <em className="text-gray-600 dark:text-gray-400 italic">{children}</em>,
                strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
              }}
            >
              {report.analysis.summary}
            </ReactMarkdown>
          </div>
        ) : (
          /* Render original format if not MDX */
          <>
            {/* 메타 정보 */}
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm mb-4 p-4">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">복잡도:</span>
                  <span className={`ml-2 font-medium ${getComplexityColor(report.analysis.complexity)}`}>
                    {report.analysis.complexity === 'high' ? '높음' :
                     report.analysis.complexity === 'medium' ? '보통' : '낮음'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">감정톤:</span>
                  <span className={`ml-2 font-medium ${getSentimentColor(report.analysis.sentiment)}`}>
                    {report.analysis.sentiment === 'positive' ? '긍정적' :
                     report.analysis.sentiment === 'negative' ? '부정적' : '중립'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">분석모델:</span>
                  <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">
                    {report.model === 'claude-code-local' ? 'Claude' : report.model}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">분석시간:</span>
                  <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">
                    {new Date(report.analyzedAt).toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* 요약 */}
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm mb-4 p-6">
              <div className="flex items-center mb-3">
                <SparklesIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">작업 요약</h2>
              </div>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {report.analysis.summary}
              </div>
            </div>

            {/* 핵심 인사이트 */}
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm mb-4 p-6">
              <div className="flex items-center mb-3">
                <LightBulbIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">핵심 인사이트</h2>
              </div>
              <ul className="space-y-2">
                {report.analysis.keyInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-primary-500 mr-2 font-medium">{idx + 1}.</span>
                    <span className="text-gray-700 dark:text-gray-300 flex-1">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 코드 변경사항 */}
            {report.analysis.codeChanges && report.analysis.codeChanges.length > 0 && (
              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm mb-4 p-6">
                <div className="flex items-center mb-3">
                  <CodeBracketIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">코드 변경사항</h2>
                </div>
                <ul className="space-y-2">
                  {report.analysis.codeChanges.map((change, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-gray-500 mr-2">•</span>
                      <span className="text-gray-700 dark:text-gray-300 font-mono text-sm">{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 수정된 파일 */}
            {report.analysis.filesModified && report.analysis.filesModified.length > 0 && (
              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm mb-4 p-6">
                <div className="flex items-center mb-3">
                  <FolderIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">수정된 파일</h2>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {report.analysis.filesModified.map((file, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <DocumentTextIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-700 dark:text-gray-300 font-mono">{file}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 기술적 세부사항 */}
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm mb-4 p-6">
              <div className="flex items-center mb-3">
                <CpuChipIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">기술적 세부사항</h2>
              </div>
              <ul className="space-y-2">
                {report.analysis.technicalDetails.map((detail, idx) => (
                  <li key={idx} className="flex items-start">
                    <BeakerIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 사용된 기술 */}
            {report.analysis.technologies && report.analysis.technologies.length > 0 && (
              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm mb-4 p-6">
                <div className="flex items-center mb-3">
                  <CogIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">사용된 기술 스택</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {report.analysis.technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 에러 및 문제점 */}
            {report.analysis.errors && report.analysis.errors.length > 0 && (
              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm mb-4 p-6">
                <div className="flex items-center mb-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">발견된 문제점</h2>
                </div>
                <ul className="space-y-2">
                  {report.analysis.errors.map((error, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-red-500 mr-2">!</span>
                      <span className="text-gray-700 dark:text-gray-300">{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 개선 권장사항 */}
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm mb-4 p-6">
              <div className="flex items-center mb-3">
                <CheckBadgeIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">개선 권장사항</h2>
              </div>
              <ul className="space-y-2">
                {report.analysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 성능 메트릭 */}
            {report.analysis.performance && (
              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm mb-4 p-6">
                <div className="flex items-center mb-3">
                  <ChartBarIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">성능 분석</h2>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{report.analysis.performance}</p>
              </div>
            )}

            {/* 주요 토픽 */}
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm mb-4 p-6">
              <div className="flex items-center mb-3">
                <TagIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">주요 토픽</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {report.analysis.topics.map((topic, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg text-sm"
                  >
                    #{topic}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ReportView;