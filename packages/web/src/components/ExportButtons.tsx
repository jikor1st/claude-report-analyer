import React, { useState } from 'react';

interface ExportButtonsProps {
  report: any;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ report }) => {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: 'json' | 'markdown' | 'pdf') => {
    setExporting(format);
    
    try {
      // API 엔드포인트로 내보내기 요청
      const response = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });

      if (response.ok) {
        // 파일 다운로드 처리
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // 파일 이름 설정
        const timestamp = new Date().toISOString().split('T')[0];
        const extension = format === 'json' ? 'json' : format === 'markdown' ? 'md' : 'pdf';
        a.download = `claude-report-${timestamp}.${extension}`;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('내보내기 실패');
      }
    } catch (error) {
      console.error(`${format} 내보내기 중 오류:`, error);
      alert(`${format.toUpperCase()} 내보내기 중 오류가 발생했습니다.`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleExport('json')}
        disabled={exporting === 'json'}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {exporting === 'json' ? '내보내는 중...' : 'JSON 내보내기'}
      </button>
      
      <button
        onClick={() => handleExport('markdown')}
        disabled={exporting === 'markdown'}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {exporting === 'markdown' ? '내보내는 중...' : 'Markdown 내보내기'}
      </button>
      
      <button
        onClick={() => handleExport('pdf')}
        disabled={exporting === 'pdf'}
        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {exporting === 'pdf' ? '내보내는 중...' : 'PDF 내보내기'}
      </button>
    </div>
  );
};