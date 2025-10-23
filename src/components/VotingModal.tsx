import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, ThumbsUp } from 'lucide-react';

interface VotingModalProps {
  responseId: string;
  onClose: () => void;
  onVoteSuccess: () => void;
}

export default function VotingModal({
  responseId,
  onClose,
  onVoteSuccess,
}: VotingModalProps) {
  const [voterName, setVoterName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVote = async () => {
    if (!voterName.trim()) {
      setError('Por favor, introduce tu nombre');
      return;
    }

    setLoading(true);
    setError('');

    const { error: voteError } = await supabase.from('votes').insert({
      response_id: responseId,
      voter_name: voterName.trim(),
    });

    setLoading(false);

    if (voteError) {
      if (voteError.code === '23505') {
        setError('Ya has votado esta respuesta');
      } else {
        setError('Error al enviar el voto');
      }
    } else {
      onVoteSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ThumbsUp className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Votar Respuesta</h2>
          <p className="text-gray-600 mt-2">Introduce tu nombre para votar</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tu nombre
            </label>
            <input
              type="text"
              value={voterName}
              onChange={(e) => setVoterName(e.target.value)}
              placeholder="Escribe tu nombre..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleVote();
                }
              }}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleVote}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 font-medium transition-all disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Votando...' : 'Votar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
