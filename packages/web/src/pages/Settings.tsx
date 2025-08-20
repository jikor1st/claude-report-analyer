import { useState, useEffect } from 'react';

interface Settings {
  claudeCodeProjectsPath: string;
  port: string;
  reportsDir: string;
  actualProjectsPath: string;
  pathExists: boolean;
}

interface SuggestedPath {
  path: string;
  label: string;
  exists: boolean;
}

function Settings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [suggestedPaths, setSuggestedPaths] = useState<SuggestedPath[]>([]);
  const [customPath, setCustomPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
    loadSuggestedPaths();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setSettings(data);
      setCustomPath(data.claudeCodeProjectsPath || '');
      setError('');
    } catch (err) {
      setError('설정을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestedPaths = async () => {
    try {
      const response = await fetch('/api/settings/suggested-paths');
      const data = await response.json();
      setSuggestedPaths(data.suggestedPaths);
    } catch (err) {
      console.error('경로 제안 로드 실패:', err);
    }
  };

  const saveSettings = async () => {
    if (!customPath) {
      setError('프로젝트 경로를 입력해주세요.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claudeCodeProjectsPath: customPath
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        await loadSettings();
        setTimeout(() => setMessage(''), 5000);
      } else {
        setError(data.error || '설정 저장에 실패했습니다.');
      }
    } catch (err) {
      setError('설정 저장 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const selectPath = (path: string) => {
    setCustomPath(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">설정</h1>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Claude Code 프로젝트 경로</h2>
            
            {/* 현재 설정 */}
            {settings && (
              <div className="mb-6 p-4 bg-gray-50 rounded">
                <div className="text-sm text-gray-600 mb-1">현재 사용 중인 경로:</div>
                <div className="font-mono text-sm text-gray-900">
                  {settings.actualProjectsPath}
                </div>
                <div className="mt-2">
                  {settings.pathExists ? (
                    <span className="text-green-600 text-sm">✓ 경로가 존재합니다</span>
                  ) : (
                    <span className="text-red-600 text-sm">✗ 경로가 존재하지 않습니다</span>
                  )}
                </div>
              </div>
            )}

            {/* 제안된 경로 */}
            {suggestedPaths.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">제안된 경로:</h3>
                <div className="space-y-2">
                  {suggestedPaths.map((suggested, index) => (
                    <div
                      key={index}
                      className={`border rounded p-3 cursor-pointer hover:bg-gray-50 ${
                        customPath === suggested.path ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => selectPath(suggested.path)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-mono text-sm text-gray-900">
                            {suggested.path}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {suggested.label}
                          </div>
                        </div>
                        <div>
                          {suggested.exists ? (
                            <span className="text-green-600 text-sm">✓ 존재</span>
                          ) : (
                            <span className="text-gray-400 text-sm">미존재</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 사용자 정의 경로 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사용자 정의 경로:
              </label>
              <input
                type="text"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder="예: ~/.config/claude-code/projects"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                Claude Code 프로젝트가 저장된 폴더 경로를 입력하세요. (~는 홈 디렉토리로 자동 변환됩니다)
              </p>
            </div>

            {/* 저장 버튼 */}
            <div className="flex justify-end">
              <button
                onClick={saveSettings}
                disabled={saving || loading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {saving ? '저장 중...' : '설정 저장'}
              </button>
            </div>
          </div>
        </div>

        {/* 추가 설정 정보 */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">기타 설정</h2>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-600">API 서버 포트:</div>
              <div className="font-mono text-sm text-gray-900">{settings?.port || '3001'}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-600">분석 결과 저장 경로:</div>
              <div className="font-mono text-sm text-gray-900">{settings?.reportsDir || './claude-reports'}</div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 rounded">
            <p className="text-sm text-yellow-800">
              💡 설정 변경 후 서버 재시작이 필요할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;