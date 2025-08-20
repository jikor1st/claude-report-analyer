import React from 'react';
import { useLatestReport } from '../hooks/useReports';
import { StatsCard } from '../components/StatsCard';
import { SessionChart } from '../components/SessionChart';
import { SessionList } from '../components/SessionList';

function Dashboard() {
  const { report, loading, error } = useLatestReport();

  // 차트 데이터 준비
  const sessionChartData = report?.sessions.map((session, index) => ({
    name: `세션 ${index + 1}`,
    value: session.totalMessages,
  })) || [];

  const topicsChartData = report?.summary.topTopics.slice(0, 5).map(topic => ({
    name: topic,
    value: report.sessions.filter(s => s.topics.includes(topic)).length,
  })) || [];

  return (
    <div className="space-y-6">
      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="총 세션"
          value={report?.summary.totalSessions || 0}
          color="blue"
          icon="📊"
        />
        <StatsCard
          title="총 메시지"
          value={report?.summary.totalMessages || 0}
          color="green"
          icon="💬"
        />
        <StatsCard
          title="코드 블록"
          value={report?.summary.totalCodeBlocks || 0}
          color="purple"
          icon="📝"
        />
        <StatsCard
          title="분석된 파일"
          value={report?.filesAnalyzed || 0}
          color="orange"
          icon="📁"
        />
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SessionChart
          data={sessionChartData}
          type="bar"
          title="세션별 메시지 수"
        />
        <SessionChart
          data={topicsChartData}
          type="pie"
          title="주요 토픽 분포"
        />
      </div>

      {/* 세션 리스트 */}
      <SessionList 
        sessions={report?.sessions || []} 
        loading={loading}
      />
    </div>
  );
}

export default Dashboard;