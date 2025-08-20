import React from 'react';

function Calendar() {
  const today = new Date();
  const currentMonth = today.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">캘린더</h2>
        <p className="text-gray-600 mb-6">
          날짜별로 분석 내역을 확인하고 재분석을 실행할 수 있습니다.
        </p>
        
        <div className="border rounded-lg p-4">
          <div className="text-center font-semibold text-lg mb-4">{currentMonth}</div>
          
          <div className="grid grid-cols-7 gap-2 text-center text-sm">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className="font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
            
            {/* 임시 캘린더 그리드 */}
            {Array.from({ length: 35 }, (_, i) => (
              <div
                key={i}
                className="aspect-square border rounded hover:bg-gray-50 cursor-pointer flex items-center justify-center"
              >
                <span className="text-gray-400">{i < 31 ? i + 1 : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Calendar;