
function Reports() {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">리포트</h2>
        <p className="text-gray-600 mb-6">
          생성된 분석 리포트를 확인하고 다운로드할 수 있습니다.
        </p>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                새로고침
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                필터
              </button>
            </div>
          </div>
          
          <div className="border rounded-lg divide-y">
            <div className="text-center py-12 text-gray-500">
              생성된 리포트가 없습니다.
              <br />
              <span className="text-sm">
                CLI에서 'claude-analyzer analyze' 명령어를 실행하여 분석을 시작하세요.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;