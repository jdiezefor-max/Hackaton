import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Medal, Award, Star } from 'lucide-react';

interface TeamScore {
  team_id: string;
  team_name: string;
  team_color: string;
  total_points: number;
  completed_challenges: number;
  total_votes: number;
}

interface RankingProps {
  eventId: string;
}

export default function Ranking({ eventId }: RankingProps) {
  const [rankings, setRankings] = useState<TeamScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();

    const channel = supabase
      .channel(`ranking-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'responses',
        },
        () => {
          loadRankings();
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
          loadRankings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const loadRankings = async () => {
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, color')
      .eq('event_id', eventId);

    if (teamsError || !teams) {
      setLoading(false);
      return;
    }

    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select(`
        team_id,
        votes_count,
        challenge:challenges(points)
      `);

    if (responsesError || !responses) {
      setLoading(false);
      return;
    }

    const teamScores: TeamScore[] = teams.map((team) => {
      const teamResponses = responses.filter((r) => r.team_id === team.id);

      const totalPoints = teamResponses.reduce((sum, response) => {
        const basePoints = (response.challenge as any)?.points || 0;
        const voteBonus = response.votes_count * 2;
        return sum + basePoints + voteBonus;
      }, 0);

      const totalVotes = teamResponses.reduce(
        (sum, response) => sum + response.votes_count,
        0
      );

      return {
        team_id: team.id,
        team_name: team.name,
        team_color: team.color,
        total_points: totalPoints,
        completed_challenges: teamResponses.length,
        total_votes: totalVotes,
      };
    });

    teamScores.sort((a, b) => b.total_points - a.total_points);

    setRankings(teamScores);
    setLoading(false);
  };

  const getPodiumIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-8 h-8" />;
      case 2:
        return <Medal className="w-8 h-8" />;
      case 3:
        return <Award className="w-8 h-8" />;
      default:
        return <Star className="w-6 h-6" />;
    }
  };

  const getPodiumColor = (position: number) => {
    switch (position) {
      case 1:
        return 'from-yellow-400 to-yellow-600';
      case 2:
        return 'from-gray-300 to-gray-500';
      case 3:
        return 'from-orange-400 to-orange-600';
      default:
        return 'from-blue-400 to-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-bold text-gray-600">Cargando ranking...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-2">Ranking Final</h1>
          <p className="text-purple-200 text-lg">Puntuaciones por Equipo</p>
        </div>

        <div className="space-y-4">
          {rankings.map((team, index) => {
            const position = index + 1;
            const isPodium = position <= 3;

            return (
              <div
                key={team.team_id}
                className={`relative overflow-hidden rounded-2xl transition-all hover:scale-102 ${
                  isPodium
                    ? 'bg-gradient-to-r ' + getPodiumColor(position)
                    : 'bg-white bg-opacity-10 backdrop-blur-lg'
                } ${position === 1 ? 'shadow-2xl shadow-yellow-500/50 scale-105' : 'shadow-xl'}`}
              >
                <div className="p-6">
                  <div className="flex items-center gap-6">
                    <div
                      className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl ${
                        isPodium
                          ? 'bg-white bg-opacity-30 text-white'
                          : 'bg-white bg-opacity-20 text-white'
                      }`}
                    >
                      {position === 1 || position === 2 || position === 3 ? (
                        getPodiumIcon(position)
                      ) : (
                        position
                      )}
                    </div>

                    <div className="flex-grow">
                      <h3
                        className={`text-2xl font-bold mb-1 ${
                          isPodium ? 'text-white' : 'text-white'
                        }`}
                      >
                        {team.team_name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm">
                        <span
                          className={isPodium ? 'text-white text-opacity-90' : 'text-purple-200'}
                        >
                          {team.completed_challenges} pruebas completadas
                        </span>
                        <span
                          className={isPodium ? 'text-white text-opacity-90' : 'text-purple-200'}
                        >
                          {team.total_votes} votos recibidos
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-4xl font-bold ${
                          isPodium ? 'text-white' : 'text-white'
                        }`}
                      >
                        {team.total_points}
                      </div>
                      <div
                        className={`text-sm ${
                          isPodium ? 'text-white text-opacity-80' : 'text-purple-300'
                        }`}
                      >
                        puntos
                      </div>
                    </div>
                  </div>
                </div>

                {position === 1 && (
                  <div className="absolute top-0 right-0 -mt-2 -mr-2">
                    <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                      GANADOR
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {rankings.length === 0 && (
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-12 text-center">
            <p className="text-white text-lg">No hay equipos todavía</p>
          </div>
        )}

        <div className="mt-12 bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Sistema de Puntuación</h3>
          <div className="space-y-2 text-purple-200">
            <p>• Puntos base por completar cada prueba</p>
            <p>• +2 puntos adicionales por cada voto recibido</p>
            <p>• El equipo con más puntos gana</p>
          </div>
        </div>
      </div>
    </div>
  );
}
