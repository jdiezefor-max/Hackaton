import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, Users } from 'lucide-react';

interface Response {
  id: string;
  challenge_id: string;
  team_id: string;
  user_name: string;
  content: string;
  type: 'text' | 'image' | 'video';
  votes_count: number;
  submitted_at: string;
  team?: {
    name: string;
    color: string;
  };
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'text' | 'image' | 'video';
}

interface KahootViewProps {
  eventId: string;
  onVote?: (responseId: string) => void;
}

export default function KahootView({ eventId, onVote }: KahootViewProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, [eventId]);

  useEffect(() => {
    if (selectedChallenge) {
      loadResponses(selectedChallenge);

      const channel = supabase
        .channel(`responses-${selectedChallenge}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'responses',
            filter: `challenge_id=eq.${selectedChallenge}`,
          },
          () => {
            loadResponses(selectedChallenge);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'votes',
          },
          () => {
            loadResponses(selectedChallenge);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedChallenge]);

  const loadChallenges = async () => {
    const { data, error } = await supabase
      .from('challenges')
      .select('id, title, description, type')
      .eq('event_id', eventId)
      .order('order');

    if (!error && data) {
      setChallenges(data);
      if (data.length > 0 && !selectedChallenge) {
        setSelectedChallenge(data[0].id);
      }
    }
    setLoading(false);
  };

  const loadResponses = async (challengeId: string) => {
    const { data, error } = await supabase
      .from('responses')
      .select(`
        *,
        team:teams(name, color)
      `)
      .eq('challenge_id', challengeId)
      .order('submitted_at', { ascending: false });

    if (!error && data) {
      setResponses(data as any);
    }
  };

  const currentChallenge = challenges.find((c) => c.id === selectedChallenge);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="text-white text-2xl font-bold">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Vista Kahoot</h1>
          <p className="text-blue-100">Respuestas en tiempo real</p>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {challenges.map((challenge) => (
            <button
              key={challenge.id}
              onClick={() => setSelectedChallenge(challenge.id)}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
                selectedChallenge === challenge.id
                  ? 'bg-white text-blue-600 shadow-lg scale-105'
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              {challenge.title}
            </button>
          ))}
        </div>

        {currentChallenge && (
          <div className="bg-white rounded-xl shadow-2xl p-8 mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              {currentChallenge.title}
            </h2>
            <p className="text-gray-600 mb-4">{currentChallenge.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{responses.length} respuestas</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>Tipo: {currentChallenge.type}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {responses.map((response) => (
            <div
              key={response.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105"
              style={{
                borderTop: `4px solid ${response.team?.color || '#3B82F6'}`,
              }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-800">{response.user_name}</h3>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: response.team?.color || '#3B82F6' }}
                    >
                      {response.team?.name || 'Sin equipo'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {response.votes_count}
                    </div>
                    <div className="text-xs text-gray-500">votos</div>
                  </div>
                </div>

                {response.type === 'text' && (
                  <p className="text-gray-700 mb-4 line-clamp-3">{response.content}</p>
                )}

                {response.type === 'image' && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img
                      src={response.content}
                      alt="Respuesta"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                {response.type === 'video' && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <video
                      src={response.content}
                      controls
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                {(response.type === 'image' || response.type === 'video') && onVote && (
                  <button
                    onClick={() => onVote(response.id)}
                    className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                  >
                    Votar
                  </button>
                )}

                <div className="mt-3 text-xs text-gray-400">
                  {new Date(response.submitted_at).toLocaleString('es-ES')}
                </div>
              </div>
            </div>
          ))}
        </div>

        {responses.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">
              No hay respuestas todavía para esta prueba
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
