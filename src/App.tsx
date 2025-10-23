import { useState } from 'react';
import KahootView from './components/KahootView';
import Ranking from './components/Ranking';
import VotingModal from './components/VotingModal';
import { Trophy, Eye } from 'lucide-react';

function App() {
  const [view, setView] = useState<'kahoot' | 'ranking'>('kahoot');
  const [votingResponseId, setVotingResponseId] = useState<string | null>(null);
  const eventId = 'demo-event-001';

  const handleVote = (responseId: string) => {
    setVotingResponseId(responseId);
  };

  const handleVoteSuccess = () => {
    setVotingResponseId(null);
  };

  return (
    <>
      <div className="min-h-screen">
        <nav className="bg-white shadow-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Gymkana Manager
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setView('kahoot')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${
                    view === 'kahoot'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Eye className="w-5 h-5" />
                  Vista Kahoot
                </button>
                <button
                  onClick={() => setView('ranking')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${
                    view === 'ranking'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Trophy className="w-5 h-5" />
                  Ranking
                </button>
              </div>
            </div>
          </div>
        </nav>

        {view === 'kahoot' && <KahootView eventId={eventId} onVote={handleVote} />}
        {view === 'ranking' && <Ranking eventId={eventId} />}
      </div>

      {votingResponseId && (
        <VotingModal
          responseId={votingResponseId}
          onClose={() => setVotingResponseId(null)}
          onVoteSuccess={handleVoteSuccess}
        />
      )}
    </>
  );
}

export default App;
